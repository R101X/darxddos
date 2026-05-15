import { useState } from "react";
import { Code2, Shield, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface HeadersResult {
  url: string;
  statusCode: number;
  statusText: string;
  responseTime: number;
  headers: Record<string, string>;
  securityHeaders: Record<string, boolean>;
}

export default function HttpHeaders() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<HeadersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    let target = url.trim();
    if (!target.startsWith("http")) target = "https://" + target;
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<HeadersResult>("/tools/http-headers", {
        method: "POST",
        body: JSON.stringify({ url: target }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "http_headers.json"; a.click();
  };

  const securityScore = result
    ? Object.values(result.securityHeaders).filter(Boolean).length
    : 0;
  const totalSecurity = result ? Object.keys(result.securityHeaders).length : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>HTTP HEADER ANALYZER</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Inspect response headers & security posture</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>TARGET URL</label>
          <div className="flex gap-3">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. https://example.com" className="flex-1 terminal-input px-3 py-2 rounded text-sm" required />
            <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
              <Code2 size={15} />
              {loading ? "ANALYZING..." : "ANALYZE"}
            </button>
          </div>
        </div>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>

      {result && (
        <div className="space-y-4">
          {/* Security Score */}
          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: "#ff4444" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "monospace", color: "#ff4444" }}>SECURITY SCORE</span>
              </div>
              <button onClick={exportJson} className="flex items-center gap-1 text-xs px-3 py-1 rounded" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
                <Download size={12} /> Export
              </button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold" style={{ fontFamily: "monospace", color: securityScore >= 5 ? "#00ff41" : securityScore >= 3 ? "#ffaa00" : "#ff4444" }}>
                {securityScore}/{totalSecurity}
              </div>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,0,0,0.15)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(securityScore / totalSecurity) * 100}%`, background: securityScore >= 5 ? "#00ff41" : securityScore >= 3 ? "#ffaa00" : "#ff4444" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.securityHeaders).map(([header, present]) => (
                <div key={header} className="flex items-center gap-2 text-xs" style={{ fontFamily: "monospace" }}>
                  {present ? <CheckCircle size={12} style={{ color: "#00ff41", flexShrink: 0 }} /> : <AlertTriangle size={12} style={{ color: "#ff4444", flexShrink: 0 }} />}
                  <span style={{ color: present ? "#00ff41" : "#ff4444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{header}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Headers */}
          <div className="glass-card rounded-lg p-5">
            <div className="text-sm font-bold mb-3" style={{ fontFamily: "monospace", color: "#ff4444" }}>
              ALL HEADERS ({Object.keys(result.headers).length})
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {Object.entries(result.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs py-1" style={{ borderBottom: "1px solid rgba(255,0,0,0.05)" }}>
                  <span style={{ color: "#ff4444", fontFamily: "monospace", minWidth: 180, flexShrink: 0 }}>{key}:</span>
                  <span style={{ color: "#00ff41", fontFamily: "monospace", wordBreak: "break-all" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
