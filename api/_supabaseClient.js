/**
 * api/_supabaseClient.js
 *
 * Module dùng chung để khởi tạo Supabase Admin Client phía server.
 * Chỉ dùng trong các Vercel Serverless Functions (thư mục /api).
 *
 * KHÔNG import file này ở phía frontend (src/) — service role key
 * phải được giữ bí mật, không được expose ra browser.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Tự động load file .env.local ở root khi chạy local
 * nếu Vercel CLI chưa load được (do chưa link project, offline, v.v.)
 */
function loadLocalEnv() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const envPath = resolve(__dirname, '../.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    // Bỏ qua lỗi nếu không tìm thấy file (khi chạy trên production Vercel)
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
  const supabaseUrl = process.env.SUPABASE_URL;
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
