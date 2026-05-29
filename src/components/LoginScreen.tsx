import { useState, useEffect, useRef, useCallback } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle, ArrowRight, X, UserCircle } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sliderToken, setSliderToken] = useState("");
  const [sliderDone, setSliderDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [thumbLeft, setThumbLeft] = useState(0);

  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha();
      setSliderToken(data.token);
      setThumbLeft(0);
      setSliderDone(false);
    } catch {}
  };

  useEffect(() => { if (open) { loadCaptcha(); setError(""); setIsRegister(false); setSubmitted(false); } }, [open]);

  const maxTravel = () => {
    const track = trackRef.current;
    if (!track) return 200;
    return track.clientWidth - 48;
  };

  const onStart = useCallback((clientX: number) => {
    if (sliderDone) return;
    dragging.current = true;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 24;
    setThumbLeft(Math.max(0, Math.min(x, maxTravel())));
  }, [sliderDone]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging.current || sliderDone) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 24;
    const pos = Math.max(0, Math.min(x, maxTravel()));
    setThumbLeft(pos);
    if (pos >= maxTravel() - 2) {
      dragging.current = false;
      setThumbLeft(maxTravel());
      setSliderDone(true);
    }
  }, [sliderDone]);

  const onEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!sliderDone) setThumbLeft(0);
  }, [sliderDone]);

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const mu = () => onEnd();
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const te = () => onEnd();
    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
    document.addEventListener("touchmove", tm);
    document.addEventListener("touchend", te);
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("mouseup", mu);
      document.removeEventListener("touchmove", tm);
      document.removeEventListener("touchend", te);
    };
  }, [onMove, onEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
        setSubmitted(true);
      } else {
        await login(username, password, sliderToken);
        onLogin();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("验证码")) {
        setError("验证码错误或已过期，请重新滑动");
        loadCaptcha();
      } else if (msg.includes("审批中")) {
        setError("你的申请正在审批中，请等待管理员通过");
      } else if (msg.includes("400")) {
        setError("你已提交过申请，请等待审批");
      } else if (msg.includes("401") || msg.includes("用户名")) {
        setError("用户名或密码错误");
      } else {
        setError(isRegister ? "注册失败，请重试" : "登录失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!loading) onClose(); }} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl z-10 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-10 px-8 space-y-4">
            <div className="w-16 h-16 bg-chart-3/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-chart-3" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">申请已提交</h2>
              <p className="text-sm text-muted-foreground mt-1.5">等待管理员审批后即可登录</p>
            </div>
            <button
              onClick={() => { setSubmitted(false); setIsRegister(false); }}
              className="text-sm text-primary hover:underline"
            >
              返回登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Avatar header */}
            <div className="bg-muted/30 pt-10 pb-6 px-8 text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-muted/50">
                <UserCircle className="w-9 h-9 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isRegister ? "注册账号" : "欢迎回来"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isRegister ? "提交申请，等待管理员审批" : "登录以同步你的数据"}
              </p>
            </div>

            {/* Form fields */}
            <div className="px-8 pb-8 pt-5 space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  placeholder="用户名"
                  autoFocus
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  placeholder="密码"
                />

                {!isRegister && (
                  <div>
                    <div ref={trackRef} className="relative h-12 rounded-full border border-border bg-background select-none overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary/10 rounded-l-full transition-[width] duration-75"
                        style={{ width: Math.max(0, thumbLeft + 28) }} />
                      {sliderDone && (
                        <div className="absolute inset-0 bg-chart-3/10 rounded-full" />
                      )}
                      <div
                        onMouseDown={(e) => onStart(e.clientX)}
                        onTouchStart={(e) => onStart(e.touches[0].clientX)}
                        className={`absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                          sliderDone
                            ? "left-auto right-0 bg-chart-3 text-white shadow-lg shadow-chart-3/30 cursor-default"
                            : "bg-white shadow-md shadow-black/10 hover:shadow-lg cursor-grab active:cursor-grabbing active:scale-105"
                        }`}
                        style={sliderDone ? {} : { left: Math.max(0, thumbLeft) }}
                      >
                        {sliderDone ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <ArrowRight className="w-4 h-4 text-primary/70" />
                            <ArrowRight className="w-4 h-4 text-primary/40" />
                            <ArrowRight className="w-4 h-4 text-primary/20" />
                          </div>
                        )}
                      </div>
                      {!sliderDone && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-sm text-muted-foreground/40 select-none">拖动滑块验证</span>
                        </div>
                      )}
                      {sliderDone && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-sm font-medium text-chart-3 select-none">验证通过</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password || (!isRegister && !sliderDone)}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (isRegister ? "提交中..." : "登录中...") : (isRegister ? "提交申请" : "登 录")}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isRegister ? "已有账号？去登录" : "没有账号？提交申请"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
