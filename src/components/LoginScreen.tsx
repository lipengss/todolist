import { useState, useEffect, useRef, useCallback } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle, ArrowRight, X } from "lucide-react";

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
    return track.clientWidth - 44;
  };

  const onStart = useCallback((clientX: number) => {
    if (sliderDone) return;
    dragging.current = true;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 22;
    setThumbLeft(Math.max(0, Math.min(x, maxTravel())));
  }, [sliderDone]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging.current || sliderDone) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 22;
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
      } else if (msg.includes("401")) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => { if (!loading) onClose(); }} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-8 mx-4 z-10">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">申请已提交</h2>
            <p className="text-sm text-muted-foreground">等待管理员审批后即可登录。</p>
            <button onClick={() => { setSubmitted(false); setIsRegister(false); }} className="text-sm text-primary hover:underline">
              返回登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isRegister ? "提交注册申请" : "登录"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isRegister ? "创建账号，等待管理员审批" : "登录后同步你的数据"}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                placeholder="用户名"
                autoFocus
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                placeholder="密码（至少3个字符）"
              />

              {!isRegister && (
                <div>
                  <div ref={trackRef} className="relative h-10 rounded-lg border border-border bg-muted/30 select-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-75"
                      style={{ width: Math.max(0, thumbLeft + 22) }} />
                    <div
                      onMouseDown={(e) => onStart(e.clientX)}
                      onTouchStart={(e) => onStart(e.touches[0].clientX)}
                      className={`absolute top-1/2 -translate-y-1/2 w-10 h-8 bg-white rounded shadow flex items-center justify-center cursor-grab ${
                        sliderDone ? "bg-chart-3 text-white cursor-default" : ""
                      }`}
                      style={{ left: thumbLeft }}
                    >
                      {sliderDone ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 text-primary" />}
                    </div>
                    {!sliderDone && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-muted-foreground">拖动滑块完成验证</span>
                      </div>
                    )}
                    {sliderDone && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-chart-3">验证通过</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit"
              disabled={loading || !username || !password || (!isRegister && !sliderDone)}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm">
              {loading ? (isRegister ? "提交中..." : "登录中...") : (isRegister ? "提交申请" : "登录")}
            </button>

            <div className="text-center">
              <button type="button"
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isRegister ? "已有账号？去登录" : "没有账号？提交申请"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
