import { useState } from "react";
import { Activity, CheckCircle, XCircle, Lock, Unlock } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface StatusResult {
  url: string;
  online: boolean;
  statusCode: number | null;
  statusText: string | null;
  responseTime: number | null;
  ssl: boolean | null;
  sslExpiry: string | null;
  redirects: number;
  finalUrl: string | null;
}

export default function WebsiteStatus() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    let target = url.trim();
    if (!target.startsWith("http")) target = "https://" + target;
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<StatusResult>("/tools/website-status", {
        method: "POST",
        body: JSON.stringify({ url: target }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  const statusColor = (code: number | null) => {
    if (!code) return "#ff4444";
    if (code < 300) return "#00ff41";
    if (code < 400) return "#ffaa00";
    return "#ff4444";
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>WEBSITE STATUS</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Check HTTP status, response time & SSL</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>TARGET URL</label>
          <div className="flex gap-3">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. example.com or https://..." className="flex-1 terminal-input px-3 py-2 rounded text-sm" required />
            <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
              <Activity size={15} />
              {loading ? "CHECKING..." : "CHECK"}
            </button>
          </div>
        </div>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3">
            {result.online ? <CheckCircle size={20} style={{ color: "#00ff41" }} /> : <XCircle size={20} style={{ color: "#ff4444" }} />}
            <span className="font-bold text-sm" style={{ fontFamily: "monospace", color: result.online ? "#00ff41" : "#ff4444" }}>
              {result.online ? "ONLINE" : "OFFLINE"}
            </span>
            {result.statusCode && (
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${statusColor(result.statusCode)}22`, border: `1px solid ${statusColor(result.statusCode)}44`, color: statusColor(result.statusCode), fontFamily: "monospace" }}>
                {result.statusCode} {result.statusText}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,0,0,0.1)" }}>
              <div className="text-xs mb-1" style={{ color: "#666", fontFamily: "monospace" }}>RESPONSE TIME</div>
              <div className="text-xl font-bold" style={{ color: result.responseTime && result.responseTime < 500 ? "#00ff41" : "#ffaa00", fontFamily: "monospace" }}>
                {result.responseTime !== null ? `${result.responseTime}ms` : "—"}
              </div>
            </div>
            <div className="p-3 rounded" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,0,0,0.1)" }}>
              <div className="text-xs mb-1" style={{ color: "#666", fontFamily: "monospace" }}>SSL / HTTPS</div>
              <div className="flex items-center gap-2">
                {result.ssl ? <Lock size={18} style={{ color: "#00ff41" }} /> : <Unlock size={18} style={{ color: "#ff4444" }} />}
                <span style={{ color: result.ssl ? "#00ff41" : "#ff4444", fontFamily: "monospace" }}>{result.ssl ? "SECURED" : "NOT SECURED"}</span>
              </div>
            </div>
          </div>
          {result.finalUrl && result.finalUrl !== result.url && (
            <div>
              <div className="text-xs mb-1" style={{ color: "#ff4444", fontFamily: "monospace" }}>REDIRECTED TO</div>
              <div className="text-xs" style={{ color: "#00ffff", fontFamily: "monospace", wordBreak: "break-all" }}>{result.finalUrl}</div>
            </div>
          )}
          {result.redirects > 0 && (
            <div className="text-xs" style={{ color: "#ffaa00", fontFamily: "monospace" }}>↪ {result.redirects} redirect(s) followed</div>
          )}
        </div>
      )}
    </div>
  );
}
