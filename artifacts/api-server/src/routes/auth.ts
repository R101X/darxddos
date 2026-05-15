import { Router } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { store } from "../data/store.js";
import { appLog } from "../data/logger.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    if (username.length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existing = store.getUserByUsername(username);
    if (existing) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }
    const users = store.getUsers();
    const role = users.length === 0 ? "admin" : "user";
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id: randomUUID(),
      username,
      passwordHash,
      role: role as "admin" | "user",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    store.addUser(user);
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    appLog("success", `New user registered: ${username} (${role})`, {
      userId: user.id,
      username,
    });
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      token: req.sessionID,
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    const user = store.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    store.updateUser(user.id, { lastLogin: new Date().toISOString() });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    appLog("info", `User logged in: ${username}`, {
      userId: user.id,
      username,
    });
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: new Date().toISOString(),
      },
      token: req.sessionID,
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", requireAuth, (req, res) => {
  const username = req.session.username;
  req.session.destroy(() => {
    appLog("info", `User logged out: ${username}`);
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = store.getUserById(req.session.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  });
});

export default router;
