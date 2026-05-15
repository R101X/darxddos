import { useState } from "react";
import { Search, MapPin, Globe, Server, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface IpResult {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  org: string | null;
  as: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  proxy: boolean | null;
  hosting: boolean | null;
}

function Row({ label, value, color = "#00ff41" }: { label: string; value: unknown; color?: string }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,0,0,0.07)" }}>
      <span style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 12, minWidth: 120 }}>{label}</span>
      <span style={{ color, fontFamily: "monospace", fontSize: 12 }}>
        {value === null || value === undefined ? <span style={{ color: "#444" }}>N/A</span> : String(value)}
      </span>
    </div>
  );
}

export default function IpLookup() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IpResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const data = await apiFetch<IpResult>("/tools/ip-lookup", {
        method: "POST",
        body: JSON.stringify({ ip: ip.trim() }),
      });
      setResult(data);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>
          IP LOOKUP
        </h1>
        <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>Geolocate & analyze any IP address</p>
      </div>

      <form onSubmit={run} className="glass-card rounded-lg p-5 space-y-4">
        <div>
          <label className="text-xs tracking-widest mb-1 block" style={{ color: "#ff4444", fontFamily: "monospace" }}>TARGET IP ADDRESS</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 8.8.8.8"
              className="flex-1 terminal-input px-3 py-2 rounded text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-red px-5 py-2 rounded text-sm font-bold tracking-wider flex items-center gap-2"
              style={{ fontFamily: "monospace" }}
            >
              <Search size={15} />
              {loading ? "SCANNING..." : "LOOKUP"}
            </button>
          </div>
        </div>
        {error && (
          <div className="p-3 rounded text-xs" style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff4444", fontFamily: "monospace" }}>
            ERROR: {error}
          </div>
        )}
      </form>

      {result && (
        <div className="glass-card rounded-lg p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} style={{ color: "#ff4444" }} />
            <span className="text-sm font-bold tracking-widest" style={{ fontFamily: "monospace", color: "#ff4444" }}>
              RESULT: {result.ip}
            </span>
            {result.proxy && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255,170,0,0.2)", border: "1px solid rgba(255,170,0,0.3)", color: "#ffaa00" }}>PROXY</span>
            )}
            {result.hosting && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.2)", color: "#00ffff" }}>HOSTING</span>
            )}
          </div>
          <Row label="IP Address" value={result.ip} />
          <Row label="Country" value={result.country ? `${result.country} (${result.countryCode})` : null} />
          <Row label="Region" value={result.region} />
          <Row label="City" value={result.city} />
          <Row label="ISP" value={result.isp} />
          <Row label="Organization" value={result.org} />
          <Row label="AS" value={result.as} />
          <Row label="Coordinates" value={result.lat && result.lon ? `${result.lat}, ${result.lon}` : null} />
          <Row label="Timezone" value={result.timezone} />
          <Row label="Proxy/VPN" value={result.proxy === null ? null : result.proxy ? "YES" : "NO"} color={result.proxy ? "#ffaa00" : "#00ff41"} />
          <Row label="Hosting/DC" value={result.hosting === null ? null : result.hosting ? "YES" : "NO"} color={result.hosting ? "#00ffff" : "#00ff41"} />
        </div>
      )}
    </div>
  );
}
