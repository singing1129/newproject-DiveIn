import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

/**
 * GET /my-coupons
 * 取得使用者已領取但未使用的優惠券
 */
router.get("/my-coupons", async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const couponType = req.query.type || "all";
    const statusFilter = req.query.status || "all";
    const sortOrder = req.query.sort || "latest";

    // 基礎查詢條件
    let baseQuery = `
      FROM coupon_usage cu
      JOIN coupon c ON cu.coupon_id = c.id
      WHERE cu.users_id = ? 
        AND cu.status = '已領取'
        AND c.is_deleted = FALSE
    `;
    let queryParams = [userId];

    // 依據 couponType 篩選
    if (couponType !== "all") {
      baseQuery += ` AND EXISTS (
        SELECT 1 FROM coupon_type ct WHERE ct.coupon_id = c.id AND ct.applicable_type = ?
      )`;
      queryParams.push(couponType);
    }

    // 依據狀態進行日期條件篩選
    const now = new Date();
    if (statusFilter === "started") {
      baseQuery += ` AND c.start_date <= ? AND c.end_date >= ?`;
      queryParams.push(now, now);
    } else if (statusFilter === "ending") {
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      baseQuery += ` AND c.end_date BETWEEN ? AND ?`;
      queryParams.push(now, threeDaysLater);
    } else if (statusFilter === "upcoming") {
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      baseQuery += ` AND c.start_date BETWEEN ? AND ?`;
      queryParams.push(now, twoDaysLater);
    } else if (statusFilter === "not_started") {
      baseQuery += ` AND c.start_date > ?`;
      queryParams.push(now);
    }

    // 先查詢總筆數
    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const [[{ count }]] = await pool.query(countQuery, queryParams);
    const total = count;
    const totalPages = Math.ceil(total / limit);

    // 排序條件
    let orderByClause = "ORDER BY c.start_date DESC";
    if (sortOrder === "expiry") {
      orderByClause = "ORDER BY c.end_date ASC";
    } else if (sortOrder === "discount") {
      orderByClause = "ORDER BY c.discount DESC";
    }

    // 最終查詢
    const query = `SELECT cu.*, c.* ${baseQuery} ${orderByClause} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    const [results] = await pool.query(query, queryParams);

    return res.json({
      success: true,
      total,
      page,
      totalPages,
      coupons: results,
    });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

/**
 * POST /code-claim
 * 功能：處理使用者領取優惠券的動作
 */
router.post("/code-claim", async (req, res) => {
  console.log("接收到的請求資料:", req.body);
  try {
    const { couponId, userId } = req.body;
    if (!couponId || !userId) {
      return res.status(400).json({ error: "缺少優惠券代碼或使用者 ID" });
    }

    // 從 users 資料表查詢該使用者的基本資料
    const [userResults] = await pool.query(
      "SELECT birthday, level_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userResults.length) {
      return res.status(404).json({ error: "找不到使用者" });
    }
    const user = userResults[0];

    // 查詢優惠券資料
    const [couponResults] = await pool.query(
      "SELECT * FROM coupon WHERE code = ? AND is_deleted = FALSE",
      [couponId]
    );
    if (!couponResults.length) {
      return res.status(404).json({ error: "找不到該優惠券" });
    }
    const coupon = couponResults[0];

    // 驗證優惠券是否已過期
    if (new Date() > new Date(coupon.end_date)) {
      return res.status(400).json({ error: "該優惠券已過期" });
    }

    // 檢查優惠券總領取量是否達上限
    const [usageCountResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND is_deleted = FALSE",
      [coupon.id]
    );
    const totalClaimed = usageCountResults[0].count;
    if (totalClaimed >= coupon.total_issued) {
      return res.status(400).json({ error: "優惠券已全數領取" });
    }

    // 查詢使用者已領取此優惠券的次數
    const [userUsageResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND is_deleted = FALSE",
      [coupon.id, userId]
    );
    const userClaimed = userUsageResults[0].count;
    if (userClaimed >= coupon.max_per_user) {
      return res.status(400).json({ error: "您已達到領取上限" });
    }

    // 計算使用者還可領取的張數
    const remainingToClaim = coupon.max_per_user - userClaimed;

    // 檢查剩餘優惠券數量是否足夠
    if (totalClaimed + remainingToClaim > coupon.total_issued) {
      return res.status(400).json({ error: "剩餘優惠券數量不足" });
    }

    // 逐筆寫入領取記錄
    for (let i = 0; i < remainingToClaim; i++) {
      await pool.query(
        "INSERT INTO coupon_usage (coupon_id, users_id, status, used_at, is_deleted) VALUES (?, ?, ?, NULL, FALSE)",
        [coupon.id, userId, "已領取"]
      );
    }

    // 返回領取的優惠券資料
    return res.json({
      success: true,
      message: `優惠券領取成功，您共領取了 ${remainingToClaim} 張優惠券`,
      coupon: {
        ...coupon,
        claimed: true,
        remaining: remainingToClaim,
        usable: remainingToClaim,
      },
    });
  } catch (error) {
    console.error("Error claiming coupon:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

export default router;