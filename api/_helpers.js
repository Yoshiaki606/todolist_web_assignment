/**
 * api/_helpers.js
 *
 * Các hàm tiện ích dùng chung cho Vercel Serverless Functions trong /api.
 * Không phụ thuộc vào Supabase hay thư viện ngoài.
 */

/**
 * Gửi JSON response với status code cho trước.
 *
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} body
 */
export function sendJSON(res, statusCode, body) {
  res.status(statusCode).json(body);
}
