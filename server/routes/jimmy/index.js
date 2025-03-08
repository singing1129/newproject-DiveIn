// routes/jimmy/index.js
import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

/**
 * GET /my-available-coupons
 * 功能：獲取用戶可用的優惠券（已領取但未使用且未過期的）
 */
router.get("/my-available-coupons", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "未提供用戶ID" });
    }

    // 獲取當前日期時間
    const now = new Date();
    
    // 查詢已領取但未使用且未過期的優惠券
    const [coupons] = await pool.query(`
      SELECT 
        cu.id AS coupon_usage_id,
        cu.status AS usage_status,
        cu.used_at,
        c.*
      FROM coupon_usage cu
      JOIN coupon c ON cu.coupon_id = c.id
      WHERE cu.users_id = ?
        AND cu.status = '已領取'
        AND c.end_date > ?
        AND c.is_deleted = 0
        AND c.status = '啟用'
    `, [userId, now]);

    return res.json({
      success: true,
      coupons: coupons
    });
  } catch (error) {
    console.error("獲取用戶可用優惠券失敗:", error);
    return res.status(500).json({ 
      success: false, 
      message: "獲取優惠券失敗", 
      error: error.message 
    });
  }
});

/**
 * GET /my-all-coupons
 * 功能：獲取用戶所有的優惠券（包括已使用的和已過期的）
 */
router.get("/my-all-coupons", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "未提供用戶ID" });
    }
    
    // 查詢用戶所有優惠券
    const [coupons] = await pool.query(`
      SELECT 
        cu.id AS coupon_usage_id,
        cu.status AS usage_status,
        cu.used_at,
        c.*,
        CASE 
          WHEN cu.status = '已使用' THEN '已使用'
          WHEN c.end_date < NOW() THEN '已過期'
          ELSE '未使用'
        END AS display_status
      FROM coupon_usage cu
      JOIN coupon c ON cu.coupon_id = c.id
      WHERE cu.users_id = ?
        AND c.is_deleted = 0
    `, [userId]);

    return res.json({
      success: true,
      coupons: coupons
    });
  } catch (error) {
    console.error("獲取用戶所有優惠券失敗:", error);
    return res.status(500).json({ 
      success: false, 
      message: "獲取優惠券失敗", 
      error: error.message 
    });
  }
});

/**
 * PUT /use-coupon
 * 功能：將優惠券標記為已使用
 */
router.put("/use-coupon", async (req, res) => {
  try {
    const { couponUsageId, userId } = req.body;
    
    if (!couponUsageId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "缺少必要參數" 
      });
    }
    
    // 驗證優惠券屬於該用戶且未使用
    const [validCoupon] = await pool.query(`
      SELECT cu.*, c.name, c.discount_type, c.discount
      FROM coupon_usage cu
      JOIN coupon c ON cu.coupon_id = c.id
      WHERE cu.id = ?
        AND cu.users_id = ?
        AND cu.status = '已領取'
        AND c.end_date > NOW()
    `, [couponUsageId, userId]);
    
    if (validCoupon.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "無效的優惠券或優惠券已被使用" 
      });
    }
    
    // 更新優惠券狀態為已使用
    await pool.query(`
      UPDATE coupon_usage
      SET status = '已使用', used_at = NOW()
      WHERE id = ?
    `, [couponUsageId]);
    
    return res.json({
      success: true,
      message: "優惠券已標記為已使用",
      couponInfo: validCoupon[0]
    });
  } catch (error) {
    console.error("更新優惠券狀態失敗:", error);
    return res.status(500).json({ 
      success: false, 
      message: "更新優惠券狀態失敗", 
      error: error.message 
    });
  }
});

export default router;