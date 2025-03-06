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

    // 查詢使用者已領取的優惠券
    const [couponUsageResults] = await pool.query(
      `SELECT coupon_id, status, used_at
       FROM coupon_usage
       WHERE users_id = ? AND status = '已領取'`,
      [userId]
    );

    const couponIds = couponUsageResults.map((cu) => cu.coupon_id);
    if (couponIds.length === 0) {
      return res.json({
        success: true,
        total: 0,
        page,
        totalPages: 0,
        coupons: [],
      });
    }

    // 構建查詢條件
    let baseQuery = `
      FROM coupon
      WHERE id IN (${couponIds.map(() => "?").join(",")}) AND is_deleted = FALSE
    `;
    let queryParams = [...couponIds];

    if (couponType !== "all") {
      if (couponType === "store") {
        baseQuery += ` AND id IN (
          SELECT coupon_id FROM coupon_type WHERE applicable_type = '全館'
        )`;
      } else if (couponType === "product") {
        baseQuery += ` AND id IN (
          SELECT coupon_id FROM coupon_type WHERE applicable_type = '商品'
        )`;
      } else if (couponType === "rental") {
        baseQuery += ` AND id IN (
          SELECT coupon_id FROM coupon_type WHERE applicable_type = '租賃'
        )`;
      } else if (couponType === "event") {
        baseQuery += ` AND id IN (
          SELECT coupon_id FROM coupon_type WHERE applicable_type = '活動'
        )`;
      } else if (couponType === "membership") {
        baseQuery += ` AND id IN (
          SELECT coupon_id FROM coupon_type WHERE applicable_type = '會員專屬'
        )`;
      }
    }

    const now = new Date();
    if (statusFilter === "started") {
      baseQuery += ` AND start_date <= ? AND end_date >= ?`;
      queryParams.push(now, now);
    } else if (statusFilter === "ending") {
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      baseQuery += ` AND end_date BETWEEN ? AND ?`;
      queryParams.push(now, threeDaysLater);
    } else if (statusFilter === "upcoming") {
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      baseQuery += ` AND start_date BETWEEN ? AND ?`;
      queryParams.push(now, twoDaysLater);
    } else if (statusFilter === "not_started") {
      baseQuery += ` AND start_date > ?`;
      queryParams.push(now);
    }

    // 計算符合條件的優惠券總數
    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const [[{ count }]] = await pool.query(countQuery, queryParams);
    const total = count;
    const totalPages = Math.ceil(total / limit);

    // 添加排序
    let orderByClause = "ORDER BY start_date DESC";
    if (sortOrder === "expiry") {
      orderByClause = "ORDER BY end_date ASC";
    } else if (sortOrder === "discount") {
      orderByClause = "ORDER BY discount DESC";
    }

    // 取得優惠券資料
    const query = `SELECT * ${baseQuery} ${orderByClause} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    const [couponResults] = await pool.query(query, queryParams);

    // 整合優惠券資訊
    const userCoupons = couponResults.map((coupon) => {
      const userCouponUsage = couponUsageResults.find(
        (cu) => cu.coupon_id === coupon.id
      );
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
/**
 * POST /claim
 * 功能：處理使用者領取優惠券的動作
 */
router.post("/code-claim", async (req, res) => {
  console.log("接收到的請求資料:", req.body);
  try {
    // 從請求主體取得 couponId
    const { couponId } = req.body;
    if (!couponId) {
      return res.status(400).json({ error: "缺少優惠券代碼" });
    }

    // 取得使用者 ID，若 req.user 不存在則預設用 1（測試用）
    const userId = req.body.userId;
    console.log("正在處理取得收藏清單的請求，userId:", userId);

    // 從 users 資料表查詢該使用者的基本資料（例如生日、會員等級）
    const [userResults] = await pool.query(
      "SELECT birthday, level_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userResults.length) {
      return res.status(404).json({ error: "找不到使用者" });
    }
    const user = userResults[0];

    // 根據 couponId 查詢該優惠券資料（且確認未被刪除）
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

    // 檢查該優惠券目前總領取量是否達上限
    const [usageCountResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND is_deleted = FALSE",
      [coupon.id]
    );
    const totalClaimed = usageCountResults[0].count;
    if (totalClaimed >= coupon.total_issued) {
      return res.status(400).json({ error: "優惠券已全數領取" });
    }

    // 查詢該使用者已領取此優惠券的次數（不論狀態為「已領取」或「已使用」）
    const [userUsageResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND is_deleted = FALSE",
      [coupon.id, userId]
    );
    const userClaimed = userUsageResults[0].count;
    if (userClaimed >= coupon.max_per_user) {
      return res.status(400).json({ error: "您已達到領取上限" });
    }

    // 計算使用者還可領取的張數（例如：若每人可領取量為 3，且已領取 1 張，則 remainingToClaim = 2）
    const remainingToClaim = coupon.max_per_user - userClaimed;

    // 檢查剩餘優惠券數量是否足夠
    if (totalClaimed + remainingToClaim > coupon.total_issued) {
      return res.status(400).json({ error: "剩餘優惠券數量不足" });
    }

    // 依據 remainingToClaim 次數，逐筆寫入領取記錄（狀態預設為「已領取」）
    for (let i = 0; i < remainingToClaim; i++) {
      await pool.query(
        "INSERT INTO coupon_usage (coupon_id, users_id, status, used_at, is_deleted) VALUES (?, ?, ?, NULL, FALSE)",
        [coupon.id, userId, "已領取"]
      );
    }

    return res.json({
      success: true,
      message: `優惠券領取成功，您共領取了 ${remainingToClaim} 張優惠券`
    });
  } catch (error) {
    console.error("Error claiming coupon:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

export default router;