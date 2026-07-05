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

/**
 * Trả về một Supabase client được xác thực bằng service role key.
 * Client này bypass Row Level Security (RLS) — dùng cẩn thận.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} Nếu biến môi trường chưa được cấu hình
 */
export function getSupabaseClient() {
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
