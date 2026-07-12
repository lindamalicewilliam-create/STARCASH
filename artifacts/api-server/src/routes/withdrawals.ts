import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const MIN_WITHDRAWAL = 6;

// GET /api/withdrawals
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const withdrawals = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, userId))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(
    withdrawals.map(w => ({
      id: w.id,
      userId: w.userId,
      bankName: w.bankName,
      accountName: w.accountName,
      accountNumber: w.accountNumber,
      amount: Number(w.amount),
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }))
  );
});

// POST /api/withdrawals
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  // Withdrawals are only accepted on Sundays (day 0)
  if (new Date().getDay() !== 0) {
    res.status(403).json({ error: "Payout requests are only accepted on Sundays." });
    return;
  }

  const { bankName, accountName, accountNumber, amount } = req.body;

  if (!bankName || !accountName || !accountNumber || !amount) {
    res.status(400).json({ error: "All withdrawal fields are required" });
    return;
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
    res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (Number(user.withdrawableBalance) < numAmount) {
    res.status(400).json({ error: "Insufficient withdrawable balance" });
    return;
  }

  // Deduct from withdrawable balance (pending approval)
  const newWithdrawable = (Number(user.withdrawableBalance) - numAmount).toFixed(2);
  const newPending = (Number(user.pendingEarnings) + numAmount).toFixed(2);
  await db.update(usersTable).set({
    withdrawableBalance: newWithdrawable,
    pendingEarnings: newPending,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, userId));

  const [withdrawal] = await db
    .insert(withdrawalsTable)
    .values({
      userId,
      bankName,
      accountName,
      accountNumber,
      amount: numAmount.toFixed(2),
      status: "pending",
    })
    .returning();

  await db.insert(transactionsTable).values({
    userId,
    type: "withdrawal",
    amount: numAmount.toFixed(2),
    status: "pending",
    description: `Withdrawal to ${bankName} - ${accountNumber}`,
  });

  res.status(201).json({
    id: withdrawal.id,
    userId: withdrawal.userId,
    bankName: withdrawal.bankName,
    accountName: withdrawal.accountName,
    accountNumber: withdrawal.accountNumber,
    amount: Number(withdrawal.amount),
    status: withdrawal.status,
    createdAt: withdrawal.createdAt.toISOString(),
    updatedAt: withdrawal.updatedAt.toISOString(),
  });
});

export default router;
