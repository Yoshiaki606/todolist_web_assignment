/**
 * api/todos/[id].js
 *
 * Vercel Serverless Function — /api/todos/:id
 *
 * Supported methods:
 *   PUT | PATCH  /api/todos/:id  → Cập nhật một phần todo (title, description, status)
 *   DELETE       /api/todos/:id  → Xóa todo theo id
 *
 * URL param:
 *   id  — UUID của todo cần thao tác
 */

import { getSupabaseClient } from '../_supabaseClient.js';
import {
  isValidUUID,
  validateTitle,
  validateStatus,
  validateDescription,
} from '../_validators.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendJSON(res, statusCode, body) {
  res.status(statusCode).json(body);
}

/**
 * Kiểm tra todo có tồn tại trong DB không.
 * Trả về { todo } nếu tìm thấy, hoặc { error } nếu không tồn tại / lỗi DB.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 * @returns {Promise<{ todo?: object, dbError?: string, notFound?: boolean }>}
 */
async function findTodoById(supabase, id) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .maybeSingle();  // trả null thay vì error khi không tìm thấy

  if (error) {
    return { dbError: error.message };
  }
  if (!data) {
    return { notFound: true };
  }
  return { todo: data };
}

// ---------------------------------------------------------------------------
// Handler: PUT/PATCH /api/todos/:id
// ---------------------------------------------------------------------------

async function handleUpdate(req, res, id) {
  const { title, description, status } = req.body ?? {};

  // Phải có ít nhất một field để update
  const hasTitle       = title       !== undefined;
  const hasDescription = description !== undefined;
  const hasStatus      = status      !== undefined;

  if (!hasTitle && !hasDescription && !hasStatus) {
    return sendJSON(res, 400, {
      error: 'Body phải chứa ít nhất một trong các trường: title, description, status.',
    });
  }

  // --- Validate từng field nếu được gửi lên ---

  if (hasTitle) {
    const result = validateTitle(title);
    if (!result.valid) return sendJSON(res, 400, { error: result.error });
  }

  if (hasDescription) {
    const result = validateDescription(description);
    if (!result.valid) return sendJSON(res, 400, { error: result.error });
  }

  if (hasStatus) {
    const result = validateStatus(status);
    if (!result.valid) return sendJSON(res, 400, { error: result.error });
  }

  // --- Kiểm tra record tồn tại ---
  const supabase = getSupabaseClient();
  const { todo, notFound, dbError: findError } = await findTodoById(supabase, id);

  if (findError) {
    console.error('[PUT|PATCH /api/todos/:id] find error:', findError);
    return sendJSON(res, 500, { error: findError });
  }
  if (notFound) {
    return sendJSON(res, 404, { error: 'Không tìm thấy công việc.' });
  }

  // --- Xây dựng payload update (chỉ các field được gửi lên) ---
  const updates = {};
  if (hasTitle)       updates.title       = title.trim();
  if (hasDescription) updates.description = typeof description === 'string' ? description.trim() || null : null;
  if (hasStatus)      updates.status      = status;
  // updated_at được xử lý tự động bởi trigger DB

  // --- Thực hiện update ---
  const { data: updated, error: updateError } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[PUT|PATCH /api/todos/:id] update error:', updateError.message);
    return sendJSON(res, 500, { error: updateError.message });
  }

  return sendJSON(res, 200, updated);
}

// ---------------------------------------------------------------------------
// Handler: DELETE /api/todos/:id
// ---------------------------------------------------------------------------

async function handleDelete(req, res, id) {
  const supabase = getSupabaseClient();

  // --- Kiểm tra record tồn tại trước khi xóa ---
  const { notFound, dbError: findError } = await findTodoById(supabase, id);

  if (findError) {
    console.error('[DELETE /api/todos/:id] find error:', findError);
    return sendJSON(res, 500, { error: findError });
  }
  if (notFound) {
    return sendJSON(res, 404, { error: 'Không tìm thấy công việc.' });
  }

  // --- Thực hiện xóa ---
  const { error: deleteError } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[DELETE /api/todos/:id] delete error:', deleteError.message);
    return sendJSON(res, 500, { error: deleteError.message });
  }

  return sendJSON(res, 200, { success: true, id });
}

// ---------------------------------------------------------------------------
// Main export — Vercel Serverless Function entry point
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  try {
    // Lấy id từ URL params (Vercel inject vào req.query)
    const { id } = req.query;

    // --- Validate UUID ---
    if (!isValidUUID(id)) {
      return sendJSON(res, 400, { error: "'id' không hợp lệ. Phải là UUID đúng định dạng." });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      return await handleUpdate(req, res, id);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res, id);
    }

    // Mọi method khác → 405
    res.setHeader('Allow', 'PUT, PATCH, DELETE');
    return sendJSON(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(`[API /api/todos/[id]] Unhandled error:`, err);
    return sendJSON(res, 500, { error: err.message || 'Lỗi hệ thống nội bộ.' });
  }
}
