import { useState, useEffect } from "react";
import { Users, Trash2, Shield, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
  lastLogin: string | null;
}

interface Stats {
  totalUsers: number;
  totalRequests: number;
  totalHistory: number;
  activeSessions: number;
  topTools: { tool: string; count: number }[];
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        apiFetch<User[]>("/admin/users"),
        apiFetch<Stats>("/admin/stats"),
      ]);
      setUsers(u);
      setStats(s);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const delUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>ADMIN PANEL</h1>
          <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>System management & statistics</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4444", fontFamily: "monospace" }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#ff4444" },
            { label: "Total Requests", value: stats.totalHistory, icon: TrendingUp, color: "#00ff41" },
            { label: "Active Sessions", value: stats.activeSessions, icon: Activity, color: "#00ffff" },
            { label: "Top Tool", value: stats.topTools[0]?.tool ?? "—", icon: Shield, color: "#ffaa00" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-lg p-4">
              <s.icon size={16} style={{ color: s.color, marginBottom: 8 }} />
              <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "monospace" }}>{String(s.value)}</div>
              <div className="text-xs mt-1" style={{ color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats && stats.topTools.length > 0 && (
        <div className="glass-card rounded-lg p-5">
          <div className="text-sm font-bold mb-3 tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>[TOP TOOLS]</div>
          <div className="space-y-2">
            {stats.topTools.map((t, i) => (
              <div key={t.tool} className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "#444", fontFamily: "monospace", minWidth: 16 }}>#{i + 1}</span>
                <span className="text-xs flex-1" style={{ color: "#888", fontFamily: "monospace" }}>{t.tool}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,0,0,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(t.count / (stats.topTools[0]?.count ?? 1)) * 100}%`, background: "#ff4444" }} />
                </div>
                <span className="text-xs" style={{ color: "#ff4444", fontFamily: "monospace", minWidth: 30 }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,0,0,0.1)" }}>
          <div className="text-sm font-bold tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>[USER MANAGEMENT] ({users.length})</div>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,0,0,0.07)" }}>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "rgba(255,0,0,0.15)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444" }}>
                {u.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{u.username}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{
                    background: u.role === "admin" ? "rgba(255,0,0,0.2)" : "rgba(0,255,65,0.1)",
                    border: `1px solid ${u.role === "admin" ? "rgba(255,0,0,0.3)" : "rgba(0,255,65,0.2)"}`,
                    color: u.role === "admin" ? "#ff4444" : "#00ff41",
                    fontFamily: "monospace",
                    fontSize: 10,
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "#444", fontFamily: "monospace" }}>
                  Created: {new Date(u.createdAt).toLocaleDateString()} •
                  Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                </div>
              </div>
              {u.role !== "admin" && (
                <button onClick={() => delUser(u.id, u.username)} className="p-1.5 rounded" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4444" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
