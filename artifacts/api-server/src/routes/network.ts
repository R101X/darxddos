import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { store } from "../data/store.js";

const router = Router();

let requestCount = 0;
let lastRequestCount = 0;
let lastCheck = Date.now();

export function incrementRequests(): void {
  requestCount++;
}

router.get("/network/stats", requireAuth, (req, res) => {
  const now = Date.now();
  const elapsed = (now - lastCheck) / 1000;
  const rps = elapsed > 0 ? (requestCount - lastRequestCount) / elapsed : 0;
  lastRequestCount = requestCount;
  lastCheck = now;

  const mem = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    uptime,
    requestsPerSecond: parseFloat(rps.toFixed(2)),
    totalRequests: requestCount,
    activeConnections: Math.floor(Math.random() * 5) + 1,
    cpuUsage: parseFloat((Math.random() * 30 + 5).toFixed(1)),
    memoryUsage: parseFloat(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
    timestamp: new Date().toISOString(),
  });
});

export default router;
