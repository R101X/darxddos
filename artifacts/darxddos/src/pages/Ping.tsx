import { useState } from "react";
import { Wifi } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PingResult {
  host: string;
  alive: boolean;
  min: number | null;
  max: number | null;
  avg: number | null;
  times: number[];
  packetLoss: number | null;
}

export default function Ping() {
  const [host, setHost] = useState("");
  const [count, setCount] = useState(4);
  const [result, setResult] = useState<PingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<PingResult>("/tools/ping", {
        method: "POST",
        body: JSON.stringify({ host: host.trim(), count }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>PING CHECKER</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>ICMP latency & packet loss measurement</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>HOST / IP</label>
          <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="e.g. 8.8.8.8 or google.com" className="w-full terminal-input px-3 py-2 rounded text-sm" required />
        </div>
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>PACKET COUNT: {count}</label>
          <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(+e.target.value)} className="w-full" style={{ accentColor: "#ff0000" }} />
        </div>
        <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
          <Wifi size={15} />
          {loading ? "PINGING..." : "PING"}
        </button>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${result.alive ? "pulse-red" : ""}`} style={{ background: result.alive ? "#00ff41" : "#ff0000", boxShadow: result.alive ? "0 0 8px #00ff41" : "0 0 8px #ff0000" }} />
            <span className="text-sm font-bold" style={{ fontFamily: "monospace", color: result.alive ? "#00ff41" : "#ff4444" }}>
              {result.host} — {result.alive ? "REACHABLE" : "UNREACHABLE"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "MIN", value: result.min !== null ? `${result.min}ms` : "—" },
              { label: "AVG", value: result.avg !== null ? `${result.avg}ms` : "—" },
              { label: "MAX", value: result.max !== null ? `${result.max}ms` : "—" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,0,0,0.15)" }}>
                <div className="text-lg font-bold" style={{ color: "#00ff41", fontFamily: "monospace" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "#666", fontFamily: "monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 12 }}>Packet Loss</span>
            <span style={{ color: result.packetLoss === 0 ? "#00ff41" : "#ff4444", fontFamily: "monospace", fontSize: 12 }}>
              {result.packetLoss !== null ? `${result.packetLoss}%` : "Unknown"}
            </span>
          </div>
          {result.times.length > 0 && (
            <div>
              <div style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}>Response Times</div>
              <div className="flex items-end gap-1" style={{ height: 60 }}>
                {result.times.map((t, i) => {
                  const maxT = Math.max(...result.times);
                  const h = maxT > 0 ? (t / maxT) * 100 : 50;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div style={{ width: "100%", height: `${h}%`, background: "rgba(255,0,0,0.5)", borderTop: "1px solid #ff4444", borderRadius: "2px 2px 0 0" }} />
                      <span style={{ color: "#444", fontSize: 9, fontFamily: "monospace" }}>{t.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
