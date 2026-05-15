import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Search, Globe, FileSearch, Wifi, Activity, Code2, Terminal,
  ScanLine, Zap, Shield, Network, ScrollText, History, Users,
  TrendingUp, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

interface Stats {
  totalRequests: number;
  totalHistory: number;
  totalUsers: number;
  activeSessions: number;
  topTools: { tool: string; count: number }[];
}

interface HistoryEntry {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  createdAt: string;
  username: string;
}

const tools = [
  { label: "IP Lookup", href: "/ip-lookup", icon: Search, desc: "Trace IP geolocation & ISP info" },
  { label: "DNS Lookup", href: "/dns-lookup", icon: Globe, desc: "Query DNS A/MX/TXT/NS records" },
  { label: "WHOIS", href: "/whois", icon: FileSearch, desc: "Domain registration & ownership data" },
  { label: "Ping", href: "/ping", icon: Wifi, desc: "ICMP latency & packet loss check" },
  { label: "Website Status", href: "/website-status", icon: Activity, desc: "Live HTTP status & SSL check" },
  { label: "HTTP Headers", href: "/http-headers", icon: Code2, desc: "Analyze response headers & security" },
  { label: "API Tester", href: "/api-tester", icon: Terminal, desc: "Send HTTP requests & inspect response" },
  { label: "Port Scanner", href: "/port-scanner", icon: ScanLine, desc: "Scan localhost open ports" },
  { label: "Load Test", href: "/load-test", icon: Zap, desc: "Stress test your own website" },
  { label: "DDoS Simulator", href: "/ddos-simulator", icon: Shield, desc: "Virtual attack simulation" },
  { label: "Network Monitor", href: "/network-monitor", icon: Network, desc: "Server realtime metrics" },
  { label: "Live Logs", href: "/live-logs", icon: ScrollText, desc: "Live activity feed" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (user?.role === "admin") {
      apiFetch<Stats>("/admin/stats").then(setStats).catch(() => {});
    }
    apiFetch<HistoryEntry[]>("/history").then((h) => setHistory(h.slice(0, 8))).catch(() => {});
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-black tracking-widest glitch"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff0000", textShadow: "0 0 15px #ff000066" }}
          >
            DarXddos
          </h1>
          <p style={{ color: "#666", fontFamily: "monospace", fontSize: 13 }}>
            {">>> "}Welcome back, <span style={{ color: "#ff4444" }}>{user?.username}</span>
            {" // Session active"}
          </p>
        </div>
        <div
          className="px-3 py-2 rounded text-xs text-right"
          style={{ background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)", fontFamily: "monospace" }}
        >
          <div style={{ color: "#00ff41" }}>● SYSTEM ONLINE</div>
          <div style={{ color: "#666" }}>Uptime: {fmtUptime(uptime)}</div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#ff4444" },
            { label: "Total Requests", value: stats.totalHistory, icon: TrendingUp, color: "#00ff41" },
            { label: "Active Sessions", value: stats.activeSessions, icon: CheckCircle, color: "#00ffff" },
            { label: "Tools Available", value: 12, icon: Shield, color: "#ffaa00" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={18} style={{ color: s.color }} />
                <span className="text-xs" style={{ color: "#444", fontFamily: "monospace" }}>STAT</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "monospace" }}>
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "#888" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tools grid */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>
            [AVAILABLE TOOLS]
          </h2>
          <div className="flex-1 h-px" style={{ background: "rgba(255,0,0,0.15)" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <div
                className="glass-card rounded-lg p-4 cursor-pointer transition-all duration-200 group hover:scale-[1.02]"
                style={{ minHeight: 100 }}
              >
                <tool.icon
                  size={22}
                  className="mb-2 transition-all"
                  style={{ color: "#ff4444", filter: "drop-shadow(0 0 4px #ff000044)" }}
                />
                <div className="text-sm font-semibold text-white mb-1">{tool.label}</div>
                <div className="text-xs" style={{ color: "#666" }}>{tool.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock size={14} style={{ color: "#ff4444" }} />
            <h2 className="text-sm font-bold tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>
              [RECENT ACTIVITY]
            </h2>
            <div className="flex-1 h-px" style={{ background: "rgba(255,0,0,0.15)" }} />
            <Link href="/history">
              <span className="text-xs" style={{ color: "#666", fontFamily: "monospace" }}>view all →</span>
            </Link>
          </div>
          <div className="glass-card rounded-lg overflow-hidden">
            {history.map((h, i) => (
              <div
                key={h.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{
                  borderBottom: i < history.length - 1 ? "1px solid rgba(255,0,0,0.08)" : undefined,
                }}
              >
                <span style={{ color: "#ff4444", fontFamily: "monospace", minWidth: 110, fontSize: 12 }}>
                  [{h.tool}]
                </span>
                <span style={{ color: "#888", fontFamily: "monospace", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {Object.values(h.input).join(" ")}
                </span>
                <span style={{ color: "#444", fontSize: 11, fontFamily: "monospace", flexShrink: 0 }}>
                  {new Date(h.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
