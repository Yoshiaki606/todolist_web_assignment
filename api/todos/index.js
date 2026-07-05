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
 *   sortBy  — trường sắp xếp ('created_at' | 'title' | 'status' | 'updated_at')
 *   sortOrder — chiều sắp xếp ('asc' | 'desc')
 *
 * Body cho POST (JSON):
 *   title       {string} bắt buộc, tối đa 200 ký tự
 *   description {string} tùy chọn
 *   due_at      {string} tùy chọn, định dạng ISO date
 */

import { getSupabaseClient } from '../_supabase.js';
import { sendJSON }          from '../_helpers.js';
import {
  validateTitle,
  validateDescription,
  validateDueAt,
} from '../_validators.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

const ALLOWED_SORT_BY    = ['created_at', 'title', 'status', 'updated_at'];
const ALLOWED_SORT_ORDER = ['asc', 'desc'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const { status, keyword, sortBy, sortOrder } = req.query;
  const { limit, offset } = parsePagination(req.query);

  // Validate và resolve sorting parameters
  const activeSortBy    = ALLOWED_SORT_BY.includes(sortBy)       ? sortBy    : 'created_at';
  const activeSortOrder = ALLOWED_SORT_ORDER.includes(sortOrder) ? sortOrder : 'desc';

  // Bắt đầu xây query — select all, đếm tổng để trả về total
  let query = supabase
    .from('todos')
    .select('*', { count: 'exact' });

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

  // Sắp xếp và phân trang
  query = query
    .order(activeSortBy, { ascending: activeSortOrder === 'asc' })
    // Secondary sort để đảm bảo thứ tự nhất quán khi giá trị bằng nhau
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

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
  const { title, description, due_at } = req.body ?? {};

  // --- Validation — dùng các hàm tái sử dụng từ _validators.js ---

  const titleResult = validateTitle(title);
  if (!titleResult.valid) return sendJSON(res, 400, { error: titleResult.error });

  const descResult = validateDescription(description);
  if (!descResult.valid) return sendJSON(res, 400, { error: descResult.error });

  const dueAtResult = validateDueAt(due_at);
  if (!dueAtResult.valid) return sendJSON(res, 400, { error: dueAtResult.error });

  // --- Insert vào Supabase ---
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('todos')
    .insert([
      {
        title:       title.trim(),
        description: description?.trim() ?? null,
        due_at:      due_at && due_at.trim() !== '' ? due_at : null,
        // status mặc định 'pending' đã được set ở DB level
      },
    ])
    .select()   // trả về row vừa insert
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
    if (req.method === 'GET')  return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);

    // Mọi method khác → 405
    res.setHeader('Allow', 'GET, POST');
    return sendJSON(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('[API /api/todos] Unhandled error:', err);
    return sendJSON(res, 500, { error: err.message || 'Lỗi hệ thống nội bộ.' });
  }
}
