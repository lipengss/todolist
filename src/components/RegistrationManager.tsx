import { useState, useEffect } from "react";
import { getRegistrations, approveRegistration, rejectRegistration } from "../api/auth";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

export function RegistrationManager() {
  const [registrations, setRegistrations] = useState<{ id: string; username: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const list = await getRegistrations();
      setRegistrations(list);
      setHidden(list.length === 0);
    } catch {
      // not admin or error
    } finally {
      setLoading(false);
    }
  };

  const pending = registrations.filter(r => r.status === "pending");

  if (loading || hidden) return null;

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">注册审批</span>
        {pending.length > 0 && (
          <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
        )}
      </div>

      {registrations.length === 0 && <p className="text-xs text-muted-foreground">暂无申请</p>}

      <div className="space-y-2">
        {registrations.map((req) => (
          <div key={req.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-2 min-w-0">
              {req.status === "approved" ? (
                <CheckCircle className="w-4 h-4 text-chart-3 flex-shrink-0" />
              ) : req.status === "rejected" ? (
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-chart-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate">{req.username}</span>
            </div>
            {req.status === "pending" && (
              <div className="flex gap-1 flex-shrink-0">
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
        ))}
      </div>
    </div>
  );
}
