import { useState, useEffect, useRef, useCallback } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [sliderState, setSliderState] = useState<"idle" | "sliding" | "verified" | "failed">("idle");
  const [sliderX, setSliderX] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const captchaStartRef = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackWidthRef = useRef(0);

  const resetSlider = useCallback(() => {
    setSliderState("idle");
    setSliderX(0);
    setCaptchaToken("");
    captchaStartRef.current = 0;
  }, []);

  const handleSliderStart = async (_clientX: number) => {
    if (sliderState === "verified" || sliderState === "sliding") return;
    setSliderState("sliding");
    captchaStartRef.current = Date.now();
    try {
      const data = await fetchCaptcha();
      setCaptchaToken(data.token);
    } catch {
      resetSlider();
    }
  };

  const handleSliderMove = (clientX: number, rect: DOMRect) => {
    if (sliderState !== "sliding") return;
    const x = Math.max(0, Math.min(clientX - rect.left - 22, trackWidthRef.current));
    setSliderX(x);
  };

  const handleSliderEnd = () => {
    if (sliderState !== "sliding") return;
    const duration = Date.now() - captchaStartRef.current;
    const maxX = trackWidthRef.current;
    if (sliderX >= maxX * 0.9 && duration >= 800) {
      setSliderState("verified");
      setSliderX(maxX);
    } else {
      setSliderState("failed");
      setTimeout(resetSlider, 600);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const updateWidth = () => {
      trackWidthRef.current = (slider.querySelector("[data-track]") as HTMLElement)?.clientWidth ?? 0;
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
        setSubmitted(true);
      } else {
        await login(username, password, captchaToken);
        onLogin();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("验证码")) {
        setError("验证码错误或已过期");
        resetSlider();
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

          {!isRegister && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">验证码</label>
              <div
                ref={sliderRef}
                className="relative w-full h-11 rounded-lg bg-muted select-none overflow-hidden cursor-pointer"
                onMouseDown={(e) => { e.preventDefault(); handleSliderStart(e.clientX); }}
                onMouseMove={(e) => { if (sliderState === "sliding") { const r = e.currentTarget.getBoundingClientRect(); handleSliderMove(e.clientX, r); } }}
                onMouseUp={handleSliderEnd}
                onMouseLeave={() => { if (sliderState === "sliding") handleSliderEnd(); }}
                onTouchStart={(e) => { e.preventDefault(); handleSliderStart(e.touches[0].clientX); }}
                onTouchMove={(e) => { if (sliderState === "sliding") { const r = e.currentTarget.getBoundingClientRect(); handleSliderMove(e.touches[0].clientX, r); } }}
                onTouchEnd={handleSliderEnd}
              >
                <div
                  data-track
                  className="absolute inset-0 rounded-lg transition-colors"
                  style={{
                    background:
                      sliderState === "verified" ? "oklch(0.65 0.2 160)" :
                      sliderState === "failed" ? "oklch(0.65 0.2 30)" :
                      "oklch(0.87 0 0)",
                  }}
                />
                {sliderState === "verified" && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary-foreground">
                    验证通过
                  </span>
                )}
                {sliderState === "failed" && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary-foreground">
                    验证失败，请重试
                  </span>
                )}
                {sliderState === "idle" && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    请按住滑块拖动到最右侧
                  </span>
                )}
                {sliderState === "sliding" && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    请继续拖动...
                  </span>
                )}
                <div
                  className="absolute top-0.5 left-0.5 w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm transition-[background-color]"
                  style={{
                    transform: `translateX(${sliderX}px)`,
                    background: sliderState === "verified" ? "oklch(0.65 0.2 160)" : sliderState === "failed" ? "oklch(0.65 0.2 30)" : undefined,
                  }}
                >
                  {sliderState === "verified" ? (
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password || (!isRegister && sliderState !== "verified")}
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
