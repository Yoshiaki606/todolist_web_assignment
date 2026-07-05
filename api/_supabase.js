/**
 * api/_supabase.js
 *
 * Module dùng chung để khởi tạo Supabase Admin Client phía server.
 * Chỉ dùng trong các Vercel Serverless Functions (thư mục /api).
 *
 * KHÔNG import file này ở phía frontend (src/) — service role key
 * phải được giữ bí mật, không được expose ra browser.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Tìm file .env.local bằng cách đi ngược lên các thư mục cha.
 * @returns {string|null} Đường dẫn tuyệt đối đến .env.local, hoặc null nếu không tìm thấy
 */
function findEnvLocal() {
  const startPaths = [];
  try {
    startPaths.push(dirname(fileURLToPath(import.meta.url)));
  } catch { /* fallback to cwd */ }
  startPaths.push(process.cwd());

  for (const startPath of startPaths) {
    let current = startPath;
    for (let i = 0; i < 5; i++) {
      const candidate = resolve(current, '.env.local');
      if (existsSync(candidate)) {
        return candidate;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  console.warn('[SupabaseClient] .env.local not found — set env vars manually or via Vercel dashboard.');
  return null;
}

/**
 * Tự động load file .env.local ở root khi chạy local
 * nếu Vercel CLI chưa load được (do chưa link project, offline, v.v.)
 */
function loadLocalEnv() {
  // Nếu biến môi trường đã có sẵn (Vercel production / Vercel CLI) thì bỏ qua
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const envPath = findEnvLocal();
    if (!envPath) return;

    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      let value   = trimmed.slice(eqIdx + 1).trim();

      // Loại bỏ dấu nháy kép hoặc nháy đơn bọc ngoài giá trị nếu có
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error('[SupabaseClient] Error loading .env.local:', err.message);
  }
}

/**
 * Trả về một Supabase client được xác thực bằng service role key.
 * Client này bypass Row Level Security (RLS) — dùng cẩn thận.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} Nếu biến môi trường chưa được cấu hình
 */
export function getSupabaseClient() {
  loadLocalEnv();

  const supabaseUrl            = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[Supabase] Thiếu biến môi trường SUPABASE_URL. ' +
      'Kiểm tra file .env.local hoặc cấu hình Environment Variables trên Vercel.'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      '[Supabase] Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY. ' +
      'Kiểm tra file .env.local hoặc cấu hình Environment Variables trên Vercel.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Tắt auto-refresh token và session persistence vì đây là server-side client
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
