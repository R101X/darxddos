import { useState } from "react";
import { Globe } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DnsRecord { type: string; value: string; ttl: number | null; priority: number | null; }
interface DnsResult { domain: string; records: DnsRecord[]; }

const recordTypes = ["ALL", "A", "AAAA", "MX", "TXT", "NS", "CNAME"];
const recordColors: Record<string, string> = {
  A: "#00ff41", AAAA: "#00ffff", MX: "#ffaa00", TXT: "#ff88ff", NS: "#ff4444", CNAME: "#88aaff",
};

export default function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("ALL");
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true); setResult(null);
    try {
      const data = await apiFetch<DnsResult>("/tools/dns-lookup", {
        method: "POST",
        body: JSON.stringify({ domain: domain.trim(), type: type === "ALL" ? undefined : type }),
      });
      setResult(data);
    } catch (err) { setError(String(err instanceof Error ? err.message : err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>DNS LOOKUP</h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Query DNS records for any domain</p>
      </div>
      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>DOMAIN</label>
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. google.com" className="w-full terminal-input px-3 py-2 rounded text-sm" required />
        </div>
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>RECORD TYPE</label>
          <div className="flex flex-wrap gap-2">
            {recordTypes.map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="px-3 py-1 rounded text-xs font-bold transition-all"
                style={{
                  fontFamily: "monospace",
                  background: type === t ? "rgba(255,0,0,0.25)" : "rgba(0,0,0,0.4)",
                  border: `1px solid ${type === t ? "rgba(255,0,0,0.5)" : "rgba(255,0,0,0.15)"}`,
                  color: type === t ? "#ff4444" : "#666",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-red px-5 py-2 rounded text-sm font-bold tracking-wider flex items-center gap-2" style={{ fontFamily: "monospace" }}>
          <Globe size={15} />
          {loading ? "QUERYING DNS..." : "LOOKUP"}
        </button>
        {error && <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>ERROR: {error}</div>}
      </form>
      {result && (
        <div className="glass-card rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} style={{ color: "#ff4444" }} />
            <span className="text-sm font-bold" style={{ fontFamily: "monospace", color: "#ff4444" }}>
              {result.records.length} records for {result.domain}
            </span>
          </div>
          {result.records.length === 0 ? (
            <p style={{ color: "#444", fontFamily: "monospace", fontSize: 12 }}>No records found.</p>
          ) : (
            <div className="space-y-2">
              {result.records.map((r, i) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,0,0,0.07)" }}>
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${recordColors[r.type] ?? "#ff4444"}22`, border: `1px solid ${recordColors[r.type] ?? "#ff4444"}44`, color: recordColors[r.type] ?? "#ff4444", minWidth: 50, textAlign: "center" }}>
                    {r.type}
                  </span>
                  <span className="flex-1 text-xs" style={{ color: "#00ff41", fontFamily: "monospace", wordBreak: "break-all" }}>{r.value}</span>
                  {r.priority !== null && <span className="text-xs" style={{ color: "#666", fontFamily: "monospace" }}>prio:{r.priority}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
