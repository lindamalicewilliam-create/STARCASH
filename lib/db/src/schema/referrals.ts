import { pgTable, serial, numeric, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const referralStatusEnum = pgEnum("referral_status", ["pending", "active"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  bonusAmount: numeric("bonus_amount", { precision: 12, scale: 2 }).notNull().default("3"),
  status: referralStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
