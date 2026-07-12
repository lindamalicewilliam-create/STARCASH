import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  couponsTable,
  transactionsTable,
  withdrawalsTable,
  referralsTable,
} from "@workspace/db";
import { eq, ilike, or, count, sum, desc, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { generateCouponCode } from "../lib/referralCode";

const router = Router();

// GET /api/admin/stats
router.get("/stats", requireAdmin, async (req, res) => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [activeUsers] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.status, "active"));

  const allTxns = await db.select().from(transactionsTable);
  const totalEarningsPaid = allTxns
    .filter(t => (t.type === "welcome_bonus" || t.type === "referral_bonus") && t.status === "successful")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalReferralBonuses = allTxns
    .filter(t => t.type === "referral_bonus" && t.status === "successful")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const [totalCoupons] = await db.select({ count: count() }).from(couponsTable);
  const [usedCoupons] = await db.select({ count: count() }).from(couponsTable).where(eq(couponsTable.status, "used"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const allUsers = await db.select().from(usersTable);
  const dailyRegistrations = allUsers.filter(u => u.createdAt >= today).length;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = allTxns
    .filter(t => t.createdAt >= thisMonth && t.status === "successful")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const allWithdrawals = await db.select().from(withdrawalsTable);
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending").length;
  const totalWithdrawals = allWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  res.json({
    totalUsers: Number(totalUsers.count),
    activeUsers: Number(activeUsers.count),
    totalEarningsPaid,
    totalReferralBonuses,
    totalCoupons: Number(totalCoupons.count),
    usedCoupons: Number(usedCoupons.count),
    dailyRegistrations,
    monthlyRevenue,
    pendingWithdrawals,
    totalWithdrawals,
  });
});

// GET /api/admin/users
router.get("/users", requireAdmin, async (req, res) => {
  const { search, status } = req.query as { search?: string; status?: string };

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  if (status === "active" || status === "suspended") {
    users = users.filter(u => u.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q)
    );
  }

  const referralCounts = await db
    .select({ referrerId: referralsTable.referrerId, cnt: count() })
    .from(referralsTable)
    .groupBy(referralsTable.referrerId);
  const refMap = new Map(referralCounts.map(r => [r.referrerId, Number(r.cnt)]));

  res.json(
    users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      referralCode: u.referralCode,
      referredBy: null,
      walletBalance: Number(u.walletBalance),
      totalEarnings: Number(u.totalEarnings),
      totalReferrals: refMap.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

// GET /api/admin/users/:id
router.get("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [refCount] = await db.select({ cnt: count() }).from(referralsTable).where(eq(referralsTable.referrerId, id));
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    referredBy: null,
    walletBalance: Number(user.walletBalance),
    totalEarnings: Number(user.totalEarnings),
    totalReferrals: Number(refCount.cnt),
    createdAt: user.createdAt.toISOString(),
  });
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, fullName, phone, walletBalance, role } = req.body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (fullName !== undefined) updates.fullName = fullName;
  if (phone !== undefined) updates.phone = phone;
  if (walletBalance !== undefined) updates.walletBalance = String(walletBalance);
  if (role !== undefined) updates.role = role;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [refCount] = await db.select({ cnt: count() }).from(referralsTable).where(eq(referralsTable.referrerId, id));
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    referredBy: null,
    walletBalance: Number(user.walletBalance),
    totalEarnings: Number(user.totalEarnings),
    totalReferrals: Number(refCount.cnt),
    createdAt: user.createdAt.toISOString(),
  });
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// GET /api/admin/coupons
router.get("/coupons", requireAdmin, async (req, res) => {
  const { status } = req.query as { status?: string };
  let coupons = await db
    .select({
      id: couponsTable.id,
      code: couponsTable.code,
      value: couponsTable.value,
      status: couponsTable.status,
      usedByUserId: couponsTable.usedByUserId,
      expiresAt: couponsTable.expiresAt,
      createdAt: couponsTable.createdAt,
      usedByUsername: usersTable.username,
    })
    .from(couponsTable)
    .leftJoin(usersTable, eq(usersTable.id, couponsTable.usedByUserId))
    .orderBy(desc(couponsTable.createdAt));

  if (status === "used" || status === "unused" || status === "disabled") {
    coupons = coupons.filter(c => c.status === status);
  }

  res.json(
    coupons.map(c => ({
      id: c.id,
      code: c.code,
      value: Number(c.value),
      status: c.status,
      usedByUserId: c.usedByUserId ?? null,
      usedByUsername: c.usedByUsername ?? null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

// POST /api/admin/coupons
router.post("/coupons", requireAdmin, async (req, res) => {
  const { code, value, expiresAt } = req.body;
  const couponCode = (code as string)?.toUpperCase() || generateCouponCode();
  const [coupon] = await db
    .insert(couponsTable)
    .values({
      code: couponCode,
      value: String(value ?? 1),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  res.status(201).json({
    id: coupon.id,
    code: coupon.code,
    value: Number(coupon.value),
    status: coupon.status,
    usedByUserId: null,
    usedByUsername: null,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
  });
});

// POST /api/admin/coupons/bulk
router.post("/coupons/bulk", requireAdmin, async (req, res) => {
  const { count: num, value, expiresAt } = req.body;
  const total = Math.min(Number(num) || 1, 500);
  const rows = [];
  for (let i = 0; i < total; i++) {
    rows.push({
      code: generateCouponCode(),
      value: String(value ?? 1),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  }
  const inserted = await db.insert(couponsTable).values(rows).returning();
  res.status(201).json(
    inserted.map(c => ({
      id: c.id,
      code: c.code,
      value: Number(c.value),
      status: c.status,
      usedByUserId: null,
      usedByUsername: null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

// PATCH /api/admin/coupons/:id
router.patch("/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, expiresAt } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const [coupon] = await db
    .update(couponsTable)
    .set(updates)
    .where(eq(couponsTable.id, id))
    .returning();

  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }
  res.json({
    id: coupon.id,
    code: coupon.code,
    value: Number(coupon.value),
    status: coupon.status,
    usedByUserId: coupon.usedByUserId ?? null,
    usedByUsername: null,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
  });
});

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.json({ ok: true });
});

// GET /api/admin/withdrawals
router.get("/withdrawals", requireAdmin, async (req, res) => {
  const { status } = req.query as { status?: string };

  let results = await db
    .select({
      id: withdrawalsTable.id,
      userId: withdrawalsTable.userId,
      bankName: withdrawalsTable.bankName,
      accountName: withdrawalsTable.accountName,
      accountNumber: withdrawalsTable.accountNumber,
      amount: withdrawalsTable.amount,
      status: withdrawalsTable.status,
      createdAt: withdrawalsTable.createdAt,
      updatedAt: withdrawalsTable.updatedAt,
      username: usersTable.username,
      fullName: usersTable.fullName,
    })
    .from(withdrawalsTable)
    .innerJoin(usersTable, eq(usersTable.id, withdrawalsTable.userId))
    .orderBy(desc(withdrawalsTable.createdAt));

  if (status) {
    results = results.filter(w => w.status === status);
  }

  res.json(
    results.map(w => ({
      id: w.id,
      userId: w.userId,
      username: w.username,
      fullName: w.fullName,
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

// PATCH /api/admin/withdrawals/:id
router.patch("/withdrawals/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const [withdrawal] = await db
    .update(withdrawalsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(withdrawalsTable.id, id))
    .returning();

  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  // If rejected, refund the withdrawable balance
  if (status === "rejected") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId)).limit(1);
    if (user) {
      const refundAmount = Number(withdrawal.amount);
      const newWithdrawable = (Number(user.withdrawableBalance) + refundAmount).toFixed(2);
      const newPending = Math.max(0, Number(user.pendingEarnings) - refundAmount).toFixed(2);
      await db.update(usersTable).set({
        withdrawableBalance: newWithdrawable,
        pendingEarnings: newPending,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id));
    }
  }

  // If completed, finalize — deduct from wallet balance
  if (status === "completed") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId)).limit(1);
    if (user) {
      const amt = Number(withdrawal.amount);
      const newBalance = Math.max(0, Number(user.walletBalance) - amt).toFixed(2);
      const newPending = Math.max(0, Number(user.pendingEarnings) - amt).toFixed(2);
      await db.update(usersTable).set({
        walletBalance: newBalance,
        pendingEarnings: newPending,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id));
    }
  }

  // Update related transaction
  await db
    .update(transactionsTable)
    .set({ status: status === "completed" ? "successful" : status === "rejected" ? "failed" : "pending" })
    .where(
      and(
        eq(transactionsTable.userId, withdrawal.userId),
        eq(transactionsTable.type, "withdrawal")
      )
    );

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId)).limit(1);

  res.json({
    id: withdrawal.id,
    userId: withdrawal.userId,
    username: user?.username ?? "",
    fullName: user?.fullName ?? "",
    bankName: withdrawal.bankName,
    accountName: withdrawal.accountName,
    accountNumber: withdrawal.accountNumber,
    amount: Number(withdrawal.amount),
    status: withdrawal.status,
    createdAt: withdrawal.createdAt.toISOString(),
    updatedAt: withdrawal.updatedAt.toISOString(),
  });
});

// GET /api/admin/transactions
router.get("/transactions", requireAdmin, async (req, res) => {
  const { userId } = req.query as { userId?: string };

  let txns = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt));

  if (userId) {
    const uid = Number(userId);
    txns = txns.filter(t => t.userId === uid);
  }

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
