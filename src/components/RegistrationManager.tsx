import { useState, useEffect } from "react";
import { getRegistrations, approveRegistration, rejectRegistration, deleteRegistration } from "../api/auth";
import { Users, CheckCircle, XCircle, Clock, Trash2, Globe } from "lucide-react";

interface Reg {
  id: string;
  username: string;
  status: string;
  ip: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RegistrationManager() {
  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await getRegistrations();
      setRegistrations(list);
    } catch {
      // not admin or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pending = registrations.filter(r => r.status === "pending");

  if (loading) return null;
  if (registrations.length === 0) return null;

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">注册审批</span>
        {pending.length > 0 && (
          <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {registrations.map((req) => (
          <div key={req.id} className="py-2 px-3 rounded-lg border border-border bg-background space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {req.status === "approved" ? (
                  <CheckCircle className="w-4 h-4 text-chart-3 flex-shrink-0" />
                ) : req.status === "rejected" ? (
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-chart-4 flex-shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{req.username}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  req.status === "approved" ? "bg-chart-3/20 text-chart-3" :
                  req.status === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-chart-4/20 text-chart-4"
                }`}>
                  {req.status === "approved" ? "已通过" : req.status === "rejected" ? "已拒绝" : "待审批"}
                </span>
              </div>

              {req.status === "pending" && (
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={async () => { await approveRegistration(req.id); await load(); }}
                    className="p-1.5 rounded hover:bg-chart-3/20 text-chart-3"
                    title="通过"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await rejectRegistration(req.id); await load(); }}
                    className="p-1.5 rounded hover:bg-destructive/20 text-destructive"
                    title="拒绝"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {req.ip || "—"}
              </span>
              <span>{formatTime(req.createdAt)}</span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => { await deleteRegistration(req.id); await load(); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors py-0.5"
                title="删除记录"
              >
                <Trash2 className="w-3 h-3" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
