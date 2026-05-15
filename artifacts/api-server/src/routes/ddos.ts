import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { store } from "../data/store.js";
import { appLog } from "../data/logger.js";
import type { Application } from "express";
import type { Server } from "socket.io";

const router = Router();

interface SimState {
  id: string;
  running: boolean;
  target: string;
  mode: string;
  bots: number;
  rps: number;
  duration: number;
  startedAt: string | null;
  stoppedAt: string | null;
  totalPackets: number;
  totalRequests: number;
  peakBandwidth: number;
  successRate: number;
  userId: string;
  timer: ReturnType<typeof setInterval> | null;
}

let currentSim: SimState | null = null;

function stopSim(app: Application) {
  if (!currentSim) return;
  if (currentSim.timer) clearInterval(currentSim.timer);
  currentSim.running = false;
  currentSim.stoppedAt = new Date().toISOString();
  store.addDdosHistory({
    id: currentSim.id,
    target: currentSim.target,
    mode: currentSim.mode,
    bots: currentSim.bots,
    rps: currentSim.rps,
    duration: currentSim.duration,
    startedAt: currentSim.startedAt!,
    stoppedAt: currentSim.stoppedAt,
    totalPackets: currentSim.totalPackets,
    totalRequests: currentSim.totalRequests,
    peakBandwidth: currentSim.peakBandwidth,
    successRate: currentSim.successRate,
    userId: currentSim.userId,
  });
  const io = (app.locals as { io?: Server }).io;
  if (io) {
    io.emit("ddos:stopped", {
      id: currentSim.id,
      totalPackets: currentSim.totalPackets,
      totalRequests: currentSim.totalRequests,
    });
  }
  currentSim = null;
}

router.post("/ddos/start", requireAuth, (req, res) => {
  const app = req.app;
  if (currentSim?.running) {
    stopSim(app);
  }
  const { target, mode, bots, rps, duration } = req.body as {
    target: string;
    mode: string;
    bots: number;
    rps: number;
    duration: number;
  };
  if (!target || !mode) {
    res.status(400).json({ error: "Target and mode required" });
    return;
  }
  const id = randomUUID();
  currentSim = {
    id,
    running: true,
    target,
    mode,
    bots: Math.min(bots, 1000),
    rps: Math.min(rps, 10000),
    duration: Math.min(duration, 300),
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    totalPackets: 0,
    totalRequests: 0,
    peakBandwidth: 0,
    successRate: 95 + Math.random() * 5,
    userId: req.session.userId!,
    timer: null,
  };

  appLog("warn", `DDoS Simulation started: ${mode} -> ${target} (${bots} bots, ${rps} rps)`, {
    userId: req.session.userId,
    username: req.session.username,
  });

  const io = (app.locals as { io?: Server }).io;
  let tick = 0;
  const totalTicks = currentSim.duration * 2;

  currentSim.timer = setInterval(() => {
    if (!currentSim || !currentSim.running) return;
    tick++;
    const rpsVariance = currentSim.rps * (0.7 + Math.random() * 0.6);
    const packetsPerTick = Math.floor(rpsVariance / 2);
    const bandwidthMbps = (packetsPerTick * (200 + Math.random() * 800)) / 1_000_000;

    currentSim.totalPackets += packetsPerTick;
    currentSim.totalRequests += Math.floor(packetsPerTick * 0.3);
    currentSim.peakBandwidth = Math.max(currentSim.peakBandwidth, bandwidthMbps);

    const botStatuses = Array.from({ length: Math.min(currentSim.bots, 20) }, (_, i) => ({
      id: i,
      lat: -60 + Math.random() * 120,
      lng: -180 + Math.random() * 360,
      active: Math.random() > 0.1,
      requests: Math.floor(Math.random() * 100),
    }));

    const serverStatus =
      tick < totalTicks * 0.3 ? "Normal" :
      tick < totalTicks * 0.6 ? "Warning" :
      tick < totalTicks * 0.85 ? "Critical" : "Down";

    if (io) {
      io.emit("ddos:tick", {
        id: currentSim.id,
        tick,
        totalTicks,
        rps: Math.floor(rpsVariance),
        packets: packetsPerTick,
        bandwidth: parseFloat(bandwidthMbps.toFixed(2)),
        totalPackets: currentSim.totalPackets,
        totalRequests: currentSim.totalRequests,
        successRate: parseFloat((currentSim.successRate - Math.random() * 2).toFixed(1)),
        serverStatus,
        botStatuses,
      });
    }

    if (tick >= totalTicks) {
      stopSim(app);
    }
  }, 500);

  res.json({ id, running: true, target, mode, startedAt: currentSim.startedAt, stoppedAt: null });
});

router.post("/ddos/stop", requireAuth, (req, res) => {
  if (!currentSim) {
    res.json({ id: "", running: false, target: "", mode: "", startedAt: null, stoppedAt: null });
    return;
  }
  const id = currentSim.id;
  const target = currentSim.target;
  const mode = currentSim.mode;
  stopSim(req.app);
  appLog("info", "DDoS Simulation stopped by user", {
    userId: req.session.userId,
    username: req.session.username,
  });
  res.json({ id, running: false, target, mode, startedAt: null, stoppedAt: new Date().toISOString() });
});

router.get("/ddos/history", requireAuth, (req, res) => {
  const all = store.getDdosHistory();
  const role = req.session.role;
  const userId = req.session.userId!;
  const entries = role === "admin" ? all : all.filter((h) => h.userId === userId);
  res.json(entries);
});

export default router;
