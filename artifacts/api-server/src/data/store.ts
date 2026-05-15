import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(import.meta.dirname, "..", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(filename: string, defaultValue: T): T {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    return JSON.parse(fs.readFileSync(filepath, "utf-8")) as T;
  } catch {
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T): void {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
  lastLogin: string | null;
}

export interface HistoryEntry {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  userId: string;
  username: string;
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  message: string;
  createdAt: string;
  userId: string | null;
  username: string | null;
  meta: Record<string, unknown>;
}

export interface DdosHistoryEntry {
  id: string;
  target: string;
  mode: string;
  bots: number;
  rps: number;
  duration: number;
  startedAt: string;
  stoppedAt: string | null;
  totalPackets: number;
  totalRequests: number;
  peakBandwidth: number;
  successRate: number;
  userId: string;
}

export const store = {
  getUsers(): User[] {
    return readJson<User[]>("users.json", []);
  },
  saveUsers(users: User[]): void {
    writeJson("users.json", users);
  },
  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },
  getUserByUsername(username: string): User | undefined {
    return this.getUsers().find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
  },
  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },
  updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers().map((u) =>
      u.id === id ? { ...u, ...updates } : u,
    );
    this.saveUsers(users);
  },
  deleteUser(id: string): void {
    this.saveUsers(this.getUsers().filter((u) => u.id !== id));
  },

  getHistory(): HistoryEntry[] {
    return readJson<HistoryEntry[]>("history.json", []);
  },
  addHistory(entry: HistoryEntry): void {
    const history = this.getHistory();
    history.unshift(entry);
    if (history.length > 500) history.splice(500);
    writeJson("history.json", history);
  },
  deleteHistory(id: string): void {
    writeJson(
      "history.json",
      this.getHistory().filter((h) => h.id !== id),
    );
  },

  getLogs(): LogEntry[] {
    return readJson<LogEntry[]>("logs.json", []);
  },
  addLog(entry: LogEntry): void {
    const logs = this.getLogs();
    logs.unshift(entry);
    if (logs.length > 1000) logs.splice(1000);
    writeJson("logs.json", logs);
  },

  getDdosHistory(): DdosHistoryEntry[] {
    return readJson<DdosHistoryEntry[]>("ddos-history.json", []);
  },
  addDdosHistory(entry: DdosHistoryEntry): void {
    const h = this.getDdosHistory();
    h.unshift(entry);
    if (h.length > 100) h.splice(100);
    writeJson("ddos-history.json", h);
  },
};
