import { useState } from "react";
import { Terminal, Plus, Trash2, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ApiResult {
  url: string;
  method: string;
  statusCode: number;
  statusText: string;
  responseTime: number;
  headers: Record<string, string>;
  body: string;
  size: number;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function statusColor(code: number) {
  if (code < 300) return "#00ff41";
  if (code < 400) return "#ffaa00";
  if (code < 500) return "#ff8800";
  return "#ff0000";
}

export default function ApiTester() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [body, setBody] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true); setResult(null);
    const headerObj: Record<string, string> = {};
    headers.forEach(({ key, value }) => { if (key) headerObj[key] = value; });
    try {
      const data = await apiFetch<ApiResult>("/tools/api-test", {
        method: "POST",
        body: JSON.stringify({ url: url.trim(), method, headers: headerObj, body: body || null }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "api_test_result.json"; a.click();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>API TESTER</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Send HTTP requests & inspect responses</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div className="flex gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="px-3 py-2 rounded text-sm font-bold"
            style={{ background: "rgba(255,0,0,0.15)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace", outline: "none" }}>
            {METHODS.map((m) => <option key={m} value={m} style={{ background: "#1a0000" }}>{m}</option>)}
          </select>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" className="flex-1 terminal-input px-3 py-2 rounded text-sm" required />
          <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2 whitespace-nowrap" style={{ fontFamily: "monospace" }}>
            <Terminal size={15} />
            {loading ? "SENDING..." : "SEND"}
          </button>
        </div>
        <div className="flex gap-2 border-b" style={{ borderColor: "rgba(255,0,0,0.15)" }}>
          {(["headers", "body"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-xs font-bold tracking-wider"
              style={{ fontFamily: "monospace", color: activeTab === tab ? "#ff4444" : "#444", borderBottom: activeTab === tab ? "2px solid #ff4444" : "2px solid transparent" }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        {activeTab === "headers" && (
          <div className="space-y-2">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input value={h.key} onChange={(e) => setHeaders(prev => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="Header-Name" className="flex-1 terminal-input px-2 py-1.5 rounded text-xs" />
                <input value={h.value} onChange={(e) => setHeaders(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="value" className="flex-1 terminal-input px-2 py-1.5 rounded text-xs" />
                <button type="button" onClick={() => setHeaders(prev => prev.filter((_, j) => j !== i))}><Trash2 size={14} style={{ color: "#ff4444" }} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setHeaders(prev => [...prev, { key: "", value: "" }])}
              className="flex items-center gap-1 text-xs" style={{ color: "#666", fontFamily: "monospace" }}>
              <Plus size={12} /> Add Header
            </button>
          </div>
        )}
        {activeTab === "body" && (
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' rows={5}
            className="w-full terminal-input px-3 py-2 rounded text-xs resize-y" />
        )}
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: `${statusColor(result.statusCode)}22`, border: `1px solid ${statusColor(result.statusCode)}44`, color: statusColor(result.statusCode), fontFamily: "monospace" }}>
                {result.statusCode} {result.statusText}
              </span>
              <span style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>{result.responseTime}ms</span>
              <span style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>{(result.size / 1024).toFixed(1)}KB</span>
            </div>
            <button onClick={exportJson} className="flex items-center gap-1 text-xs px-3 py-1 rounded" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
              <Download size={12} /> Export
            </button>
          </div>
          <div>
            <div className="text-xs mb-2" style={{ color: "#ff4444", fontFamily: "monospace" }}>RESPONSE HEADERS</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(result.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs" style={{ fontFamily: "monospace" }}>
                  <span style={{ color: "#ff4444", minWidth: 160, flexShrink: 0 }}>{k}:</span>
                  <span style={{ color: "#00ff41" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs mb-2" style={{ color: "#ff4444", fontFamily: "monospace" }}>RESPONSE BODY</div>
            <pre className="result-box text-xs whitespace-pre-wrap max-h-64">
              {(() => {
                try { return JSON.stringify(JSON.parse(result.body), null, 2); }
                catch { return result.body; }
              })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
