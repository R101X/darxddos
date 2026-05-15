import { useState } from "react";
import { FileSearch, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface WhoisResult {
  domain: string;
  registrar: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  expiresDate: string | null;
  status: string | null;
  nameServers: string[];
  raw: string;
}

export default function Whois() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<WhoisResult>("/tools/whois", {
        method: "POST",
        body: JSON.stringify({ domain: domain.trim() }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `whois_${result.domain}.json`; a.click();
  };

  function Row({ label, value }: { label: string; value: string | null }) {
    return (
      <div className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,0,0,0.07)" }}>
        <span style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 12, minWidth: 130 }}>{label}</span>
        <span style={{ color: value ? "#00ff41" : "#444", fontFamily: "monospace", fontSize: 12 }}>{value ?? "N/A"}</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>WHOIS LOOKUP</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Domain registration & ownership information</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>DOMAIN</label>
          <div className="flex gap-3">
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. example.com" className="flex-1 terminal-input px-3 py-2 rounded text-sm" required />
            <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold flex items-center gap-2" style={{ fontFamily: "monospace" }}>
              <FileSearch size={15} />
              {loading ? "QUERYING..." : "WHOIS"}
            </button>
          </div>
        </div>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ fontFamily: "monospace", color: "#ff4444" }}>WHOIS: {result.domain}</span>
            <button onClick={exportJson} className="flex items-center gap-1 text-xs px-3 py-1 rounded" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
              <Download size={12} /> Export JSON
            </button>
          </div>
          <Row label="Registrar" value={result.registrar} />
          <Row label="Created" value={result.createdDate} />
          <Row label="Updated" value={result.updatedDate} />
          <Row label="Expires" value={result.expiresDate} />
          <Row label="Status" value={result.status} />
          <div className="py-2">
            <span style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 12 }}>Name Servers</span>
            <div className="mt-1 space-y-1">
              {result.nameServers.length > 0 ? result.nameServers.map((ns, i) => (
                <div key={i} style={{ color: "#00ff41", fontFamily: "monospace", fontSize: 12, paddingLeft: 12 }}>▸ {ns}</div>
              )) : <span style={{ color: "#444", fontFamily: "monospace", fontSize: 12 }}>N/A</span>}
            </div>
          </div>
          <button onClick={() => setShowRaw(!showRaw)} className="text-xs" style={{ color: "#666", fontFamily: "monospace" }}>
            {showRaw ? "▼ Hide raw WHOIS" : "▶ Show raw WHOIS"}
          </button>
          {showRaw && (
            <pre className="result-box text-xs whitespace-pre-wrap">{result.raw}</pre>
          )}
        </div>
      )}
    </div>
  );
}
