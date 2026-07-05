/**
 * api/_validators.js
 *
 * Các hàm validate dùng chung cho Vercel Serverless Functions trong /api.
 * Không phụ thuộc vào Supabase hay bất kỳ thư viện ngoài nào.
 */

// ---------------------------------------------------------------------------
// Constants (export để các handler có thể reference nếu cần)
// ---------------------------------------------------------------------------
export const MAX_TITLE_LEN    = 200;
export const VALID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const VALID_STATUSES   = ['pending', 'completed'];

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Kiểm tra chuỗi có đúng định dạng UUID v4 không.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUUID(value) {
  return typeof value === 'string' && VALID_UUID_REGEX.test(value);
}

/**
 * Validate field `title`:
 *   - Bắt buộc, phải là string
 *   - Không được rỗng hoặc toàn khoảng trắng
 *   - Tối đa MAX_TITLE_LEN ký tự (sau khi trim)
 *
 * @param {unknown} title
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateTitle(title) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return { valid: false, error: "'title' là trường bắt buộc và không được để trống." };
  }
  if (title.trim().length > MAX_TITLE_LEN) {
    return { valid: false, error: `'title' không được vượt quá ${MAX_TITLE_LEN} ký tự.` };
  }
  return { valid: true };
}

/**
 * Validate field `status`:
 *   - Phải là một trong VALID_STATUSES
 *
 * @param {unknown} status
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `'status' chỉ chấp nhận các giá trị: ${VALID_STATUSES.map((s) => `'${s}'`).join(', ')}.`,
    };
  }
  return { valid: true };
}

/**
 * Validate field `description` nếu có:
 *   - Phải là string (hoặc null/undefined)
 *
 * @param {unknown} description
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateDescription(description) {
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return { valid: false, error: "'description' phải là chuỗi ký tự." };
  }
  return { valid: true };
}
