import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

/**
 * POST /claim
 * 功能：處理使用者領取優惠券的動作
 */
router.post("/claim", async (req, res) => {
  try {
    const { couponId, userId } = req.body;
    if (!couponId) {
      return res.status(400).json({ error: "缺少優惠券代碼" });
    }

    console.log("正在處理取得收藏清單的請求，userId:", userId);

    const [userResults] = await pool.query(
      "SELECT birthday, level_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userResults.length) {
      return res.status(404).json({ error: "找不到使用者" });
    }
    const user = userResults[0];

    const [couponResults] = await pool.query(
      "SELECT * FROM coupon WHERE id = ? AND is_deleted = FALSE",
      [couponId]
    );
    if (!couponResults.length) {
      return res.status(404).json({ error: "找不到該優惠券" });
    }
    const coupon = couponResults[0];

    if (new Date() > new Date(coupon.end_date)) {
      return res.status(400).json({ error: "該優惠券已過期" });
    }

    const [usageCountResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND is_deleted = FALSE",
      [coupon.id]
    );
    const totalClaimed = usageCountResults[0].count;
    if (totalClaimed >= coupon.total_issued) {
      return res.status(400).json({ error: "優惠券已全數領取" });
    }

    const [userUsageResults] = await pool.query(
      "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND is_deleted = FALSE",
      [coupon.id, userId]
    );
    const userClaimed = userUsageResults[0].count;
    if (userClaimed >= coupon.max_per_user) {
      return res.status(400).json({ error: "您已達到領取上限" });
    }

    const remainingToClaim = coupon.max_per_user - userClaimed;

    if (totalClaimed + remainingToClaim > coupon.total_issued) {
      return res.status(400).json({ error: "剩餘優惠券數量不足" });
    }

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

/**
 * GET /claim
 * 功能：根據會員可領取的優惠券進行查詢，並支援下列篩選條件與分頁功能：
 *   - campaign_name：檔期活動名稱（"全部" 表示不進行檔期過濾）
 *   - coupon_category：優惠分類（來源於 coupon_type 表，"全部" 表示不進行分類過濾）
 *   - claim_status：領取狀態，"未領取" 表示使用者從未領取過、"已領取" 表示使用者已經領取過、"全部" 表示不進行領取狀態過濾
 *   - page：目前頁碼（預設值：1）
 *   - limit：每頁顯示筆數（預設值：10）
 */
router.get("/claim", async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("正在處理取得收藏清單的請求，userId:", userId);

    const { campaign_name, coupon_category, claim_status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const [userResults] = await pool.query(
      "SELECT birthday, level_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userResults.length) {
      return res.status(404).json({ error: "找不到使用者" });
    }
    const user = userResults[0];

    const [couponResults] = await pool.query(
      "SELECT * FROM coupon WHERE is_deleted = FALSE"
    );

    const filteredCoupons = [];
    const now = new Date();

    for (let coupon of couponResults) {
      if (coupon.end_date && now > new Date(coupon.end_date)) continue;

      const [usageCountResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND is_deleted = FALSE",
        [coupon.id]
      );
      if (usageCountResults[0].count >= coupon.total_issued) continue;

      const [totalUserClaimResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND status IN ('已領取','已使用') AND is_deleted = FALSE",
        [coupon.id, userId]
      );
      const totalUserClaimCount = totalUserClaimResults[0].count;

      const [usableResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND status = '已領取' AND is_deleted = FALSE",
        [coupon.id, userId]
      );
      const usable = usableResults[0].count;

      const remaining = coupon.max_per_user - totalUserClaimCount;

      if (totalUserClaimCount === 0 && remaining <= 0) continue;
      if (totalUserClaimCount > 0 && usable === 0) continue;

      if (campaign_name && campaign_name !== "全部" && coupon.campaign_name !== campaign_name) {
        continue;
      }

      if (coupon_category && coupon_category !== "全部") {
        const [couponTypeResults] = await pool.query(
          "SELECT * FROM coupon_type WHERE coupon_id = ? AND applicable_type = ?",
          [coupon.id, coupon_category]
        );
        if (!couponTypeResults.length) continue;
      }

      if (claim_status && claim_status !== "全部") {
        if (claim_status === "未領取" && totalUserClaimCount > 0) {
          continue;
        }
        if (claim_status === "已領取" && totalUserClaimCount === 0) {
          continue;
        }
      }

      let isEligible = true;
      if (coupon.is_target) {
        const [targetResults] = await pool.query(
          "SELECT * FROM coupon_targets WHERE coupon_id = ?",
          [coupon.id]
        );
        for (const target of targetResults) {
          if (!target.apply_to_users) {
            if (target.condition_type && target.condition_value) {
              if (target.condition_type === "生日月份") {
                if (!user.birthday || user.birthday === "0000-00-00") {
                  isEligible = false;
                  break;
                }
                const userBirthdayMonth = new Date(user.birthday).getMonth() + 1;
                if (userBirthdayMonth !== parseInt(target.condition_value)) {
                  isEligible = false;
                  break;
                }
              } else if (target.condition_type === "會員等級") {
                if (user.level_id !== parseInt(target.condition_value)) {
                  isEligible = false;
                  break;
                }
              }
            }
          }
        }
      }
      if (!isEligible) continue;

      filteredCoupons.push({
        ...coupon,
        remaining,
        usable,
        claimed: totalUserClaimCount > 0,
      });
    }

    const total = filteredCoupons.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      total,
      page,
      totalPages,
      coupons: paginatedCoupons,
    });
  } catch (error) {
    console.error("Error fetching claim filtered coupons:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

/**
 * GET /search
 * 功能：根據搜尋字串查詢優惠券，並依據使用者資料、優惠券狀態等進行篩選，同時支援分頁功能。
 * Query 參數：
 *   - q: 搜尋字串（用於比對 coupon 的 name、code、campaign_name）
 *   - page: 目前頁碼（預設值：1）
 *   - limit: 每頁顯示筆數（預設值：10）
 */
router.get("/search", async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("正在處理取得收藏清單的請求，userId:", userId);
    
    const { q } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const [userResults] = await pool.query(
      "SELECT birthday, level_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userResults.length) {
      return res.status(404).json({ error: "找不到使用者" });
    }
    const user = userResults[0];

    const searchPattern = `%${q || ""}%`;
    const [couponResults] = await pool.query(
      "SELECT * FROM coupon WHERE is_deleted = FALSE AND (name LIKE ? OR code LIKE ? OR campaign_name LIKE ?)",
      [searchPattern, searchPattern, searchPattern]
    );

    const filteredCoupons = [];
    const now = new Date();

    for (let coupon of couponResults) {
      if (coupon.end_date && now > new Date(coupon.end_date)) continue;

      const [usageCountResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND is_deleted = FALSE",
        [coupon.id]
      );
      if (usageCountResults[0].count >= coupon.total_issued) continue;

      const [totalUserClaimResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND status IN ('已領取','已使用') AND is_deleted = FALSE",
        [coupon.id, userId]
      );
      const totalUserClaimCount = totalUserClaimResults[0].count;

      const [usableResults] = await pool.query(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND users_id = ? AND status = '已領取' AND is_deleted = FALSE",
        [coupon.id, userId]
      );
      const usable = usableResults[0].count;

      const remaining = coupon.max_per_user - totalUserClaimCount;

      if (totalUserClaimCount === 0 && remaining <= 0) continue;
      if (totalUserClaimCount > 0 && usable === 0) continue;

      let isEligible = true;
      if (coupon.is_target) {
        const [targetResults] = await pool.query(
          "SELECT * FROM coupon_targets WHERE coupon_id = ?",
          [coupon.id]
        );
        for (const target of targetResults) {
          if (!target.apply_to_users) {
            if (target.condition_type && target.condition_value) {
              if (target.condition_type === "生日月份") {
                if (!user.birthday || user.birthday === "0000-00-00") {
                  isEligible = false;
                  break;
                }
                const userBirthdayMonth = new Date(user.birthday).getMonth() + 1;
                if (userBirthdayMonth !== parseInt(target.condition_value)) {
                  isEligible = false;
                  break;
                }
              } else if (target.condition_type === "會員等級") {
                if (user.level_id !== parseInt(target.condition_value)) {
                  isEligible = false;
                  break;
                }
              }
            }
          }
        }
      }
      if (!isEligible) continue;

      filteredCoupons.push({
        ...coupon,
        remaining,
        usable,
        claimed: totalUserClaimCount > 0,
      });
    }

    const total = filteredCoupons.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      total,
      page,
      totalPages,
      coupons: paginatedCoupons,
    });
  } catch (error) {
    console.error("Error searching coupons:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

/**
 * GET /campaignOptions
 * 功能：取得所有優惠券的檔期活動
 */
router.get("/campaignOptions", async (req, res) => {
  try {
    const [campaignResults] = await pool.query(
      "SELECT DISTINCT campaign_name FROM coupon WHERE is_deleted = FALSE"
    );
    const campaignOptions = campaignResults.map(c => c.campaign_name).filter(c => c && c.trim() !== "");
    return res.json({
      success: true,
      campaignOptions,
    });
  } catch (error) {
    console.error("Error fetching campaign options:", error);
    return res.status(500).json({ error: `伺服器錯誤: ${error.message}` });
  }
});

export default router;