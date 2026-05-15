import { useState, useEffect } from "react";
import { Network } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "@/lib/api";

interface NetStats {
  uptime: number; requestsPerSecond: number; totalRequests: number;
  activeConnections: number; cpuUsage: number; memoryUsage: number; timestamp: string;
}

interface ChartPoint { time: string; rps: number; cpu: number; mem: number; }

export default function NetworkMonitor() {
  const [stats, setStats] = useState<NetStats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);

  const fetchStats = async () => {
    try {
      const data = await apiFetch<NetStats>("/network/stats");
      setStats(data);
      setChart((prev) => [
        ...prev.slice(-30),
        { time: new Date().toLocaleTimeString(), rps: data.requestsPerSecond, cpu: data.cpuUsage, mem: data.memoryUsage },
      ]);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 2000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>NETWORK MONITOR</h1>
        <div className="w-2 h-2 rounded-full pulse-red" style={{ background: "#00ff41", boxShadow: "0 0 8px #00ff41" }} />
        <span className="text-xs" style={{ color: "#00ff41", fontFamily: "monospace" }}>LIVE</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats && [
          { label: "UPTIME", value: fmtUptime(stats.uptime), color: "#00ff41" },
          { label: "REQ/SEC", value: stats.requestsPerSecond.toFixed(2), color: "#ff4444" },
          { label: "TOTAL REQ", value: stats.totalRequests.toLocaleString(), color: "#ffaa00" },
          { label: "CONNECTIONS", value: stats.activeConnections, color: "#00ffff" },
          { label: "CPU USAGE", value: `${stats.cpuUsage}%`, color: stats.cpuUsage > 80 ? "#ff4444" : "#00ff41" },
          { label: "MEMORY", value: `${stats.memoryUsage}%`, color: stats.memoryUsage > 80 ? "#ff4444" : "#00ffff" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-lg p-4 scan-line">
            <div className="text-xs mb-1" style={{ color: "#555", fontFamily: "monospace" }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "monospace", textShadow: `0 0 8px ${s.color}44` }}>
              {String(s.value)}
            </div>
          </div>
        ))}
      </div>

      {chart.length > 1 && (
        <div className="space-y-4">
          <div className="glass-card rounded-lg p-4">
            <div className="text-xs mb-3" style={{ color: "#ff4444", fontFamily: "monospace" }}>REQUESTS / SECOND</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chart}>
                <XAxis dataKey="time" stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
                <YAxis stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
                <Tooltip contentStyle={{ background: "#0a0000", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace", fontSize: 10 }} />
                <Line type="monotone" dataKey="rps" stroke="#ff4444" dot={false} strokeWidth={2} name="RPS" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="text-xs mb-3" style={{ color: "#ff4444", fontFamily: "monospace" }}>CPU / MEMORY USAGE (%)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chart}>
                <XAxis dataKey="time" stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
                <YAxis domain={[0, 100]} stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
                <Tooltip contentStyle={{ background: "#0a0000", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace", fontSize: 10 }} />
                <Line type="monotone" dataKey="cpu" stroke="#ff4444" dot={false} strokeWidth={2} name="CPU %" />
                <Line type="monotone" dataKey="mem" stroke="#00ffff" dot={false} strokeWidth={2} name="MEM %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
