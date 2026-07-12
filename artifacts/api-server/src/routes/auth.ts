import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  couponsTable,
  transactionsTable,
  referralsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";
import { generateReferralCode } from "../lib/referralCode";

const router = Router();

const WELCOME_BONUS = "1.00";
const REFERRAL_BONUS = "3.00";
const MIN_WITHDRAWAL = 6;

function getReferralLink(code: string, host: string): string {
  return `${host}/register?ref=${code}`;
}

function buildUserResponse(user: typeof usersTable.$inferSelect, host: string) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    referralLink: getReferralLink(user.referralCode, host),
    walletBalance: Number(user.walletBalance),
    totalEarnings: Number(user.totalEarnings),
    pendingEarnings: Number(user.pendingEarnings),
    withdrawableBalance: Number(user.withdrawableBalance),
    totalReferrals: 0,
    activeReferrals: 0,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { fullName, username, email, phone, password, confirmPassword, referralCode, couponCode } = req.body;

  if (!fullName || !username || !email || !phone || !password || !couponCode) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  // Validate coupon
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, couponCode.toUpperCase()))
    .limit(1);

  if (!coupon) {
    res.status(400).json({ error: "Invalid coupon code" });
    return;
  }
  if (coupon.status !== "unused") {
    res.status(400).json({ error: "Coupon has already been used or is disabled" });
    return;
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400).json({ error: "Coupon has expired" });
    return;
  }

  // Check uniqueness
  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingEmail) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }
  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  // Find referrer
  let referrer: typeof usersTable.$inferSelect | undefined;
  if (referralCode) {
    const [ref] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode.toUpperCase())).limit(1);
    referrer = ref;
  }

  // Generate unique referral code
  let newReferralCode = generateReferralCode();
  // Ensure uniqueness
  while (true) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.referralCode, newReferralCode)).limit(1);
    if (!existing) break;
    newReferralCode = generateReferralCode();
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      fullName,
      username,
      email,
      phone,
      passwordHash,
      referralCode: newReferralCode,
      referredBy: referrer?.id ?? null,
      walletBalance: WELCOME_BONUS,
      totalEarnings: WELCOME_BONUS,
      withdrawableBalance: WELCOME_BONUS,
    })
    .returning();

  // Mark coupon as used
  await db
    .update(couponsTable)
    .set({ status: "used", usedByUserId: user.id, updatedAt: new Date() })
    .where(eq(couponsTable.id, coupon.id));

  // Welcome bonus transaction
  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "welcome_bonus",
    amount: WELCOME_BONUS,
    status: "successful",
    description: "Welcome Bonus",
  });

  // Referral bonus for referrer
  if (referrer) {
    const newBalance = (Number(referrer.walletBalance) + Number(REFERRAL_BONUS)).toFixed(2);
    const newEarnings = (Number(referrer.totalEarnings) + Number(REFERRAL_BONUS)).toFixed(2);
    const newWithdrawable = (Number(referrer.withdrawableBalance) + Number(REFERRAL_BONUS)).toFixed(2);
    await db.update(usersTable).set({
      walletBalance: newBalance,
      totalEarnings: newEarnings,
      withdrawableBalance: newWithdrawable,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, referrer.id));

    await db.insert(transactionsTable).values({
      userId: referrer.id,
      type: "referral_bonus",
      amount: REFERRAL_BONUS,
      status: "successful",
      description: `Referral bonus for inviting ${username}`,
    });

    await db.insert(referralsTable).values({
      referrerId: referrer.id,
      referredUserId: user.id,
      bonusAmount: REFERRAL_BONUS,
      status: "active",
    });
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ user: buildUserResponse(user, host), token });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.status === "suspended") {
    res.status(403).json({ error: "Account is suspended" });
    return;
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ user: buildUserResponse(user, host), token });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const host = `${req.protocol}://${req.get("host")}`;
  res.json(buildUserResponse(user, host));
});

export default router;
