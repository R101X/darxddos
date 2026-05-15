import { useState } from "react";
import { ScanLine, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PortResult { port: number; open: boolean; service: string | null; }
interface ScanResult { host: string; ports: PortResult[]; scanTime: number; }

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3000, 3306, 5000, 5432, 6379, 8080, 8443, 27017];

export default function PortScanner() {
  const [portInput, setPortInput] = useState(COMMON_PORTS.join(", "));
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const ports = portInput.split(/[,\s]+/).map(Number).filter((n) => !isNaN(n) && n > 0 && n <= 65535);
    if (ports.length === 0) { setError("Enter valid port numbers"); return; }
    if (ports.length > 100) { setError("Max 100 ports at once"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<ScanResult>("/tools/port-scan", {
        method: "POST",
        body: JSON.stringify({ ports }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "port_scan.json"; a.click();
  };

  const openPorts = result?.ports.filter((p) => p.open) ?? [];
  const closedPorts = result?.ports.filter((p) => !p.open) ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>PORT SCANNER</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Scan open ports on <span style={{ color: "#ffaa00" }}>localhost (127.0.0.1)</span> only</p>
      </div>
      <div className="p-3 rounded" style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)" }}>
        <p className="text-xs" style={{ color: "#ffaa00", fontFamily: "monospace" }}>⚠ For security purposes, this scanner only checks ports on the local server (127.0.0.1).</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>PORT LIST (comma separated)</label>
          <textarea value={portInput} onChange={(e) => setPortInput(e.target.value)} rows={3} className="w-full terminal-input px-3 py-2 rounded text-sm resize-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Common", ports: COMMON_PORTS },
            { label: "Web", ports: [80, 443, 3000, 4000, 5000, 8000, 8080, 8443] },
            { label: "DB", ports: [3306, 5432, 6379, 27017, 1433, 5984] },
          ].map((preset) => (
            <button key={preset.label} type="button" onClick={() => setPortInput(preset.ports.join(", "))}
              className="px-3 py-1 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4444", fontFamily: "monospace" }}>
              {preset.label} Ports
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
          <ScanLine size={15} />
          {loading ? "SCANNING..." : "SCAN PORTS"}
        </button>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>
              <span style={{ color: "#00ff41" }}>{openPorts.length} open</span>
              <span style={{ color: "#444" }}> / </span>
              <span style={{ color: "#666" }}>{closedPorts.length} closed</span>
              <span style={{ color: "#444" }}> — {result.scanTime}ms</span>
            </div>
            <button onClick={exportJson} className="flex items-center gap-1 text-xs px-3 py-1 rounded" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
              <Download size={12} /> Export
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {result.ports.map((p) => (
              <div key={p.port} className="p-2 rounded text-center" style={{
                background: p.open ? "rgba(0,255,65,0.08)" : "rgba(255,0,0,0.05)",
                border: `1px solid ${p.open ? "rgba(0,255,65,0.2)" : "rgba(255,0,0,0.1)"}`,
              }}>
                <div className="text-sm font-bold" style={{ color: p.open ? "#00ff41" : "#444", fontFamily: "monospace" }}>{p.port}</div>
                <div className="text-xs" style={{ color: p.open ? "#00ff4199" : "#333", fontFamily: "monospace" }}>{p.service ?? (p.open ? "open" : "closed")}</div>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${p.open ? "pulse-red" : ""}`} style={{ background: p.open ? "#00ff41" : "#333" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
