import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

/**
 * GET /my-coupons
 * 取得使用者已領取但未使用的優惠券
 */
router.get("/my-coupons", async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // 查詢使用者已領取的優惠券
    const [couponUsageResults] = await pool.query(
      `SELECT coupon_id, status, used_at FROM coupon_usage 
       WHERE users_id = ? AND status = '已領取' AND is_deleted = FALSE`,
      [userId]
    );

    const couponIds = couponUsageResults.map(cu => cu.coupon_id);
    if (couponIds.length === 0) {
      return res.json({
        success: true,
        total: 0,
        page,
        totalPages: 0,
        coupons: [],
      });
    }

    // 計算符合條件的優惠券總數
    let total = 0;
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM coupon 
       WHERE id IN (${couponIds.map(() => "?").join(",")}) 
       AND is_deleted = FALSE 
       AND (end_date IS NULL OR end_date >= NOW())`,
      couponIds
    );
    total = count;
    const totalPages = Math.ceil(total / limit);

    // 取得優惠券資料
    const [couponResults] = await pool.query(
      `SELECT * FROM coupon 
       WHERE id IN (${couponIds.map(() => "?").join(",")}) 
       AND is_deleted = FALSE 
       AND (end_date IS NULL OR end_date >= NOW()) 
       LIMIT ? OFFSET ?`,
      [...couponIds, limit, offset]
    );

    // 整合優惠券資訊
    const userCoupons = couponResults.map(coupon => {
      const userCouponUsage = couponUsageResults.find(cu => cu.coupon_id === coupon.id);
      return {
        ...coupon,
        status: userCouponUsage?.status,
        used_at: userCouponUsage?.used_at,
      };
    });

    return res.json({
      success: true,
      total,
      page,
      totalPages,
      coupons: userCoupons,
    });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

export default router;