import { Router } from "express";
import dns from "node:dns/promises";
import net from "node:net";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { store } from "../data/store.js";
import { appLog } from "../data/logger.js";

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

const router = Router();

function saveHistory(
  tool: string,
  input: Record<string, unknown>,
  result: Record<string, unknown>,
  userId: string,
  username: string,
) {
  store.addHistory({
    id: randomUUID(),
    tool,
    input,
    result,
    createdAt: new Date().toISOString(),
    userId,
    username,
  });
}

router.post("/tools/ip-lookup", requireAuth, async (req, res) => {
  try {
    const { ip } = req.body as { ip: string };
    if (!ip) {
      res.status(400).json({ error: "IP address required" });
      return;
    }
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=66846719`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("IP lookup API failed");
    const data = (await response.json()) as Record<string, unknown>;
    if (data["status"] === "fail") {
      res.status(400).json({ error: String(data["message"] ?? "Invalid IP") });
      return;
    }
    const result = {
      ip: String(data["query"] ?? ip),
      country: (data["country"] as string) ?? null,
      countryCode: (data["countryCode"] as string) ?? null,
      region: (data["regionName"] as string) ?? null,
      city: (data["city"] as string) ?? null,
      isp: (data["isp"] as string) ?? null,
      org: (data["org"] as string) ?? null,
      as: (data["as"] as string) ?? null,
      lat: (data["lat"] as number) ?? null,
      lon: (data["lon"] as number) ?? null,
      timezone: (data["timezone"] as string) ?? null,
      proxy: (data["proxy"] as boolean) ?? null,
      hosting: (data["hosting"] as boolean) ?? null,
    };
    saveHistory("IP Lookup", { ip }, result, req.session.userId!, req.session.username!);
    appLog("info", `IP Lookup: ${ip}`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "IP lookup failed: " + String(err) });
  }
});

router.post("/tools/dns-lookup", requireAuth, async (req, res) => {
  try {
    const { domain, type } = req.body as { domain: string; type?: string };
    if (!domain) {
      res.status(400).json({ error: "Domain required" });
      return;
    }
    const records: Array<{ type: string; value: string; ttl: number | null; priority: number | null }> = [];
    const types = type ? [type.toUpperCase()] : ["A", "AAAA", "MX", "TXT", "NS", "CNAME"];

    for (const t of types) {
      try {
        if (t === "A") {
          const addrs = await dns.resolve4(domain);
          addrs.forEach((v) => records.push({ type: "A", value: v, ttl: null, priority: null }));
        } else if (t === "AAAA") {
          const addrs = await dns.resolve6(domain);
          addrs.forEach((v) => records.push({ type: "AAAA", value: v, ttl: null, priority: null }));
        } else if (t === "MX") {
          const mxs = await dns.resolveMx(domain);
          mxs.forEach((m) => records.push({ type: "MX", value: m.exchange, ttl: null, priority: m.priority }));
        } else if (t === "TXT") {
          const txts = await dns.resolveTxt(domain);
          txts.forEach((t) => records.push({ type: "TXT", value: t.join(""), ttl: null, priority: null }));
        } else if (t === "NS") {
          const nss = await dns.resolveNs(domain);
          nss.forEach((v) => records.push({ type: "NS", value: v, ttl: null, priority: null }));
        } else if (t === "CNAME") {
          try {
            const cname = await dns.resolveCname(domain);
            cname.forEach((v) => records.push({ type: "CNAME", value: v, ttl: null, priority: null }));
          } catch { /* CNAME may not exist */ }
        }
      } catch { /* Skip record types that don't resolve */ }
    }

    const result = { domain, records };
    saveHistory("DNS Lookup", { domain, type }, result, req.session.userId!, req.session.username!);
    appLog("info", `DNS Lookup: ${domain}`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "DNS lookup failed: " + String(err) });
  }
});

router.post("/tools/whois", requireAuth, async (req, res) => {
  try {
    const { domain } = req.body as { domain: string };
    if (!domain) {
      res.status(400).json({ error: "Domain required" });
      return;
    }
    const whoisLib = require("whois") as {
      lookup: (addr: string, opts: Record<string, unknown>, cb: (err: Error | null, data: string) => void) => void;
    };
    const raw: string = await new Promise((resolve, reject) => {
      whoisLib.lookup(domain, { timeout: 10000 }, (err, data) => {
        if (err) reject(err);
        else resolve(data ?? "");
      });
    });

    const extract = (pattern: RegExp) => {
      const m = raw.match(pattern);
      return m ? m[1]?.trim() ?? null : null;
    };
    const extractAll = (pattern: RegExp) => {
      const matches = [...raw.matchAll(new RegExp(pattern.source, "gi"))];
      return matches.map((m) => m[1]?.trim() ?? "").filter(Boolean);
    };

    const result = {
      domain,
      registrar: extract(/Registrar:\s*(.+)/i),
      createdDate: extract(/Creation Date:\s*(.+)/i) ?? extract(/Created:\s*(.+)/i),
      updatedDate: extract(/Updated Date:\s*(.+)/i) ?? extract(/Last Modified:\s*(.+)/i),
      expiresDate: extract(/Registry Expiry Date:\s*(.+)/i) ?? extract(/Expiry Date:\s*(.+)/i),
      status: extract(/Domain Status:\s*(.+)/i),
      nameServers: extractAll(/Name Server:\s*(.+)/i),
      raw: raw.slice(0, 5000),
    };
    saveHistory("WHOIS", { domain }, result, req.session.userId!, req.session.username!);
    appLog("info", `WHOIS: ${domain}`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "WHOIS lookup failed: " + String(err) });
  }
});

router.post("/tools/ping", requireAuth, async (req, res) => {
  try {
    const { host, count = 4 } = req.body as { host: string; count?: number };
    if (!host) {
      res.status(400).json({ error: "Host required" });
      return;
    }
    const safeCount = Math.min(Math.max(1, count), 10);
    const isLinux = process.platform === "linux";
    const cmd = isLinux
      ? `ping -c ${safeCount} -W 3 ${host}`
      : `ping -n ${safeCount} ${host}`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      const times: number[] = [];
      const timeMatches = stdout.matchAll(/time[=<](\d+\.?\d*)\s*ms/gi);
      for (const m of timeMatches) {
        const t = parseFloat(m[1] ?? "0");
        if (!isNaN(t)) times.push(t);
      }
      let min = null, max = null, avg = null, loss = null;
      const statsMatch = stdout.match(/(\d+\.?\d*)\/(\d+\.?\d*)\/(\d+\.?\d*)/);
      if (statsMatch) {
        min = parseFloat(statsMatch[1] ?? "0");
        avg = parseFloat(statsMatch[2] ?? "0");
        max = parseFloat(statsMatch[3] ?? "0");
      } else if (times.length > 0) {
        min = Math.min(...times);
        max = Math.max(...times);
        avg = times.reduce((a, b) => a + b, 0) / times.length;
      }
      const lossMatch = stdout.match(/(\d+)%\s*packet loss/i);
      if (lossMatch) loss = parseFloat(lossMatch[1] ?? "0");
      const result = {
        host,
        alive: times.length > 0 || loss === 0,
        min,
        max,
        avg: avg ? parseFloat(avg.toFixed(2)) : null,
        times,
        packetLoss: loss,
      };
      saveHistory("Ping", { host, count: safeCount }, result, req.session.userId!, req.session.username!);
      appLog("info", `Ping: ${host}`, { userId: req.session.userId, username: req.session.username });
      res.json(result);
    } catch {
      const result = { host, alive: false, min: null, max: null, avg: null, times: [], packetLoss: 100 };
      saveHistory("Ping", { host, count: safeCount }, result, req.session.userId!, req.session.username!);
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: "Ping failed: " + String(err) });
  }
});

router.post("/tools/website-status", requireAuth, async (req, res) => {
  try {
    const { url } = req.body as { url: string };
    if (!url) {
      res.status(400).json({ error: "URL required" });
      return;
    }
    const startTime = Date.now();
    let redirects = 0;
    let finalUrl = url;
    let statusCode: number | null = null;
    let statusText: string | null = null;
    let ssl: boolean | null = null;
    let sslExpiry: string | null = null;

    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      statusCode = response.status;
      statusText = response.statusText;
      finalUrl = response.url;
      ssl = url.startsWith("https://");
      redirects = response.redirected ? 1 : 0;
      const responseTime = Date.now() - startTime;
      const result = {
        url,
        online: response.ok,
        statusCode,
        statusText,
        responseTime,
        ssl,
        sslExpiry,
        redirects,
        finalUrl,
      };
      saveHistory("Website Status", { url }, result, req.session.userId!, req.session.username!);
      appLog("info", `Website Status: ${url} -> ${statusCode}`, { userId: req.session.userId, username: req.session.username });
      res.json(result);
    } catch {
      const result = {
        url,
        online: false,
        statusCode: null,
        statusText: null,
        responseTime: Date.now() - startTime,
        ssl: null,
        sslExpiry: null,
        redirects: 0,
        finalUrl: url,
      };
      saveHistory("Website Status", { url }, result, req.session.userId!, req.session.username!);
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: "Status check failed: " + String(err) });
  }
});

router.post("/tools/http-headers", requireAuth, async (req, res) => {
  try {
    const { url } = req.body as { url: string };
    if (!url) {
      res.status(400).json({ error: "URL required" });
      return;
    }
    const startTime = Date.now();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    const responseTime = Date.now() - startTime;
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const securityHeaders: Record<string, boolean> = {
      "strict-transport-security": !!headers["strict-transport-security"],
      "content-security-policy": !!headers["content-security-policy"],
      "x-frame-options": !!headers["x-frame-options"],
      "x-content-type-options": !!headers["x-content-type-options"],
      "x-xss-protection": !!headers["x-xss-protection"],
      "referrer-policy": !!headers["referrer-policy"],
      "permissions-policy": !!headers["permissions-policy"],
    };
    const result = {
      url,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      headers,
      securityHeaders,
    };
    saveHistory("HTTP Headers", { url }, result, req.session.userId!, req.session.username!);
    appLog("info", `HTTP Headers: ${url}`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "HTTP header check failed: " + String(err) });
  }
});

router.post("/tools/api-test", requireAuth, async (req, res) => {
  try {
    const { url, method = "GET", headers: customHeaders = {}, body } = req.body as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
    };
    if (!url) {
      res.status(400).json({ error: "URL required" });
      return;
    }
    const startTime = Date.now();
    const response = await fetch(url, {
      method,
      headers: customHeaders,
      body: body && method !== "GET" && method !== "HEAD" ? body : undefined,
      signal: AbortSignal.timeout(30000),
      redirect: "follow",
    });
    const responseTime = Date.now() - startTime;
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => { respHeaders[key] = value; });
    const respBody = await response.text();
    const result = {
      url,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      headers: respHeaders,
      body: respBody.slice(0, 50000),
      size: respBody.length,
    };
    saveHistory("API Test", { url, method }, result, req.session.userId!, req.session.username!);
    appLog("info", `API Test: ${method} ${url} -> ${response.status}`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "API test failed: " + String(err) });
  }
});

router.post("/tools/port-scan", requireAuth, async (req, res) => {
  try {
    const { ports } = req.body as { ports: number[] };
    if (!ports || !Array.isArray(ports) || ports.length === 0) {
      res.status(400).json({ error: "Port list required" });
      return;
    }
    const safePorts = ports.filter((p) => p >= 1 && p <= 65535).slice(0, 100);
    const startTime = Date.now();

    const serviceMap: Record<number, string> = {
      21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
      80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 3306: "MySQL",
      5432: "PostgreSQL", 6379: "Redis", 27017: "MongoDB", 8080: "HTTP-Alt",
      8443: "HTTPS-Alt", 3000: "Dev Server", 5000: "Dev Server",
    };

    const checkPort = (port: number): Promise<{ port: number; open: boolean; service: string | null }> =>
      new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on("connect", () => {
          socket.destroy();
          resolve({ port, open: true, service: serviceMap[port] ?? null });
        });
        socket.on("timeout", () => {
          socket.destroy();
          resolve({ port, open: false, service: serviceMap[port] ?? null });
        });
        socket.on("error", () => resolve({ port, open: false, service: serviceMap[port] ?? null }));
        socket.connect(port, "127.0.0.1");
      });

    const portResults = await Promise.all(safePorts.map(checkPort));
    const result = {
      host: "localhost (127.0.0.1)",
      ports: portResults,
      scanTime: Date.now() - startTime,
    };
    saveHistory("Port Scan", { ports: safePorts }, result, req.session.userId!, req.session.username!);
    appLog("info", `Port Scan: ${safePorts.length} ports`, { userId: req.session.userId, username: req.session.username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Port scan failed: " + String(err) });
  }
});

export default router;
