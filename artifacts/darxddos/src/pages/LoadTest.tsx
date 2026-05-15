import { useState, useEffect, useRef } from "react";
import { Zap, Square, Download, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";

interface TickData {
  id: string;
  elapsed: number;
  totalRequests: number;
  successes: number;
  errors: number;
  rps: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
}

interface DoneData {
  id: string;
  totalRequests: number;
  successes: number;
  errors: number;
  avgResponseTime: number;
  successRate: number;
}

interface ChartPoint { time: number; rps: number; avgRt: number; errors: number; }

export default function LoadTest() {
  const [url, setUrl] = useState("");
  const [concurrent, setConcurrent] = useState(5);
  const [duration, setDuration] = useState(30);
  const [method, setMethod] = useState("GET");
  const [running, setRunning] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [tick, setTick] = useState<TickData | null>(null);
  const [done, setDone] = useState<DoneData | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [error, setError] = useState("");
  const socket = getSocket();
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach((off) => off());
    };
  }, []);

  const startTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(""); setRunning(true); setTick(null); setDone(null); setChart([]);

    // Remove old listeners
    listenersRef.current.forEach((off) => off());
    listenersRef.current = [];

    try {
      const resp = await apiFetch<{ id: string }>("/loadtest/start", {
        method: "POST",
        body: JSON.stringify({ url: url.trim(), concurrent, duration, method }),
      });
      const id = resp.id;
      setTestId(id);

      const onTick = (data: TickData) => {
        setTick(data);
        setChart((prev) => [...prev, { time: data.elapsed, rps: data.rps, avgRt: data.avgResponseTime, errors: data.errors }]);
      };
      const onDone = (data: DoneData) => {
        setDone(data);
        setRunning(false);
      };

      socket.on(`loadtest:tick:${id}`, onTick);
      socket.on(`loadtest:done:${id}`, onDone);

      listenersRef.current = [
        () => socket.off(`loadtest:tick:${id}`, onTick),
        () => socket.off(`loadtest:done:${id}`, onDone),
      ];
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setRunning(false);
    }
  };

  const stopTest = async () => {
    await apiFetch("/loadtest/stop", { method: "POST" });
    setRunning(false);
  };

  const exportJson = () => {
    const data = { url, method, concurrent, duration, tick, done, chart };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "load_test_report.json"; a.click();
  };

  const current = tick;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>LOAD TESTER</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>HTTP stress test for YOUR OWN website</p>
      </div>

      <div className="p-3 rounded" style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} style={{ color: "#ffaa00", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#ffaa00", fontFamily: "monospace" }}>
            DISCLAIMER: Only use this tool on websites you own or have explicit permission to test. This sends real HTTP requests to the target URL.
          </p>
        </div>
      </div>

      <form onSubmit={startTest} className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)} disabled={running}
            className="px-3 py-2 rounded text-sm font-bold"
            style={{ background: "rgba(255,0,0,0.15)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace", outline: "none" }}>
            {["GET", "POST", "HEAD"].map((m) => <option key={m} value={m} style={{ background: "#1a0000" }}>{m}</option>)}
          </select>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-website.com" className="flex-1 terminal-input px-3 py-2 rounded text-sm" required disabled={running} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>
              CONCURRENT CONNECTIONS: {concurrent}
            </label>
            <input type="range" min={1} max={50} value={concurrent} onChange={(e) => setConcurrent(+e.target.value)} disabled={running} className="w-full" style={{ accentColor: "#ff0000" }} />
          </div>
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>
              DURATION: {duration}s
            </label>
            <input type="range" min={5} max={120} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} disabled={running} className="w-full" style={{ accentColor: "#ff0000" }} />
          </div>
        </div>
        <div className="flex gap-3">
          {!running ? (
            <button type="submit" className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
              <Zap size={15} /> START TEST
            </button>
          ) : (
            <button type="button" onClick={stopTest} className="px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ background: "rgba(255,100,0,0.2)", border: "1px solid rgba(255,100,0,0.4)", color: "#ff8800", fontFamily: "monospace" }}>
              <Square size={15} /> STOP TEST
            </button>
          )}
          {(tick || done) && (
            <button type="button" onClick={exportJson} className="flex items-center gap-1 text-xs px-3 py-1 rounded" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
              <Download size={12} /> Export Report
            </button>
          )}
        </div>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>

      {(current || done) && (
        <div className="space-y-4">
          {/* Live stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "REQUESTS/SEC", value: current?.rps?.toFixed(1) ?? done?.totalRequests ?? "—", color: "#00ff41" },
              { label: "AVG RESPONSE", value: current ? `${current.avgResponseTime}ms` : done ? `${done.avgResponseTime}ms` : "—", color: "#00ffff" },
              { label: "TOTAL REQ", value: current?.totalRequests ?? done?.totalRequests ?? "—", color: "#ffaa00" },
              { label: "SUCCESS RATE", value: current ? `${current.successRate}%` : done ? `${done.successRate}%` : "—", color: (current?.successRate ?? done?.successRate ?? 100) > 90 ? "#00ff41" : "#ff4444" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-lg p-3 text-center">
                <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "monospace" }}>{String(s.value)}</div>
                <div className="text-xs mt-1" style={{ color: "#666", fontFamily: "monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chart.length > 1 && (
            <div className="glass-card rounded-lg p-4">
              <div className="text-xs mb-3" style={{ color: "#ff4444", fontFamily: "monospace" }}>LIVE TRAFFIC CHART</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chart}>
                  <XAxis dataKey="time" stroke="#333" tick={{ fontSize: 10, fill: "#444", fontFamily: "monospace" }} />
                  <YAxis stroke="#333" tick={{ fontSize: 10, fill: "#444", fontFamily: "monospace" }} />
                  <Tooltip contentStyle={{ background: "#0a0000", border: "1px solid rgba(255,0,0,0.3)", color: "#00ff41", fontFamily: "monospace", fontSize: 11 }} />
                  <Line type="monotone" dataKey="rps" stroke="#ff4444" dot={false} strokeWidth={2} name="RPS" />
                  <Line type="monotone" dataKey="avgRt" stroke="#00ff41" dot={false} strokeWidth={1.5} name="Avg RT (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {done && (
            <div className="p-4 rounded" style={{ background: "rgba(0,255,65,0.05)", border: "1px solid rgba(0,255,65,0.2)" }}>
              <p className="text-sm font-bold" style={{ color: "#00ff41", fontFamily: "monospace" }}>
                ✓ TEST COMPLETE — {done.totalRequests} total requests, {done.successes} succeeded, {done.errors} failed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
