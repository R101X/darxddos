import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { appLog } from "../data/logger.js";
import type { Application } from "express";
import type { Server } from "socket.io";

const router = Router();

let activeTest: { id: string; abort: boolean } | null = null;

router.post("/loadtest/start", requireAuth, async (req, res) => {
  if (activeTest) {
    activeTest.abort = true;
  }
  const {
    url,
    concurrent = 5,
    duration = 30,
    method = "GET",
  } = req.body as {
    url: string;
    concurrent?: number;
    duration?: number;
    method?: string;
  };

  if (!url) {
    res.status(400).json({ error: "URL required" });
    return;
  }

  const safeConcurrent = Math.min(Math.max(1, concurrent), 50);
  const safeDuration = Math.min(Math.max(5, duration), 300);
  const id = randomUUID();

  activeTest = { id, abort: false };
  const testRef = activeTest;

  appLog("warn", `Load Test started: ${method} ${url} (${safeConcurrent} concurrent, ${safeDuration}s)`, {
    userId: req.session.userId,
    username: req.session.username,
  });

  res.json({ id, started: true, url, concurrent: safeConcurrent, duration: safeDuration });

  const app = req.app as Application;
  const io = (app.locals as { io?: Server }).io;

  let totalRequests = 0;
  let successes = 0;
  let errors = 0;
  let totalResponseTime = 0;
  const startTime = Date.now();
  const responseTimes: number[] = [];

  const runBatch = async () => {
    const batch = Array.from({ length: safeConcurrent }, async () => {
      if (testRef.abort) return;
      const t0 = Date.now();
      try {
        const resp = await fetch(url, {
          method,
          signal: AbortSignal.timeout(10000),
        });
        const rt = Date.now() - t0;
        totalRequests++;
        if (resp.status < 500) {
          successes++;
          totalResponseTime += rt;
          responseTimes.push(rt);
        } else {
          errors++;
        }
      } catch {
        totalRequests++;
        errors++;
      }
    });
    await Promise.all(batch);
  };

  (async () => {
    while (!testRef.abort && Date.now() - startTime < safeDuration * 1000) {
      await runBatch();
      const elapsed = (Date.now() - startTime) / 1000;
      const rps = totalRequests / elapsed;
      const avgRt = successes > 0 ? totalResponseTime / successes : 0;
      const p95 =
        responseTimes.length > 0
          ? responseTimes.sort((a, b) => a - b)[
              Math.floor(responseTimes.length * 0.95)
            ] ?? 0
          : 0;

      if (io) {
        io.emit(`loadtest:tick:${id}`, {
          id,
          elapsed: parseFloat(elapsed.toFixed(1)),
          totalRequests,
          successes,
          errors,
          rps: parseFloat(rps.toFixed(1)),
          avgResponseTime: parseFloat(avgRt.toFixed(0)),
          p95ResponseTime: p95,
          successRate: totalRequests > 0 ? parseFloat(((successes / totalRequests) * 100).toFixed(1)) : 0,
        });
      }
    }
    if (io) {
      io.emit(`loadtest:done:${id}`, {
        id,
        totalRequests,
        successes,
        errors,
        avgResponseTime: successes > 0 ? Math.floor(totalResponseTime / successes) : 0,
        successRate: totalRequests > 0 ? parseFloat(((successes / totalRequests) * 100).toFixed(1)) : 0,
      });
    }
    if (activeTest?.id === id) activeTest = null;
    appLog("info", `Load Test done: ${totalRequests} requests, ${successes} success, ${errors} errors`, {
      userId: req.session.userId,
      username: req.session.username,
    });
  })().catch(() => {});
});

router.post("/loadtest/stop", requireAuth, (req, res) => {
  if (activeTest) {
    activeTest.abort = true;
    activeTest = null;
  }
  res.json({ stopped: true });
});

export default router;
