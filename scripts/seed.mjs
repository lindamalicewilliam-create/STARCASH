#!/usr/bin/env node
// Seed script: super admin user + coupons.
// Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD when running this script.
import { createRequire } from 'node:module';

const requireFromApi = createRequire(new URL('../artifacts/api-server/package.json', import.meta.url));
const requireFromDb = createRequire(new URL('../lib/db/package.json', import.meta.url));
const bcrypt = requireFromApi('bcryptjs');
const pg = requireFromDb('pg');

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminUsername || !adminPassword) {
  throw new Error('ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD are required');
}

const adminHash = await bcrypt.hash(adminPassword, 12);

// Create or reset the super admin account. This is intentionally explicit so a
// newly imported project never relies on a publicly documented default password.
await pool.query(`
  INSERT INTO users (username, email, full_name, phone, password_hash, role, status, referral_code, wallet_balance, total_earnings, pending_earnings, withdrawable_balance)
  VALUES ($1,$2,$3,$4,$5,'admin','active',$6,'0','0','0','0')
  ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    status = 'active',
    updated_at = NOW()
`, [adminUsername, adminEmail, 'StarCash Super Admin', '0000000000', adminHash, 'SUPERADMIN001']);

console.log(`Super admin seeded: ${adminEmail}`);

// Insert coupons
const codes = [
  'welcome@001','welcome#002','welcome$003','welcome!004','welcome*005',
  'promo@2026a','promo#2026b','promo$2026c','test*coupon1'
];
for (const code of codes) {
  await pool.query(`
    INSERT INTO coupons (code, value, status)
    VALUES ($1, 0, 'unused')
    ON CONFLICT DO NOTHING
  `, [code]);
}
console.log('Coupons seeded:', codes.join(', '));

await pool.end();
