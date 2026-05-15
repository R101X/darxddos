import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { setIo } from "./data/logger.js";
import { store } from "./data/store.js";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/api/socket.io",
});

app.locals.io = io;
setIo(io);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

async function seedAdmin() {
  const users = store.getUsers();
  if (users.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    store.addUser({
      id: randomUUID(),
      username: "admin",
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });
    logger.info("Default admin created: admin / admin123");
  }
}

seedAdmin().catch((err) => logger.error({ err }, "Seed failed"));

httpServer.listen(port, () => {
  logger.info({ port }, "DarXddos server listening");
});
