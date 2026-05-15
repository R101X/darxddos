import { useState } from "react";
import { Shield, Eye, EyeOff, Terminal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import MatrixRain from "@/components/MatrixRain";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "#080808" }}
    >
      <MatrixRain opacity={0.18} />

      <div
        className="relative z-10 w-full max-w-md p-8 rounded-lg"
        style={{
          background: "rgba(8, 0, 0, 0.85)",
          border: "1px solid rgba(255,0,0,0.3)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 40px rgba(255,0,0,0.15), 0 0 80px rgba(255,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield
                size={52}
                style={{ color: "#ff0000", filter: "drop-shadow(0 0 15px #ff000088)" }}
              />
            </div>
          </div>
          <h1
            className="glitch text-4xl font-black tracking-widest mb-1"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#ff0000",
              textShadow: "0 0 20px #ff000088",
            }}
          >
            DarXddos
          </h1>
          <p
            className="text-sm tracking-widest"
            style={{ color: "#666", fontFamily: "monospace" }}
          >
            CYBERSECURITY PLATFORM v2.0
          </p>
          <div
            className="mt-2 text-xs"
            style={{ color: "#ff000055", fontFamily: "monospace" }}
          >
            {">>> "}<span className="blink">INITIALIZING SECURE CONNECTION...</span>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex mb-6 rounded"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,0,0,0.15)" }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 text-sm font-semibold tracking-widest transition-all"
              style={{
                fontFamily: "monospace",
                background: mode === m ? "rgba(255,0,0,0.2)" : "transparent",
                color: mode === m ? "#ff4444" : "#666",
                borderRadius: 4,
                border: mode === m ? "1px solid rgba(255,0,0,0.3)" : "1px solid transparent",
              }}
            >
              {m === "login" ? "[LOGIN]" : "[REGISTER]"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              className="block text-xs mb-1 tracking-widest"
              style={{ color: "#ff4444", fontFamily: "monospace" }}
            >
              USERNAME
            </label>
            <div className="flex items-center gap-2">
              <Terminal size={14} style={{ color: "#ff4444" }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="enter_username"
                className="flex-1 bg-transparent outline-none terminal-input px-3 py-2 rounded text-sm"
                required
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-xs mb-1 tracking-widest"
              style={{ color: "#ff4444", fontFamily: "monospace" }}
            >
              PASSWORD
            </label>
            <div
              className="flex items-center gap-2 terminal-input px-3 py-2 rounded"
              style={{ border: "1px solid rgba(255,0,0,0.3)" }}
            >
              <Terminal size={14} style={{ color: "#ff4444" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="enter_password"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#00ff41", fontFamily: "monospace" }}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? (
                  <EyeOff size={14} style={{ color: "#666" }} />
                ) : (
                  <Eye size={14} style={{ color: "#666" }} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{
                background: "rgba(255,0,0,0.1)",
                border: "1px solid rgba(255,0,0,0.3)",
                color: "#ff4444",
                fontFamily: "monospace",
              }}
            >
              {">> ERROR: "}{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-bold tracking-widest text-sm transition-all btn-red"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "AUTHENTICATING..." : mode === "login" ? "ACCESS SYSTEM" : "CREATE ACCOUNT"}
          </button>
        </form>

        {mode === "login" && (
          <p
            className="mt-4 text-center text-xs"
            style={{ color: "#444", fontFamily: "monospace" }}
          >
            Default: admin / admin123
          </p>
        )}
      </div>
    </div>
  );
}
