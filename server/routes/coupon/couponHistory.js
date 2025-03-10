import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

/**
 * GET /history
 * 功能：根據會員的優惠券歷史紀錄進行查詢，並支援下列篩選條件與分頁功能：
 *   - status：優惠券狀態（"全部"、"未使用"、"已使用"、"已過期"）
 *   - sort：排序方式（"latest"、"expiry"、"discount"、"min_spent"）
 *   - page：目前頁碼（預設值：1）
 *   - limit：每頁顯示筆數（預設值：10）
 */
router.get("/history", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    // 從前端 query 取得 userId
    const userId = req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: "未授權，請提供使用者 ID" });
    }

    const { status, sort } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = req.query.limit === 'Infinity' ? Infinity : parseInt(req.query.limit, 10) || 10;

    // 更新過期的優惠券
    await pool.query(`
      UPDATE coupon_usage
      SET status = '已過期', used_at = NULL
      WHERE status = '已領取' AND coupon_id IN (
        SELECT id FROM coupon WHERE end_date < NOW()
      );
    `);

    let baseQuery = `
      FROM coupon_usage
      JOIN coupon ON coupon_usage.coupon_id = coupon.id
      WHERE coupon_usage.users_id = ?
    `;

    if (status && status !== "全部") {
      if (status === "未使用") baseQuery += " AND coupon_usage.status = '已領取'";
      else if (status === "已使用") baseQuery += " AND coupon_usage.status = '已使用'";
      else if (status === "已過期") baseQuery += " AND coupon_usage.status = '已過期'";
    }

    let query = `SELECT coupon_usage.id AS coupon_usage_id, 
       coupon_usage.status AS coupon_usage_status, 
       coupon_usage.used_at, 
       coupon.code, 
       coupon.name, 
       coupon.campaign_name, 
       coupon.discount_type, 
       coupon.discount, 
       coupon.min_spent, 
       coupon.start_date, 
       coupon.end_date, 
       coupon.total_issued, 
       coupon.max_per_user, 
       coupon.status AS coupon_status, 
       coupon.description, 
       coupon.image_url, 
       coupon.is_deleted, 
       coupon.is_exclusive, 
       coupon.is_target,
       CASE 
         WHEN coupon_usage.status = '已領取' THEN '未使用'
         WHEN coupon_usage.status = '已使用' THEN '已使用'
         WHEN coupon_usage.status = '已過期' THEN '已過期'
         ELSE coupon_usage.status 
       END AS display_status
      ${baseQuery}
    `;

    // 🛠️ 定義 discountValue 在這裡，不是全域變數
    const discountValue = (coupon) => {
      if (coupon.discount_type === '金額') {
        return coupon.discount; // 金額折扣直接使用
      } else if (coupon.discount_type === '折扣%') {
        return (1 - coupon.discount) * coupon.min_spent; // 折扣 % 乘以最低消費門檻
      }
      return 0; // 預防沒有定義折扣類型的情況
    };

    // 🔹 排序
    if (sort === "expiry") {
      query += " ORDER BY coupon.end_date ASC";
    } else if (sort === "discount") {
      query += " ORDER BY coupon.discount DESC";
    } else if (sort === "min_spent") {
      query += " ORDER BY coupon.min_spent ASC";
    } else {
      query += " ORDER BY coupon_usage.id DESC";
    }

    if (limit !== Infinity) {
      query += " LIMIT ? OFFSET ?";
    }

    const offset = (page - 1) * limit;
    const [results] = await pool.query(query, limit === Infinity ? [userId] : [userId, limit, offset]);

    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const [countResults] = await pool.query(countQuery, [userId]);
    const total = countResults[0].count;
    const totalPages = limit === Infinity ? 1 : Math.ceil(total / limit);

    return res.json({
      success: true,
      total,
      page,
      totalPages,
      coupons: results,
    });
  } catch (error) {
    console.error("Error fetching coupon history:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

export default router;