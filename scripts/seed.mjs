#!/usr/bin/env node
// Seed script: admin user + coupons
import bcrypt from '/home/runner/workspace/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js';
import pg from '/home/runner/workspace/node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adminHash = await bcrypt.hash('password123', 10);

// Insert admin user
await pool.query(`
  INSERT INTO users (username, email, full_name, phone, password_hash, role, status, referral_code, wallet_balance, total_earnings, pending_earnings, withdrawable_balance)
  VALUES ($1,$2,$3,$4,$5,'admin','active',$6,'0','0','0','0')
  ON CONFLICT (email) DO NOTHING
`, ['admin', 'admin@starcash.com', 'Admin User', '0000000000', adminHash, 'ADMIN001']);

console.log('Admin user seeded');

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
