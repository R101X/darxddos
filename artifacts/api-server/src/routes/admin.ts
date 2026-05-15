import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/admin/users", requireAdmin, (req, res) => {
  const users = store.getUsers().map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));
  res.json(users);
});

router.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (id === req.session.userId) {
    res.status(400).json({ error: "Cannot delete yourself" });
    return;
  }
  const user = store.getUserById(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  store.deleteUser(id);
  res.json({ success: true, message: "User deleted" });
});

router.get("/admin/stats", requireAdmin, (req, res) => {
  const users = store.getUsers();
  const history = store.getHistory();
  const toolCounts: Record<string, number> = {};
  for (const h of history) {
    toolCounts[h.tool] = (toolCounts[h.tool] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tool, count]) => ({ tool, count }));
  res.json({
    totalUsers: users.length,
    totalRequests: history.length,
    totalHistory: history.length,
    activeSessions: 1,
    topTools,
  });
});

export default router;
