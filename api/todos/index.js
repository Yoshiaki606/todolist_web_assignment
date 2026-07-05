/**
 * api/todos/index.js
 *
 * Vercel Serverless Function — /api/todos
 *
 * Supported methods:
 *   GET  /api/todos              → Lấy danh sách todos (có filter + phân trang)
 *   POST /api/todos              → Tạo todo mới
 *
 * Query params cho GET:
 *   status  — lọc theo trạng thái ('pending' | 'completed')
 *   keyword — tìm kiếm theo title (case-insensitive)
 *   page    — số trang, mặc định 1
 *   limit   — số item mỗi trang, mặc định 20
 *
 * Body cho POST (JSON):
 *   title       {string} bắt buộc, tối đa 200 ký tự
 *   description {string} tùy chọn
 */

import { getSupabaseClient } from '../_supabaseClient.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;
const MAX_TITLE_LEN = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Gửi JSON response với status code cho trước.
 */
function sendJSON(res, statusCode, body) {
  res.status(statusCode).json(body);
}

/**
 * Parse và validate các query params phân trang.
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ---------------------------------------------------------------------------
// Handler: GET /api/todos
// ---------------------------------------------------------------------------

async function handleGet(req, res) {
  const supabase = getSupabaseClient();
  const { status, keyword } = req.query;
  const { limit, offset }   = parsePagination(req.query);

  // Bắt đầu xây query — select all, đếm tổng để trả về total
  let query = supabase
    .from('todos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Lọc theo status nếu có và hợp lệ
  if (status) {
    if (!['pending', 'completed'].includes(status)) {
      return sendJSON(res, 400, {
        error: "Tham số 'status' chỉ chấp nhận 'pending' hoặc 'completed'.",
      });
    }
    query = query.eq('status', status);
  }

  // Tìm kiếm theo title (case-insensitive) nếu có keyword
  if (keyword && keyword.trim()) {
    query = query.ilike('title', `%${keyword.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /api/todos] Supabase error:', error.message);
    return sendJSON(res, 500, { error: error.message });
  }

  return sendJSON(res, 200, { data, total: count ?? 0 });
}

// ---------------------------------------------------------------------------
// Handler: POST /api/todos
// ---------------------------------------------------------------------------

async function handlePost(req, res) {
  const { title, description } = req.body ?? {};

  // --- Validation ---

  // title bắt buộc và không được rỗng / toàn khoảng trắng
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return sendJSON(res, 400, { error: "'title' là trường bắt buộc và không được để trống." });
  }

  // title không vượt quá MAX_TITLE_LEN ký tự
  if (title.trim().length > MAX_TITLE_LEN) {
    return sendJSON(res, 400, {
      error: `'title' không được vượt quá ${MAX_TITLE_LEN} ký tự.`,
    });
  }

  // description phải là string nếu có
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return sendJSON(res, 400, { error: "'description' phải là chuỗi ký tự." });
  }

  // --- Insert vào Supabase ---
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('todos')
    .insert([
      {
        title:       title.trim(),
        description: description?.trim() ?? null,
        // status mặc định 'pending' đã được set ở DB level
      },
    ])
    .select()  // trả về row vừa insert
    .single();

  if (error) {
    console.error('[POST /api/todos] Supabase error:', error.message);
    return sendJSON(res, 500, { error: error.message });
  }

  return sendJSON(res, 201, data);
}

// ---------------------------------------------------------------------------
// Main export — Vercel Serverless Function entry point
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  try {
    // Chỉ cho phép GET và POST
    if (req.method === 'GET') {
      return await handleGet(req, res);
    }

    if (req.method === 'POST') {
      return await handlePost(req, res);
    }

    // Mọi method khác → 405
    res.setHeader('Allow', 'GET, POST');
    return sendJSON(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(`[API /api/todos] Unhandled error:`, err);
    return sendJSON(res, 500, { error: err.message || 'Lỗi hệ thống nội bộ.' });
  }
}
