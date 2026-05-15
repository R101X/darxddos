import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/history", requireAuth, (req, res) => {
  const all = store.getHistory();
  const userId = req.session.userId!;
  const role = req.session.role;
  const entries = role === "admin" ? all : all.filter((h) => h.userId === userId);
  res.json(entries);
});

router.get("/history/export", requireAuth, (req, res) => {
  const all = store.getHistory();
  const userId = req.session.userId!;
  const role = req.session.role;
  const entries = role === "admin" ? all : all.filter((h) => h.userId === userId);
  res.json({ exportedAt: new Date().toISOString(), entries });
});

router.delete("/history/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const all = store.getHistory();
  const entry = all.find((h) => h.id === id);
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  if (entry.userId !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  store.deleteHistory(id);
  res.json({ success: true, message: "Deleted" });
});

export default router;
