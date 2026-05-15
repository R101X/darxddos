import { useState, useEffect } from "react";
import { History as HistIcon, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface HistEntry {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  userId: string;
  username: string;
}

export default function History() {
  const [entries, setEntries] = useState<HistEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = () => apiFetch<HistEntry[]>("/history").then(setEntries).catch(() => {});

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    await apiFetch(`/history/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const exportAll = async () => {
    const data = await apiFetch<{ exportedAt: string; entries: HistEntry[] }>("/history/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `darxddos_history_${Date.now()}.json`; a.click();
  };

  const filtered = entries.filter((e) =>
    !search || e.tool.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(e.input).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ff4444" }}>ACTIVITY HISTORY</h1>
          <p style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>{entries.length} entries recorded</p>
        </div>
        <button onClick={exportAll} className="flex items-center gap-2 px-4 py-2 rounded text-sm" style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.2)", color: "#00ff41", fontFamily: "monospace" }}>
          <Download size={14} /> Export JSON
        </button>
      </div>

      <div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tool or input..." className="w-full terminal-input px-3 py-2 rounded text-sm" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-lg p-8 text-center" style={{ color: "#333", fontFamily: "monospace" }}>No history found.</div>
        ) : filtered.map((entry) => (
          <div key={entry.id} className="glass-card rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,0,0,0.15)", border: "1px solid rgba(255,0,0,0.25)", color: "#ff4444", fontFamily: "monospace", flexShrink: 0 }}>
                {entry.tool}
              </span>
              <span className="flex-1 text-xs truncate" style={{ color: "#888", fontFamily: "monospace" }}>
                {JSON.stringify(entry.input).slice(0, 80)}
              </span>
              <span className="text-xs" style={{ color: "#444", fontFamily: "monospace", flexShrink: 0 }}>
                {new Date(entry.createdAt).toLocaleString()}
              </span>
              <span className="text-xs" style={{ color: "#555", flexShrink: 0 }}>{entry.username}</span>
              <button onClick={(e) => { e.stopPropagation(); del(entry.id); }} className="p-1 rounded" style={{ color: "#ff4444" }}>
                <Trash2 size={13} />
              </button>
              {expanded === entry.id ? <ChevronUp size={13} style={{ color: "#666", flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: "#666", flexShrink: 0 }} />}
            </div>
            {expanded === entry.id && (
              <div className="px-4 pb-4 space-y-2">
                <div>
                  <div className="text-xs mb-1" style={{ color: "#ff4444", fontFamily: "monospace" }}>INPUT</div>
                  <pre className="result-box text-xs whitespace-pre-wrap">{JSON.stringify(entry.input, null, 2)}</pre>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "#ff4444", fontFamily: "monospace" }}>RESULT</div>
                  <pre className="result-box text-xs whitespace-pre-wrap">{JSON.stringify(entry.result, null, 2).slice(0, 2000)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
