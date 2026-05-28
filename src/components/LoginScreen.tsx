import { useState } from "react";
import { login, register } from "../api/auth";
import { CheckCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, inviteCode);
      } else {
        await login(username, password);
      }
      onLogin();
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("邀请码")) setError("邀请码错误");
      else if (msg.includes("400")) setError("用户名已存在");
      else if (msg.includes("401")) setError("用户名或密码错误");
      else setError(isRegister ? "注册失败，请重试" : "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">FocusWorkspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "创建账号以开始使用" : "登录以同步你的数据"}
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

          {isRegister && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">邀请码</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
                placeholder="输入邀请码"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password || (isRegister && !inviteCode)}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (isRegister ? "注册中..." : "登录中...") : (isRegister ? "注册" : "登录")}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
          </button>
        </div>
      </form>
    </div>
  );
}
