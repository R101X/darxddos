import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import toolsRouter from "./tools.js";
import historyRouter from "./history.js";
import logsRouter from "./logs.js";
import adminRouter from "./admin.js";
import ddosRouter from "./ddos.js";
import networkRouter from "./network.js";
import loadtestRouter from "./loadtest.js";
import { incrementRequests } from "./network.js";

const router: IRouter = Router();

router.use((req, _res, next) => {
  incrementRequests();
  next();
});

router.use(healthRouter);
router.use(authRouter);
router.use(toolsRouter);
router.use(historyRouter);
router.use(logsRouter);
router.use(adminRouter);
router.use(ddosRouter);
router.use(networkRouter);
router.use(loadtestRouter);

export default router;
