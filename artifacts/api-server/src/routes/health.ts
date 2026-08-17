import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    const result = await db.execute(
      sql`select to_regclass('public.users') as users_table`,
    );
    const usersTableName = result.rows[0]?.users_table;
    if (usersTableName !== "users") {
      res.status(503).json({ status: "unavailable" });
      return;
    }

    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

export default router;
