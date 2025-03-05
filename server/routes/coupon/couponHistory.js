import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

router.get("/history", async (req, res) => {
  try {
    // 禁用快取，確保每次都返回最新資料
    res.set("Cache-Control", "no-store");

    // 確保取得當前使用者的 ID，請在生產環境中使用正確的認證機制
    const userId = req.user?.id || 1;
    const { status, sort } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // 建立基本查詢條件 (包含 JOIN 與共用的 WHERE 條件)
    let baseQuery = `
      FROM coupon_usage
      JOIN coupon ON coupon_usage.coupon_id = coupon.id
      WHERE coupon_usage.users_id = ? AND coupon_usage.is_deleted = FALSE
    `;

    // 根據 status 參數進行篩選
    if (status && status !== "全部") {
      if (status === "未使用") {
        baseQuery += " AND coupon_usage.status = '已領取'";
      } else if (status === "已使用") {
        baseQuery += " AND coupon_usage.status = '已使用'";
      } else if (status === "已過期") {
        // 注意：即使 coupon_usage.status 還是 '已領取'，只要優惠券過期，也視為已過期
        baseQuery += " AND ((coupon_usage.status = '已過期') OR (coupon_usage.status = '已領取' AND coupon.end_date < NOW()))";
      }
    }

    // 主查詢：撈取優惠券使用紀錄及相關優惠券資料
    // 加入一個 computed column display_status 來動態顯示是否過期
    let query = `
      SELECT coupon_usage.*, coupon.code, coupon.name, coupon.campaign_name, coupon.discount_type, coupon.discount, 
             coupon.min_spent, coupon.start_date, coupon.end_date, coupon.total_issued, coupon.max_per_user, 
             coupon.status AS coupon_status, coupon.description, coupon.image_url, coupon.is_deleted, coupon.is_exclusive, coupon.is_target,
             CASE WHEN coupon.end_date < NOW() THEN '已過期' ELSE coupon_usage.status END AS display_status
      ${baseQuery}
    `;

    // 根據 sort 參數進行排序
    if (sort) {
      if (sort === "latest") {
        query += " ORDER BY coupon_usage.used_at DESC";
      } else if (sort === "expiry") {
        query += " ORDER BY coupon.end_date ASC";
      } else if (sort === "discount") {
        query += " ORDER BY coupon.discount DESC";
      }
    } else {
      query += " ORDER BY coupon_usage.used_at DESC";
    }

    // 分頁處理
    query += " LIMIT ? OFFSET ?";
    const offset = (page - 1) * limit;
    const [results] = await pool.query(query, [userId, limit, offset]);

    // 撈取符合條件的優惠券使用紀錄的總數，使用與主查詢相同的條件
    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const [countResults] = await pool.query(countQuery, [userId]);
    const total = countResults[0].count;
    const totalPages = Math.ceil(total / limit);

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
