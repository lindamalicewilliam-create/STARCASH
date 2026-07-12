import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  transactionsTable,
  referralsTable,
  withdrawalsTable,
} from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const MIN_WITHDRAWAL = 6;

// GET /api/users/me/dashboard
router.get("/me/dashboard", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [referralCount] = await db
    .select({ count: count() })
    .from(referralsTable)
    .where(eq(referralsTable.referrerId, userId));

  const [activeReferralCount] = await db
    .select({ count: count() })
    .from(referralsTable)
    .where(eq(referralsTable.referrerId, userId));

  const recentTxns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);

  const totalBonusResult = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  // Sum bonus transactions
  const allTxns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const totalBonusEarned = allTxns
    .filter(t => t.type === "welcome_bonus" || t.type === "referral_bonus")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const host = `${req.protocol}://${req.get("host")}`;
  const referralLink = `${host}/register?ref=${user.referralCode}`;

  res.json({
    walletBalance: Number(user.walletBalance),
    totalEarnings: Number(user.totalEarnings),
    pendingEarnings: Number(user.pendingEarnings),
    withdrawableBalance: Number(user.withdrawableBalance),
    totalReferrals: Number(referralCount.count),
    activeReferrals: Number(activeReferralCount.count),
    totalBonusEarned,
    membershipStatus: user.status,
    referralCode: user.referralCode,
    referralLink,
    recentTransactions: recentTxns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export default router;
