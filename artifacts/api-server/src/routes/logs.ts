import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/logs", requireAuth, (req, res) => {
  const logs = store.getLogs().slice(0, 200);
  res.json(logs);
});

export default router;
