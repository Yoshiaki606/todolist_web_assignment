/**
 * scripts/test-connection.mjs
 *
 * Script kiểm tra kết nối Supabase và deploy schema.
 * Chạy: node scripts/test-connection.mjs
 *
 * Yêu cầu: .env.local phải có SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvLocal }  from './_loadEnv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(emoji, msg)  { console.log(`${emoji}  ${msg}`); }
function fail(msg)        { console.error(`\n❌  ${msg}\n`); process.exit(1); }
function section(title)   { console.log(`\n${'─'.repeat(50)}\n📌  ${title}\n${'─'.repeat(50)}`); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🚀  Supabase Connection & Schema Checker\n');

  // 1. Load env
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 2. Kiểm tra credentials có được điền chưa
  section('Kiểm tra credentials');

  if (!url || url.trim() === '') {
    fail('SUPABASE_URL chưa được điền trong .env.local');
  }
  if (!key || key.trim() === '') {
    fail('SUPABASE_SERVICE_ROLE_KEY chưa được điền trong .env.local');
  }

  log('✅', `SUPABASE_URL:              ${url}`);
  log('✅', `SUPABASE_SERVICE_ROLE_KEY: ${key.slice(0, 20)}...`);

  // 3. Khởi tạo client
  section('Khởi tạo Supabase client');
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  log('✅', 'Client khởi tạo thành công');

  // 4. Test kết nối bằng cách gọi một query đơn giản
  section('Kiểm tra kết nối tới Supabase');
  try {
    // Thử select từ bảng todos (có thể chưa tồn tại)
    const { error } = await supabase.from('todos').select('id').limit(1);

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        log('⚠️ ', 'Bảng "todos" chưa tồn tại → cần deploy schema (xem bước tiếp theo)');
      } else {
        fail(`Lỗi kết nối Supabase: ${error.message}\n   Code: ${error.code}`);
      }
    } else {
      log('✅', 'Kết nối thành công! Bảng "todos" đã tồn tại');
    }
  } catch (err) {
    if (err instanceof TypeError) {
      fail('Không thể kết nối mạng. Kiểm tra SUPABASE_URL có đúng định dạng không.');
    }
    fail(`Lỗi không xác định: ${err.message}`);
  }

  // 5. Đọc và in ra schema SQL cần deploy
  section('Schema SQL cần deploy');
  const schemaPath = resolve(__dirname, '../supabase/schema.sql');
  let schemaSql;
  try {
    schemaSql = readFileSync(schemaPath, 'utf-8');
    log('✅', `Đọc schema từ: supabase/schema.sql (${schemaSql.length} ký tự)`);
  } catch {
    fail('Không tìm thấy file supabase/schema.sql');
  }

  // 6. Hướng dẫn deploy schema
  section('Hướng dẫn deploy schema lên Supabase');
  console.log(`
  Vào Supabase Dashboard và chạy schema theo các bước:

  1. Mở: ${url.replace('.supabase.co', '.supabase.co')}/project/default/sql/new
     (hoặc: Dashboard > SQL Editor > New query)

  2. Copy và dán toàn bộ nội dung file:
     📄 supabase/schema.sql

  3. Bấm "Run" (hoặc Ctrl+Enter)

  4. Kiểm tra Table Editor — phải thấy bảng "todos" với 6 cột

  💡 Hoặc chạy lại script này sau khi deploy để xác nhận bảng đã tạo thành công.
`);

  console.log('✨  Done!\n');
}

main().catch((err) => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
