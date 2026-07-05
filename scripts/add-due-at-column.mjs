/**
 * scripts/add-due-at-column.mjs
 *
 * Thêm cột due_at vào bảng todos trực tiếp trên Supabase.
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = resolve(__dirname, '../.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value) process.env[key] = value;
    }
  } catch {
    console.error('❌ Không tìm thấy file .env.local');
    process.exit(1);
  }
}

async function main() {
  loadEnvLocal();
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error('❌ DATABASE_URL chưa được điền trong .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Đã kết nối PostgreSQL!');

    console.log('🔄 Đang chạy lệnh ALTER TABLE...');
    await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;');
    console.log('✅ Đã thêm cột due_at vào bảng todos thành công!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
