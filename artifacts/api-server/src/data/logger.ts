import { randomUUID } from "node:crypto";
import { store } from "./store.js";
import type { Server } from "socket.io";

let ioRef: Server | null = null;

export function setIo(io: Server): void {
  ioRef = io;
}

export function appLog(
  level: "info" | "warn" | "error" | "success" | "debug",
  message: string,
  opts?: { userId?: string; username?: string; meta?: Record<string, unknown> },
): void {
  const entry = {
    id: randomUUID(),
    level,
    message,
    createdAt: new Date().toISOString(),
    userId: opts?.userId ?? null,
    username: opts?.username ?? null,
    meta: opts?.meta ?? {},
  };
  store.addLog(entry);
  if (ioRef) {
    ioRef.emit("log", entry);
  }
}
