import { useState, useEffect } from "react";
import { getRegistrations, approveRegistration, rejectRegistration, deleteRegistration } from "../api/auth";
import { CheckCircle, XCircle, Clock, Trash2, Globe } from "lucide-react";

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

export function ApprovalPage() {
  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await getRegistrations();
      list.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setRegistrations(list);
    } catch {
      // not admin or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = registrations.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">用户审批</h2>
          <p className="text-sm text-muted-foreground mt-1">
            共 {registrations.length} 条记录
            {pendingCount > 0 && <span>，待审批 <span className="text-chart-4 font-medium">{pendingCount}</span> 人</span>}
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-card transition-colors"
        >
          刷新
        </button>
      </div>

      {registrations.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">暂无注册申请</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">用户名</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">状态</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">IP 地址</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">注册时间</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((req) => (
                <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{req.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      req.status === "approved" ? "bg-chart-3/20 text-chart-3" :
                      req.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-chart-4/20 text-chart-4"
                    }`}>
                      {req.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                       req.status === "rejected" ? <XCircle className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                      {req.status === "approved" ? "已通过" : req.status === "rejected" ? "已拒绝" : "待审批"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {req.ip || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(req.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={async () => { await approveRegistration(req.id); load(); }}
                            className="p-1.5 rounded hover:bg-chart-3/20 text-chart-3 transition-colors"
                            title="通过"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => { await rejectRegistration(req.id); load(); }}
                            className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                            title="拒绝"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={async () => { await deleteRegistration(req.id); load(); }}
                          className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
