import { useState, useEffect, useRef } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lastClickRef = useRef(0);

  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha();
      setCaptchaSvg(data.svg);
      setCaptchaToken(data.token);
      setCaptchaText("");
    } catch {
      // silent
    }
  };

  useEffect(() => { loadCaptcha(); }, []);

  const handleCaptchaClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;
    loadCaptcha();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
        setSubmitted(true);
      } else {
        await login(username, password, captchaToken, captchaText);
        onLogin();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("验证码")) {
        setError("验证码错误或已过期");
        loadCaptcha();
      } else if (msg.includes("审批中")) {
        setError("你的申请正在审批中，请等待管理员通过");
      } else if (msg.includes("400")) {
        setError("你已提交过申请，请等待审批");
      } else if (msg.includes("401")) {
        setError("用户名或密码错误");
      } else {
        setError(isRegister ? "注册失败，请重试" : "登录失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">申请已提交</h1>
          <p className="text-sm text-muted-foreground">
            你的注册申请已提交，等待管理员审批后即可登录。
          </p>
          <button
            onClick={() => { setIsRegister(false); setSubmitted(false); setUsername(""); setPassword(""); }}
            className="text-sm text-primary hover:underline"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">FocusWorkspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "创建账号，等待管理员审批" : "登录以同步你的数据"}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
              placeholder="输入用户名（至少2个字符）"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
              placeholder={isRegister ? "输入密码（至少3个字符）" : "输入密码"}
            />
          </div>

          {!isRegister && captchaSvg && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">验证码</label>
              <div className="flex gap-3 items-center">
                <input
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  className="flex-1 h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="输入验证码"
                  maxLength={4}
                />
                <div
                  onClick={handleCaptchaClick}
                  className="flex-shrink-0 w-[82px] h-[42px] rounded-lg border border-border hover:border-primary cursor-pointer transition-colors overflow-hidden bg-white flex items-center justify-center"
                  title="看不清？点击图片刷新"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">看不清？点击图片刷新</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password || (!isRegister && !captchaText)}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (isRegister ? "提交中..." : "登录中...") : (isRegister ? "提交申请" : "登录")}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRegister ? "已有账号？去登录" : "没有账号？提交申请"}
          </button>
        </div>
      </form>
    </div>
  );
}
