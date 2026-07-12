import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/users/me/referrals
router.get("/me/referrals", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const referrals = await db
    .select({
      id: referralsTable.id,
      referredUserId: referralsTable.referredUserId,
      bonusAmount: referralsTable.bonusAmount,
      status: referralsTable.status,
      createdAt: referralsTable.createdAt,
      referredUsername: usersTable.username,
      referredFullName: usersTable.fullName,
    })
    .from(referralsTable)
    .innerJoin(usersTable, eq(usersTable.id, referralsTable.referredUserId))
    .where(eq(referralsTable.referrerId, userId))
    .orderBy(referralsTable.createdAt);

  res.json(
    referrals.map(r => ({
      id: r.id,
      referredUserId: r.referredUserId,
      referredUsername: r.referredUsername,
      referredFullName: r.referredFullName,
      bonusAmount: Number(r.bonusAmount),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export default router;
