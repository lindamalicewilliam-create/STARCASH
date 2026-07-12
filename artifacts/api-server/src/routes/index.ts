import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import referralsRouter from "./referrals";
import transactionsRouter from "./transactions";
import withdrawalsRouter from "./withdrawals";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/users", referralsRouter);
router.use("/users", transactionsRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/admin", adminRouter);

export default router;
