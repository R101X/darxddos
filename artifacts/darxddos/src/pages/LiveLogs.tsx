import { useState, useEffect, useRef } from "react";
import { ScrollText, Trash2, Download } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  message: string;
  createdAt: string;
  userId: string | null;
  username: string | null;
}

const LEVEL_COLOR: Record<string, string> = {
  info: "#00ffff", warn: "#ffaa00", error: "#ff4444", success: "#00ff41", debug: "#888",
};
const LEVEL_PREFIX: Record<string, string> = {
  info: "[INFO]", warn: "[WARN]", error: "[ERR!]", success: "[OK!]", debug: "[DBG]",
};

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    apiFetch<LogEntry[]>("/logs").then((l) => setLogs(l.reverse())).catch(() => {});
    const onLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);
    socket.on("log", onLog);
    return () => { socket.off("log", onLog); };
  }, [socket]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "logs.json"; a.click();
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>LIVE LOGS</h1>
          <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Realtime server activity console</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-red" style={{ background: "#00ff41" }} />
          <span className="text-xs" style={{ color: "#00ff41", fontFamily: "monospace" }}>LIVE</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["all", "info", "success", "warn", "error", "debug"].map((lvl) => (
          <button key={lvl} onClick={() => setFilter(lvl)}
            className="px-3 py-1 rounded text-xs font-bold"
            style={{
              fontFamily: "monospace",
              background: filter === lvl ? `${LEVEL_COLOR[lvl] ?? "#ff4444"}22` : "rgba(0,0,0,0.3)",
              border: `1px solid ${filter === lvl ? (LEVEL_COLOR[lvl] ?? "#ff4444") + "55" : "rgba(255,0,0,0.1)"}`,
              color: filter === lvl ? (LEVEL_COLOR[lvl] ?? "#ff4444") : "#444",
            }}>
            {lvl.toUpperCase()}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs cursor-pointer ml-auto" style={{ color: "#666", fontFamily: "monospace" }}>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={{ accentColor: "#ff0000" }} />
          Auto-scroll
        </label>
        <button onClick={() => setLogs([])} className="p-1.5 rounded" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4444" }}>
          <Trash2 size={14} />
        </button>
        <button onClick={exportLogs} className="p-1.5 rounded" style={{ background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41" }}>
          <Download size={14} />
        </button>
      </div>

      <div
        className="rounded-lg overflow-y-auto"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,0,0,0.2)",
          height: "calc(100vh - 280px)",
          minHeight: 300,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12,
        }}
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: "#333" }}>
            <span>{">>> "}<span className="blink">Waiting for logs...</span></span>
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-white/5 rounded px-1">
                <span style={{ color: "#444", flexShrink: 0 }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                <span style={{ color: LEVEL_COLOR[log.level] ?? "#888", flexShrink: 0, minWidth: 60 }}>{LEVEL_PREFIX[log.level] ?? "[???]"}</span>
                {log.username && <span style={{ color: "#666", flexShrink: 0 }}>[{log.username}]</span>}
                <span style={{ color: "#ccc", wordBreak: "break-all" }}>{log.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
