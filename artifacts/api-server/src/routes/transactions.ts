import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/users/me/transactions
router.get("/me/transactions", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const txns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(
    txns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }))
  );
});

export default router;
