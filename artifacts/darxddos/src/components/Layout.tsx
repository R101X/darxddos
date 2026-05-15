import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Globe, FileSearch, Wifi,
  Activity, Code2, Terminal, ScanLine, Zap, Network,
  ScrollText, History, Shield, Users, LogOut, Menu, X,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import MatrixRain from "./MatrixRain";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, group: "main" },
  { label: "IP Lookup", href: "/ip-lookup", icon: Search, group: "tools" },
  { label: "DNS Lookup", href: "/dns-lookup", icon: Globe, group: "tools" },
  { label: "WHOIS", href: "/whois", icon: FileSearch, group: "tools" },
  { label: "Ping", href: "/ping", icon: Wifi, group: "tools" },
  { label: "Website Status", href: "/website-status", icon: Activity, group: "tools" },
  { label: "HTTP Headers", href: "/http-headers", icon: Code2, group: "tools" },
  { label: "API Tester", href: "/api-tester", icon: Terminal, group: "tools" },
  { label: "Port Scanner", href: "/port-scanner", icon: ScanLine, group: "tools" },
  { label: "Load Test", href: "/load-test", icon: Zap, group: "advanced" },
  { label: "DDoS Simulator", href: "/ddos-simulator", icon: Shield, group: "advanced" },
  { label: "Network Monitor", href: "/network-monitor", icon: Network, group: "monitor" },
  { label: "Live Logs", href: "/live-logs", icon: ScrollText, group: "monitor" },
  { label: "History", href: "/history", icon: History, group: "monitor" },
];

const groups: Record<string, string> = {
  main: "OVERVIEW",
  tools: "CYBER TOOLS",
  advanced: "ADVANCED",
  monitor: "MONITORING",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const grouped = Object.entries(groups).map(([key, label]) => ({
    key,
    label,
    items: navItems.filter((n) => n.group === key),
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080808" }}>
      <MatrixRain opacity={0.08} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 flex flex-col h-full transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "rgba(5, 0, 0, 0.95)",
          borderRight: "1px solid rgba(255,0,0,0.15)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(255,0,0,0.12)" }}
        >
          <div className="relative">
            <Shield className="text-red-500" size={28} />
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 pulse-red"
              style={{ boxShadow: "0 0 6px #ff0000" }}
            />
          </div>
          <div>
            <div
              className="glitch text-lg font-bold tracking-widest"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: "#ff0000",
                textShadow: "0 0 10px #ff000088",
              }}
            >
              DarXddos
            </div>
            <div className="text-xs" style={{ color: "#666", fontFamily: "monospace" }}>
              v2.0 // ACTIVE
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {grouped.map((group) => (
            <div key={group.key}>
              <div
                className="px-3 mb-1 text-xs font-semibold tracking-widest"
                style={{ color: "#ff000066", fontFamily: "monospace" }}
              >
                [{group.label}]
              </div>
              {group.items.map((item) => {
                const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`sidebar-item ${active ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={15} />
                      <span>{item.label}</span>
                      {active && <ChevronRight size={12} className="ml-auto opacity-70" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
          {user?.role === "admin" && (
            <div>
              <div
                className="px-3 mb-1 text-xs font-semibold tracking-widest"
                style={{ color: "#ff000066", fontFamily: "monospace" }}
              >
                [ADMIN]
              </div>
              <Link href="/admin">
                <div
                  className={`sidebar-item ${location === "/admin" ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Users size={15} />
                  <span>Admin Panel</span>
                </div>
              </Link>
            </div>
          )}
        </nav>

        {/* User */}
        <div
          className="px-3 py-4"
          style={{ borderTop: "1px solid rgba(255,0,0,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "rgba(255,0,0,0.2)",
                border: "1px solid rgba(255,0,0,0.4)",
                color: "#ff4444",
              }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.username}</div>
              <div className="text-xs" style={{ color: user?.role === "admin" ? "#ff4444" : "#666" }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="sidebar-item w-full text-red-400"
            style={{ color: "#ff4444" }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 lg:hidden"
          style={{
            background: "rgba(5,0,0,0.95)",
            borderBottom: "1px solid rgba(255,0,0,0.15)",
          }}
        >
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="text-red-500" size={22} />
          </button>
          <span
            className="font-bold tracking-widest"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff0000" }}
          >
            DarXddos
          </span>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
