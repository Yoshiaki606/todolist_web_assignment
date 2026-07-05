/**
 * scripts/deploy-schema.mjs
 *
 * Deploy schema.sql lên Supabase bằng kết nối PostgreSQL trực tiếp.
 * Dùng connection string (DATABASE_URL) — không cần SUPABASE_URL hay service role key.
 *
 * Chạy: node scripts/deploy-schema.mjs
 * Yêu cầu: DATABASE_URL phải có trong .env.local
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
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

function log(emoji, msg) { console.log(`${emoji}  ${msg}`); }
function section(t)      { console.log(`\n${'─'.repeat(55)}\n📌  ${t}\n${'─'.repeat(55)}`); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🚀  Supabase Schema Deployer\n');
  loadEnvLocal();

  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error('❌  DATABASE_URL chưa được điền trong .env.local');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Đọc schema SQL
  // ---------------------------------------------------------------------------
  section('Đọc schema.sql');
  const schemaPath = resolve(__dirname, '../supabase/schema.sql');
  const schemaSql  = readFileSync(schemaPath, 'utf-8');
  log('✅', `schema.sql (${schemaSql.length} ký tự)`);

  // ---------------------------------------------------------------------------
  // Kết nối PostgreSQL
  // ---------------------------------------------------------------------------
  section('Kết nối tới Supabase PostgreSQL');

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }, // Supabase yêu cầu SSL
  });

  try {
    await client.connect();
    log('✅', 'Kết nối thành công!');
  } catch (err) {
    console.error(`\n❌  Không thể kết nối: ${err.message}\n`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Deploy schema
  // ---------------------------------------------------------------------------
  section('Deploy schema');

  try {
    await client.query('BEGIN');
    log('🔄', 'Đang chạy schema.sql...');

    await client.query(schemaSql);
    await client.query('COMMIT');

    log('✅', 'Deploy thành công!');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`\n❌  Lỗi khi chạy schema: ${err.message}\n`);
    await client.end();
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Verify: kiểm tra bảng đã tạo
  // ---------------------------------------------------------------------------
  section('Kiểm tra kết quả');

  try {
    // Kiểm tra bảng tồn tại
    const tableRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todos'
      ORDER BY ordinal_position;
    `);

    if (tableRes.rows.length === 0) {
      console.error('❌  Bảng "todos" không được tìm thấy sau khi deploy!');
    } else {
      log('✅', `Bảng "todos" đã được tạo với ${tableRes.rows.length} cột:\n`);
      console.table(tableRes.rows.map(r => ({
        'Cột':          r.column_name,
        'Kiểu':         r.data_type,
        'Nullable':     r.is_nullable,
        'Default':      r.column_default?.slice(0, 30) ?? '—',
      })));
    }

    // Kiểm tra trigger
    const triggerRes = await client.query(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE event_object_table = 'todos';
    `);
    log('✅', `Triggers: ${triggerRes.rows.map(r => r.trigger_name).join(', ') || 'không có'}`);

    // Kiểm tra indexes
    const indexRes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'todos' AND schemaname = 'public';
    `);
    log('✅', `Indexes: ${indexRes.rows.map(r => r.indexname).join(', ')}`);

  } catch (err) {
    console.error(`⚠️  Lỗi khi verify: ${err.message}`);
  }

  await client.end();
  console.log('\n✨  Hoàn tất! Bảng todos đã sẵn sàng trên Supabase.\n');
}

main().catch((err) => {
  console.error('\n💥  Lỗi:', err.message);
  process.exit(1);
});
