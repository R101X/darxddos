import { useState, useEffect, useRef } from "react";
import { Shield, Play, Pause, Square, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";

interface Tick {
  id: string; tick: number; totalTicks: number; rps: number; packets: number;
  bandwidth: number; totalPackets: number; totalRequests: number;
  successRate: number; serverStatus: string;
  botStatuses: { id: number; lat: number; lng: number; active: boolean; requests: number }[];
}

interface HistEntry {
  id: string; target: string; mode: string; bots: number; rps: number;
  duration: number; startedAt: string; stoppedAt: string | null;
  totalPackets: number; totalRequests: number; peakBandwidth: number; successRate: number;
}

const MODES = [
  { value: "layer4", label: "Layer 4", color: "#ff4444" },
  { value: "layer7", label: "Layer 7", color: "#ff8800" },
  { value: "syn_flood", label: "SYN Flood", color: "#ff0055" },
  { value: "udp_flood", label: "UDP Flood", color: "#ff4488" },
  { value: "http_flood", label: "HTTP Flood", color: "#ff6600" },
];

function statusStyle(s: string) {
  const m: Record<string, { color: string; cls: string }> = {
    Normal: { color: "#00ff41", cls: "status-normal" },
    Warning: { color: "#ffaa00", cls: "status-warning" },
    Critical: { color: "#ff6600", cls: "status-critical" },
    Down: { color: "#ff0000", cls: "status-down" },
  };
  return m[s] ?? m["Normal"]!;
}

export default function DdosSimulator() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState("layer7");
  const [bots, setBots] = useState(100);
  const [rps, setRps] = useState(500);
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState<Tick | null>(null);
  const [chart, setChart] = useState<{ t: number; rps: number; bw: number }[]>([]);
  const [history, setHistory] = useState<HistEntry[]>([]);
  const socket = getSocket();
  const offRef = useRef<() => void>(() => {});

  useEffect(() => {
    apiFetch<HistEntry[]>("/ddos/history").then(setHistory).catch(() => {});
    const onTick = (data: Tick) => {
      setTick(data);
      setChart((prev) => [...prev.slice(-60), { t: data.tick, rps: data.rps, bw: data.bandwidth }]);
    };
    const onStopped = () => { setRunning(false); setPaused(false); apiFetch<HistEntry[]>("/ddos/history").then(setHistory).catch(() => {}); };
    socket.on("ddos:tick", onTick);
    socket.on("ddos:stopped", onStopped);
    offRef.current = () => { socket.off("ddos:tick", onTick); socket.off("ddos:stopped", onStopped); };
    return () => offRef.current();
  }, [socket]);

  const start = async () => {
    if (!target.trim()) return;
    setChart([]); setTick(null); setPaused(false);
    await apiFetch("/ddos/start", {
      method: "POST",
      body: JSON.stringify({ target: target.trim(), mode, bots, rps, duration }),
    });
    setRunning(true);
    apiFetch<HistEntry[]>("/ddos/history").then(setHistory).catch(() => {});
  };
  const stop = async () => {
    await apiFetch("/ddos/stop", { method: "POST" });
    setRunning(false); setPaused(false);
    apiFetch<HistEntry[]>("/ddos/history").then(setHistory).catch(() => {});
  };
  const exportJson = () => {
    const data = { target, mode, bots, rps, duration, tick, chart, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `ddos_sim_${Date.now()}.json`; a.click();
  };

  const progress = tick ? Math.min((tick.tick / tick.totalTicks) * 100, 100) : 0;
  const sStyle = statusStyle(tick?.serverStatus ?? "Normal");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1 glitch" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>DDoS SIMULATOR</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Virtual attack simulation — educational use only</p>
      </div>

      <div className="p-3 rounded" style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.2)" }}>
        <p className="text-xs" style={{ color: "#ff6666", fontFamily: "monospace" }}>
          🛡️ SIMULATION ONLY — No real network traffic is generated. All data is randomly computed for educational visualization. Designed to test your understanding of DDoS attack patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="text-sm font-bold tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>[ATTACK CONFIG]</div>
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>TARGET (label only)</label>
            <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} disabled={running} placeholder="e.g. example.com" className="w-full terminal-input px-3 py-2 rounded text-sm" />
          </div>
          <div>
            <label className="text-xs tracking-widest mb-2 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>ATTACK MODE</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button key={m.value} type="button" disabled={running} onClick={() => setMode(m.value)}
                  className="px-3 py-2 rounded text-xs font-bold transition-all"
                  style={{
                    background: mode === m.value ? `${m.color}22` : "rgba(0,0,0,0.3)",
                    border: `1px solid ${mode === m.value ? m.color + "66" : "rgba(255,0,0,0.1)"}`,
                    color: mode === m.value ? m.color : "#555",
                    fontFamily: "monospace",
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>VIRTUAL BOTS: {bots}</label>
            <input type="range" min={1} max={1000} value={bots} onChange={(e) => setBots(+e.target.value)} disabled={running} className="w-full" style={{ accentColor: "#ff0000" }} />
          </div>
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>REQUESTS/SEC: {rps}</label>
            <input type="range" min={1} max={10000} step={100} value={rps} onChange={(e) => setRps(+e.target.value)} disabled={running} className="w-full" style={{ accentColor: "#ff0000" }} />
          </div>
          <div>
            <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>DURATION: {duration}s</label>
            <input type="range" min={5} max={300} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} disabled={running} className="w-full" style={{ accentColor: "#ff0000" }} />
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button onClick={start} disabled={!target.trim()} className="btn-red flex-1 py-2 rounded text-sm font-bold flex items-center justify-center gap-2" style={{ fontFamily: "monospace" }}>
                <Play size={14} /> START SIM
              </button>
            ) : (
              <>
                <button onClick={() => setPaused(!paused)} className="flex-1 py-2 rounded text-sm font-bold flex items-center justify-center gap-2" style={{ background: "rgba(255,170,0,0.15)", border: "1px solid rgba(255,170,0,0.3)", color: "#ffaa00", fontFamily: "monospace" }}>
                  <Pause size={14} /> {paused ? "RESUME" : "PAUSE"}
                </button>
                <button onClick={stop} className="flex-1 py-2 rounded text-sm font-bold flex items-center justify-center gap-2" style={{ background: "rgba(255,0,0,0.15)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>
                  <Square size={14} /> STOP
                </button>
              </>
            )}
            <button onClick={exportJson} className="px-3 py-2 rounded" style={{ background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41" }}>
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Live stats */}
        <div className="space-y-3">
          {/* Server status */}
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "#ff4444", fontFamily: "monospace" }}>SERVER STATUS</span>
              <span className={`text-sm font-bold ${sStyle.cls}`} style={{ fontFamily: "monospace" }}>
                ● {tick?.serverStatus ?? "Normal"}
              </span>
            </div>
            <div className="h-1.5 rounded-full mb-2" style={{ background: "rgba(255,0,0,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #ff0000, #ff8800)" }} />
            </div>
            <div className="text-xs" style={{ color: "#444", fontFamily: "monospace" }}>{progress.toFixed(0)}% complete</div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "PACKETS", value: tick ? (tick.totalPackets / 1000).toFixed(0) + "K" : "—", color: "#ff4444" },
              { label: "REQUESTS", value: tick ? (tick.totalRequests / 1000).toFixed(1) + "K" : "—", color: "#ff8800" },
              { label: "BANDWIDTH", value: tick ? `${tick.bandwidth.toFixed(1)} MB/s` : "—", color: "#00ffff" },
              { label: "SUCCESS %", value: tick ? `${tick.successRate}%` : "—", color: "#00ff41" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded p-3 text-center">
                <div className="text-base font-bold" style={{ color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "#555", fontFamily: "monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Virtual bots */}
          {tick && (
            <div className="glass-card rounded-lg p-3">
              <div className="text-xs mb-2" style={{ color: "#ff4444", fontFamily: "monospace" }}>BOTNET ({bots} virtual bots)</div>
              <div className="flex flex-wrap gap-1">
                {tick.botStatuses.map((b) => (
                  <div key={b.id} title={`Bot ${b.id}: ${b.requests} req`} className={`w-2 h-2 rounded-full ${b.active ? "pulse-red" : ""}`}
                    style={{ background: b.active ? "#ff4444" : "#1a0000", boxShadow: b.active ? "0 0 4px #ff0000" : undefined }} />
                ))}
                {bots > 20 && <span className="text-xs" style={{ color: "#444", fontFamily: "monospace" }}>+{bots - 20} more</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {chart.length > 1 && (
        <div className="glass-card rounded-lg p-4">
          <div className="text-xs mb-3" style={{ color: "#ff4444", fontFamily: "monospace" }}>REALTIME TRAFFIC GRAPH</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chart}>
              <XAxis dataKey="t" stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
              <YAxis stroke="#222" tick={{ fontSize: 9, fill: "#333" }} />
              <Tooltip contentStyle={{ background: "#0a0000", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace", fontSize: 10 }} />
              <Area type="monotone" dataKey="rps" stroke="#ff4444" fill="rgba(255,0,0,0.1)" strokeWidth={2} name="RPS" />
              <Area type="monotone" dataKey="bw" stroke="#00ffff" fill="rgba(0,255,255,0.05)" strokeWidth={1.5} name="BW MB/s" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card rounded-lg p-4">
          <div className="text-sm font-bold mb-3 tracking-widest" style={{ color: "#ff4444", fontFamily: "monospace" }}>[SIMULATION HISTORY]</div>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-xs py-2" style={{ borderBottom: "1px solid rgba(255,0,0,0.07)", fontFamily: "monospace" }}>
                <span style={{ color: "#ff4444", minWidth: 90 }}>{h.mode}</span>
                <span style={{ color: "#888", flex: 1 }}>{h.target}</span>
                <span style={{ color: "#00ff41" }}>{(h.totalPackets / 1000).toFixed(0)}K pkts</span>
                <span style={{ color: "#444" }}>{new Date(h.startedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
