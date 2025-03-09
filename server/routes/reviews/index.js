import express from "express";
import { pool } from "../../config/mysql.js";
import { checkToken, optionalCheckToken } from "../../middleware/auth.js";

const router = express.Router();

// 評價提交API
router.post("/", checkToken, async (req, res) => {
  try {
    const { orderId, itemId, type, rating, comment } = req.body;
    const userId = req.decoded.id; // 從JWT獲取用戶ID

    console.log("接收到評價請求:", { orderId, itemId, type, rating, comment });

    // 驗證評價數據
    if (!orderId || !itemId || !type || !rating) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數",
      });
    }

    // 驗證用戶是訂單擁有者
    const [orderCheck] = await pool.query(
      "SELECT user_id FROM orders WHERE id = ?",
      [orderId]
    );

    if (orderCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "訂單不存在",
      });
    }

    if (orderCheck[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "只有訂單擁有者可以評價",
      });
    }

    // 根據不同類型檢查該項目是否已評價過
    let existingReviewQuery;

    if (type === "product") {
      // 檢查該訂單項目是否已被評價
      const [results] = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN product_reviews pr ON r.id = pr.review_id
         WHERE r.order_id = ? AND pr.variant_id IN (
           SELECT variant_id FROM order_items WHERE id = ?
         )`,
        [orderId, itemId]
      );
      existingReviewQuery = results;
    } else if (type === "rental") {
      const [results] = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN rental_reviews rr ON r.id = rr.review_id
         WHERE r.order_id = ? AND rr.rental_id IN (
           SELECT rental_id FROM order_rental_items WHERE id = ?
         )`,
        [orderId, itemId]
      );
      existingReviewQuery = results;
    } else if (type === "activity") {
      const [results] = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN activity_reviews ar ON r.id = ar.review_id
         WHERE r.order_id = ? AND ar.activity_project_id IN (
           SELECT activity_project_id FROM order_activity_items WHERE id = ?
         )`,
        [orderId, itemId]
      );
      existingReviewQuery = results;
    } else if (type === "bundle") {
      const [results] = await pool.query(
        `SELECT r.id FROM reviews r
         JOIN bundle_reviews br ON r.id = br.review_id
         WHERE r.order_id = ? AND br.bundle_id IN (
           SELECT bundle_id FROM order_items WHERE id = ?
         )`,
        [orderId, itemId]
      );
      existingReviewQuery = results;
    } else {
      return res.status(400).json({
        success: false,
        message: "無效的評價類型",
      });
    }

    // 判斷是否已評價過
    if (existingReviewQuery && existingReviewQuery.length > 0) {
      return res.status(400).json({
        success: false,
        message: "該項目已經評價過",
      });
    }

    // 開始交易
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 插入主評價記錄
      const [insertReviewResult] = await connection.query(
        `INSERT INTO reviews (user_id, order_id, rating, comment, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, orderId, rating, comment || ""]
      );

      const reviewId = insertReviewResult.insertId;
      console.log("新增評價ID:", reviewId);

      // 根據不同類型插入關聯評價記錄
      if (type === "product") {
        // 獲取訂單項目的商品變體和商品ID
        const [orderItemInfo] = await connection.query(
          `SELECT oi.variant_id, pv.product_id 
           FROM order_items oi
           JOIN product_variant pv ON oi.variant_id = pv.id
           WHERE oi.id = ?`,
          [itemId]
        );

        if (!orderItemInfo || orderItemInfo.length === 0) {
          throw new Error(`找不到訂單項目(ID: ${itemId})`);
        }

        const variantId = orderItemInfo[0].variant_id;
        const productId = orderItemInfo[0].product_id;

        if (!productId) {
          throw new Error("找不到關聯的商品ID");
        }

        console.log("評價商品:", { orderItemId: itemId, variantId, productId });

        await connection.query(
          `INSERT INTO product_reviews (review_id, product_id, variant_id)
           VALUES (?, ?, ?)`,
          [reviewId, productId, variantId]
        );
      } else if (type === "rental") {
        // 獲取租借項目ID
        const [rentalItemInfo] = await connection.query(
          `SELECT rental_id FROM order_rental_items WHERE id = ?`,
          [itemId]
        );

        if (!rentalItemInfo || rentalItemInfo.length === 0) {
          throw new Error(`找不到租借項目(ID: ${itemId})`);
        }

        const rentalId = rentalItemInfo[0].rental_id;

        await connection.query(
          `INSERT INTO rental_reviews (review_id, rental_id)
           VALUES (?, ?)`,
          [reviewId, rentalId]
        );
      } else if (type === "activity") {
        // 獲取活動項目的活動ID和活動項目ID
        const [activityItemInfo] = await connection.query(
          `SELECT oai.activity_project_id, ap.activity_id 
           FROM order_activity_items oai
           JOIN activity_project ap ON oai.activity_project_id = ap.id
           WHERE oai.id = ?`,
          [itemId]
        );

        if (!activityItemInfo || activityItemInfo.length === 0) {
          throw new Error(`找不到活動項目(ID: ${itemId})`);
        }

        const activityProjectId = activityItemInfo[0].activity_project_id;
        const activityId = activityItemInfo[0].activity_id;

        await connection.query(
          `INSERT INTO activity_reviews (review_id, activity_id, activity_project_id)
           VALUES (?, ?, ?)`,
          [reviewId, activityId, activityProjectId]
        );
      } else if (type === "bundle") {
        // 獲取套裝ID
        const [bundleItemInfo] = await connection.query(
          `SELECT bundle_id FROM order_items WHERE id = ?`,
          [itemId]
        );

        if (
          !bundleItemInfo ||
          bundleItemInfo.length === 0 ||
          !bundleItemInfo[0].bundle_id
        ) {
          throw new Error(`找不到套裝項目(ID: ${itemId})`);
        }

        const bundleId = bundleItemInfo[0].bundle_id;

        await connection.query(
          `INSERT INTO bundle_reviews (review_id, bundle_id)
           VALUES (?, ?)`,
          [reviewId, bundleId]
        );
      }

      // 提交交易
      await connection.commit();
      connection.release();

      // 檢查是否完成所有評價，如果是則發放積分
      checkAndRewardPoints(orderId, userId);

      return res.status(200).json({
        success: true,
        message: "評價提交成功",
        data: { reviewId },
      });
    } catch (error) {
      // 發生錯誤，回滾交易
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("評價提交失敗:", error);
    return res.status(500).json({
      success: false,
      message: "評價提交失敗",
      error: error.message,
    });
  }
});

// 檢查是否完成所有評價並發放積分
async function checkAndRewardPoints(orderId, userId) {
  try {
    // 獲取訂單所有項目
    const [productItems] = await pool.query(
      "SELECT id FROM order_items WHERE order_id = ?",
      [orderId]
    );

    const [activityItems] = await pool.query(
      "SELECT id FROM order_activity_items WHERE order_id = ?",
      [orderId]
    );

    const [rentalItems] = await pool.query(
      "SELECT id FROM order_rental_items WHERE order_id = ?",
      [orderId]
    );

    // 對套裝商品進行分組，一個套裝只需評價一次
    const [bundleItems] = await pool.query(
      "SELECT DISTINCT bundle_id FROM order_items WHERE order_id = ? AND bundle_id IS NOT NULL",
      [orderId]
    );

    // 計算需要評價的項目總數（套裝商品算一個）
    const totalItems =
      productItems.length -
      bundleItems.length +
      activityItems.length +
      rentalItems.length;

    // 獲取已評價的項目數
    const [reviewedCount] = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as count FROM reviews r WHERE r.order_id = ?`,
      [orderId]
    );

    const reviewedItemCount = reviewedCount[0]?.count || 0;

    console.log(`訂單 ${orderId} 評價進度: ${reviewedItemCount}/${totalItems}`);

    // 如果所有項目都已評價，則發放積分
    if (totalItems > 0 && reviewedItemCount >= totalItems) {
      // 檢查是否已發放過積分
      const [pointsCheck] = await pool.query(
        `SELECT id FROM points_history 
         WHERE user_id = ? AND order_id = ? AND action = 'review_reward'`,
        [userId, orderId]
      );

      if (pointsCheck.length === 0) {
        // 開始交易
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          // 新增積分記錄
          await connection.query(
            `INSERT INTO points_history (user_id, order_id, points, action, description, created_at)
             VALUES (?, ?, 10, 'review_reward', '完成訂單評價獎勵', NOW())`,
            [userId, orderId]
          );

          // 更新用戶總積分
          await connection.query(
            `UPDATE users SET total_points = total_points + 10 WHERE id = ?`,
            [userId]
          );

          // 更新訂單評價狀態
          await connection.query(
            `UPDATE orders SET is_reviewed = 1, reviewed_at = NOW() WHERE id = ?`,
            [orderId]
          );

          await connection.commit();
          console.log(`用戶 ${userId} 獲得訂單 ${orderId} 評價獎勵: 10積分`);
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
      }
    }
  } catch (error) {
    console.error("檢查評價狀態失敗:", error);
  }
}

// 訂單評價狀態檢查API
router.get("/:orderId", checkToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.decoded.id; // 從JWT獲取用戶ID

    console.log("檢查訂單評價狀態:", orderId);

    // 獲取訂單詳情
    const [orderCheck] = await pool.query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (orderCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "訂單不存在",
      });
    }

    if (orderCheck[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "只有訂單擁有者可以查看評價狀態",
      });
    }

    // 獲取該訂單中所有項目
    const [productItems] = await pool.query(
      "SELECT id, variant_id, bundle_id FROM order_items WHERE order_id = ?",
      [orderId]
    );

    const [rentalItems] = await pool.query(
      "SELECT id, rental_id FROM order_rental_items WHERE order_id = ?",
      [orderId]
    );

    const [activityItems] = await pool.query(
      "SELECT id, activity_project_id FROM order_activity_items WHERE order_id = ?",
      [orderId]
    );

    // 計算總項目數
    const totalItems =
      productItems.length + rentalItems.length + activityItems.length;

    // 獲取已評價的項目
    const [reviewedProducts] = await pool.query(
      `SELECT pr.variant_id FROM product_reviews pr
       JOIN reviews r ON pr.review_id = r.id
       WHERE r.order_id = ?`,
      [orderId]
    );

    const [reviewedRentals] = await pool.query(
      `SELECT rr.rental_id FROM rental_reviews rr
       JOIN reviews r ON rr.review_id = r.id
       WHERE r.order_id = ?`,
      [orderId]
    );

    const [reviewedActivities] = await pool.query(
      `SELECT ar.activity_project_id FROM activity_reviews ar
       JOIN reviews r ON ar.review_id = r.id
       WHERE r.order_id = ?`,
      [orderId]
    );

    const [reviewedBundles] = await pool.query(
      `SELECT br.bundle_id FROM bundle_reviews br
       JOIN reviews r ON br.review_id = r.id
       WHERE r.order_id = ?`,
      [orderId]
    );

    // 檢查每個項目是否已評價
    const productItemsStatus = productItems.map((item) => {
      if (item.bundle_id) {
        // 如果是套裝產品，檢查套裝是否已評價
        return {
          id: item.id,
          type: "product",
          isReviewed: reviewedBundles.some(
            (b) => b.bundle_id === item.bundle_id
          ),
        };
      } else {
        // 一般商品評價
        return {
          id: item.id,
          type: "product",
          isReviewed: reviewedProducts.some(
            (p) => p.variant_id === item.variant_id
          ),
        };
      }
    });

    const rentalItemsStatus = rentalItems.map((item) => ({
      id: item.id,
      type: "rental",
      isReviewed: reviewedRentals.some((r) => r.rental_id === item.rental_id),
    }));

    const activityItemsStatus = activityItems.map((item) => ({
      id: item.id,
      type: "activity",
      isReviewed: reviewedActivities.some(
        (a) => a.activity_project_id === item.activity_project_id
      ),
    }));

    // 合併所有項目狀態
    const allItemsStatus = [
      ...productItemsStatus,
      ...rentalItemsStatus,
      ...activityItemsStatus,
    ];

    // 計算已評價項目數
    const reviewedCount = allItemsStatus.filter(
      (item) => item.isReviewed
    ).length;

    // 判斷是否全部評價完成
    const isFullyReviewed = totalItems > 0 && reviewedCount === totalItems;

    // 檢查是否已獲得積分獎勵
    const [pointsRecord] = await pool.query(
      `SELECT * FROM points_history 
       WHERE user_id = ? AND order_id = ? AND action = 'review_reward'`,
      [userId, orderId]
    );

    const hasReceivedPoints = pointsRecord.length > 0;

    // 如果全部評價完成且尚未獲得積分，則發放積分
    if (isFullyReviewed && !hasReceivedPoints) {
      try {
        // 開始交易
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          // 新增積分記錄
          await connection.query(
            `INSERT INTO points_history (user_id, order_id, points, action, description, created_at)
             VALUES (?, ?, 10, 'review_reward', '完成訂單評價獎勵', NOW())`,
            [userId, orderId]
          );

          // 更新用戶總積分
          await connection.query(
            `UPDATE users SET total_points = total_points + 10 WHERE id = ?`,
            [userId]
          );

          // 更新訂單評價狀態
          await connection.query(
            `UPDATE orders SET is_reviewed = 1, reviewed_at = NOW() WHERE id = ?`,
            [orderId]
          );

          await connection.commit();
          connection.release();
          console.log(`用戶 ${userId} 獲得訂單 ${orderId} 評價獎勵: 10積分`);
        } catch (error) {
          await connection.rollback();
          connection.release();
          throw error;
        }
      } catch (error) {
        console.error("發放積分獎勵失敗:", error);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        reviewedCount,
        isFullyReviewed,
        hasReceivedPoints,
        items: allItemsStatus,
      },
    });
  } catch (error) {
    console.error("獲取訂單評價狀態失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取訂單評價狀態失敗",
      error: error.message,
    });
  }
});

// 修改後的獲取商品評價API
router.get("/product/:productId", optionalCheckToken, async (req, res) => {
  try {
    const { productId } = req.params;
    let userId = null;

    // 檢查是否有傳入已認證的用戶ID (通過 optionalCheckToken 中間件)
    if (req.decoded && req.decoded.id) {
      userId = req.decoded.id;
    }

    // 獲取商品評價統計 (原始代碼保持不變)
    const [ratingSummary] = await pool.query(
      `SELECT 
         AVG(r.rating) as averageRating,
         COUNT(r.id) as totalReviews,
         SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as fiveStarCount,
         SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as fourStarCount,
         SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as threeStarCount,
         SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as twoStarCount,
         SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as oneStarCount
       FROM reviews r
       JOIN product_reviews pr ON r.id = pr.review_id
       WHERE pr.product_id = ? AND r.isDeleted = 0`,
      [productId]
    );

    // 計算各星級百分比 (原始代碼保持不變)
    const summary = ratingSummary[0];
    if (summary.totalReviews > 0) {
      summary.fiveStarPercentage = Math.round(
        (summary.fiveStarCount / summary.totalReviews) * 100
      );
      summary.fourStarPercentage = Math.round(
        (summary.fourStarCount / summary.totalReviews) * 100
      );
      summary.threeStarPercentage = Math.round(
        (summary.threeStarCount / summary.totalReviews) * 100
      );
      summary.twoStarPercentage = Math.round(
        (summary.twoStarCount / summary.totalReviews) * 100
      );
      summary.oneStarPercentage = Math.round(
        (summary.oneStarCount / summary.totalReviews) * 100
      );
      summary.averageRating = parseFloat(summary.averageRating).toFixed(1);
    } else {
      summary.fiveStarPercentage = 0;
      summary.fourStarPercentage = 0;
      summary.threeStarPercentage = 0;
      summary.twoStarPercentage = 0;
      summary.oneStarPercentage = 0;
      summary.averageRating = "0.0";
    }

    // 獲取評價列表
    let reviewsQuery = `
      SELECT 
         r.id, r.rating, r.comment, r.createdAt, r.useful_count,
         u.name as userName, u.email as userEmail, u.head as userAvatar,
         pv.color_id, pv.size_id,
         c.name as colorName,
         s.name as sizeName`;

    // 如果有用戶ID，加入查詢該用戶是否已投票
    if (userId) {
      reviewsQuery += `,
        (SELECT COUNT(*) > 0 FROM review_helpfulness rh 
         WHERE rh.review_id = r.id AND rh.user_id = ?) as hasVoted`;
    }

    reviewsQuery += `
       FROM reviews r
       JOIN product_reviews pr ON r.id = pr.review_id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN product_variant pv ON pr.variant_id = pv.id
       LEFT JOIN color c ON pv.color_id = c.id
       LEFT JOIN size s ON pv.size_id = s.id
       WHERE pr.product_id = ? AND r.isDeleted = 0
       ORDER BY r.createdAt DESC
       LIMIT 10`;

    // 準備查詢參數
    const queryParams = userId ? [userId, productId] : [productId];

    const [reviews] = await pool.query(reviewsQuery, queryParams);

    // 處理評價列表數據
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: maskUserName(review.userName),
      userEmail: review.userEmail,
      userAvatar: review.userAvatar,
      spec:
        review.colorName && review.sizeName
          ? `${review.colorName} / ${review.sizeName}`
          : null,
      useful_count: review.useful_count,
      // 如果有用戶ID，則包含 hasVoted 屬性
      hasVoted: userId ? review.hasVoted === 1 : false,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("獲取商品評價失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取商品評價失敗",
      error: error.message,
    });
  }
});

// 獲取活動評價API
router.get("/activity/:activityId", optionalCheckToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    let userId = null;

    // 檢查是否有傳入已認證的用戶ID (通過 optionalCheckToken 中間件)
    if (req.decoded && req.decoded.id) {
      userId = req.decoded.id;
    }

    // 獲取活動評價統計 (原始代碼保持不變)
    const [ratingSummary] = await pool.query(
      `SELECT 
         AVG(r.rating) as averageRating,
         COUNT(r.id) as totalReviews,
         SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as fiveStarCount,
         SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as fourStarCount,
         SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as threeStarCount,
         SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as twoStarCount,
         SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as oneStarCount
       FROM reviews r
       JOIN activity_reviews ar ON r.id = ar.review_id
       WHERE ar.activity_id = ? AND r.isDeleted = 0`,
      [activityId]
    );

    // 計算各星級百分比 (原始代碼保持不變)
    const summary = ratingSummary[0];
    if (summary.totalReviews > 0) {
      summary.fiveStarPercentage = Math.round(
        (summary.fiveStarCount / summary.totalReviews) * 100
      );
      summary.fourStarPercentage = Math.round(
        (summary.fourStarCount / summary.totalReviews) * 100
      );
      summary.threeStarPercentage = Math.round(
        (summary.threeStarCount / summary.totalReviews) * 100
      );
      summary.twoStarPercentage = Math.round(
        (summary.twoStarCount / summary.totalReviews) * 100
      );
      summary.oneStarPercentage = Math.round(
        (summary.oneStarCount / summary.totalReviews) * 100
      );
      summary.averageRating = parseFloat(summary.averageRating).toFixed(1);
    } else {
      summary.fiveStarPercentage = 0;
      summary.fourStarPercentage = 0;
      summary.threeStarPercentage = 0;
      summary.twoStarPercentage = 0;
      summary.oneStarPercentage = 0;
      summary.averageRating = "0.0";
    }

    // 獲取評價列表
    let reviewsQuery = `
      SELECT 
         r.id, r.rating, r.comment, r.createdAt, r.useful_count,
         u.name as userName, u.email as userEmail, u.head as userAvatar,
         ap.name as projectName`;

    // 如果有用戶ID，加入查詢該用戶是否已投票
    if (userId) {
      reviewsQuery += `,
        (SELECT COUNT(*) > 0 FROM review_helpfulness rh 
         WHERE rh.review_id = r.id AND rh.user_id = ?) as hasVoted`;
    }

    reviewsQuery += `
       FROM reviews r
       JOIN activity_reviews ar ON r.id = ar.review_id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN activity_project ap ON ar.activity_project_id = ap.id
       WHERE ar.activity_id = ? AND r.isDeleted = 0
       ORDER BY r.createdAt DESC
       LIMIT 10`;

    // 準備查詢參數
    const queryParams = userId ? [userId, activityId] : [activityId];

    const [reviews] = await pool.query(reviewsQuery, queryParams);

    // 處理評價列表數據
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: maskUserName(review.userName),
      userEmail: review.userEmail,
      userAvatar: review.userAvatar,
      spec: review.projectName || "標準方案",
      useful_count: review.useful_count,
      // 如果有用戶ID，則包含 hasVoted 屬性
      hasVoted: userId ? review.hasVoted === 1 : false,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("獲取活動評價失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取活動評價失敗",
      error: error.message,
    });
  }
});

// 獲取租借項目評價API
router.get("/rental/:rentalId", optionalCheckToken, async (req, res) => {
  try {
    const { rentalId } = req.params;
    let userId = null;

    // 檢查是否有傳入已認證的用戶ID (通過 optionalCheckToken 中間件)
    if (req.decoded && req.decoded.id) {
      userId = req.decoded.id;
    }

    // 獲取租借項目評價統計 (原始代碼保持不變)
    const [ratingSummary] = await pool.query(
      `SELECT 
         AVG(r.rating) as averageRating,
         COUNT(r.id) as totalReviews,
         SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as fiveStarCount,
         SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as fourStarCount,
         SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as threeStarCount,
         SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as twoStarCount,
         SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as oneStarCount
       FROM reviews r
       JOIN rental_reviews rr ON r.id = rr.review_id
       WHERE rr.rental_id = ? AND r.isDeleted = 0`,
      [rentalId]
    );

    // 計算各星級百分比 (原始代碼保持不變)
    const summary = ratingSummary[0];
    if (summary.totalReviews > 0) {
      summary.fiveStarPercentage = Math.round(
        (summary.fiveStarCount / summary.totalReviews) * 100
      );
      summary.fourStarPercentage = Math.round(
        (summary.fourStarCount / summary.totalReviews) * 100
      );
      summary.threeStarPercentage = Math.round(
        (summary.threeStarCount / summary.totalReviews) * 100
      );
      summary.twoStarPercentage = Math.round(
        (summary.twoStarCount / summary.totalReviews) * 100
      );
      summary.oneStarPercentage = Math.round(
        (summary.oneStarCount / summary.totalReviews) * 100
      );
      summary.averageRating = parseFloat(summary.averageRating).toFixed(1);
    } else {
      summary.fiveStarPercentage = 0;
      summary.fourStarPercentage = 0;
      summary.threeStarPercentage = 0;
      summary.twoStarPercentage = 0;
      summary.oneStarPercentage = 0;
      summary.averageRating = "0.0";
    }

    // 獲取評價列表
    let reviewsQuery = `
      SELECT 
         r.id, r.rating, r.comment, r.createdAt, r.useful_count,
         u.name as userName, u.email as userEmail, u.head as userAvatar`;

    // 如果有用戶ID，加入查詢該用戶是否已投票
    if (userId) {
      reviewsQuery += `,
        (SELECT COUNT(*) > 0 FROM review_helpfulness rh 
         WHERE rh.review_id = r.id AND rh.user_id = ?) as hasVoted`;
    }

    reviewsQuery += `
       FROM reviews r
       JOIN rental_reviews rr ON r.id = rr.review_id
       JOIN users u ON r.user_id = u.id
       WHERE rr.rental_id = ? AND r.isDeleted = 0
       ORDER BY r.createdAt DESC
       LIMIT 10`;

    // 準備查詢參數
    const queryParams = userId ? [userId, rentalId] : [rentalId];

    const [reviews] = await pool.query(reviewsQuery, queryParams);

    // 處理評價列表數據
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: maskUserName(review.userName),
      userEmail: review.userEmail,
      userAvatar: review.userAvatar,
      useful_count: review.useful_count,
      // 如果有用戶ID，則包含 hasVoted 屬性
      hasVoted: userId ? review.hasVoted === 1 : false,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("獲取租借評價失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取租借評價失敗",
      error: error.message,
    });
  }
});

// 獲取套裝商品評價API
router.get("/bundle/:bundleId", optionalCheckToken, async (req, res) => {
  try {
    const { bundleId } = req.params;
    let userId = null;

    // 檢查是否有傳入已認證的用戶ID (通過 optionalCheckToken 中間件)
    if (req.decoded && req.decoded.id) {
      userId = req.decoded.id;
    }

    // 獲取套裝商品評價統計 (原始代碼保持不變)
    const [ratingSummary] = await pool.query(
      `SELECT 
         AVG(r.rating) as averageRating,
         COUNT(r.id) as totalReviews,
         SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as fiveStarCount,
         SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as fourStarCount,
         SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as threeStarCount,
         SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as twoStarCount,
         SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as oneStarCount
       FROM reviews r
       JOIN bundle_reviews br ON r.id = br.review_id
       WHERE br.bundle_id = ? AND r.isDeleted = 0`,
      [bundleId]
    );

    // 計算各星級百分比 (原始代碼保持不變)
    const summary = ratingSummary[0];
    if (summary.totalReviews > 0) {
      summary.fiveStarPercentage = Math.round(
        (summary.fiveStarCount / summary.totalReviews) * 100
      );
      summary.fourStarPercentage = Math.round(
        (summary.fourStarCount / summary.totalReviews) * 100
      );
      summary.threeStarPercentage = Math.round(
        (summary.threeStarCount / summary.totalReviews) * 100
      );
      summary.twoStarPercentage = Math.round(
        (summary.twoStarCount / summary.totalReviews) * 100
      );
      summary.oneStarPercentage = Math.round(
        (summary.oneStarCount / summary.totalReviews) * 100
      );
      summary.averageRating = parseFloat(summary.averageRating).toFixed(1);
    } else {
      summary.fiveStarPercentage = 0;
      summary.fourStarPercentage = 0;
      summary.threeStarPercentage = 0;
      summary.twoStarPercentage = 0;
      summary.oneStarPercentage = 0;
      summary.averageRating = "0.0";
    }

    // 獲取評價列表
    let reviewsQuery = `
      SELECT 
         r.id, r.rating, r.comment, r.createdAt, r.useful_count,
         u.name as userName, u.email as userEmail, u.head as userAvatar`;

    // 如果有用戶ID，加入查詢該用戶是否已投票
    if (userId) {
      reviewsQuery += `,
        (SELECT COUNT(*) > 0 FROM review_helpfulness rh 
         WHERE rh.review_id = r.id AND rh.user_id = ?) as hasVoted`;
    }

    reviewsQuery += `
       FROM reviews r
       JOIN bundle_reviews br ON r.id = br.review_id
       JOIN users u ON r.user_id = u.id
       WHERE br.bundle_id = ? AND r.isDeleted = 0
       ORDER BY r.createdAt DESC
       LIMIT 10`;

    // 準備查詢參數
    const queryParams = userId ? [userId, bundleId] : [bundleId];

    const [reviews] = await pool.query(reviewsQuery, queryParams);

    // 處理評價列表數據
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: maskUserName(review.userName),
      userEmail: review.userEmail,
      userAvatar: review.userAvatar,
      useful_count: review.useful_count,
      // 如果有用戶ID，則包含 hasVoted 屬性
      hasVoted: userId ? review.hasVoted === 1 : false,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("獲取套裝商品評價失敗:", error);
    return res.status(500).json({
      success: false,
      message: "獲取套裝商品評價失敗",
      error: error.message,
    });
  }
});

// 用戶名稱遮罩處理函數
function maskUserName(name) {
  if (!name) return "匿名用戶";

  if (name.length <= 2) {
    return name.substring(0, 1) + "*";
  } else {
    return (
      name.substring(0, 1) +
      "*".repeat(name.length - 2) +
      name.substring(name.length - 1)
    );
  }
}

// 在 API 路由文件中添加 (例如 routes/reviews.js)
router.post("/:reviewId/useful", checkToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.decoded.id; // 從 JWT 獲取用戶 ID

    // 檢查用戶是否已經標記過該評論
    const [existingVote] = await pool.query(
      `SELECT * FROM review_helpfulness 
       WHERE review_id = ? AND user_id = ?`,
      [reviewId, userId]
    );

    if (existingVote.length > 0) {
      return res.status(400).json({
        success: false,
        message: "您已經對此評論進行過標記",
      });
    }

    // 開始交易
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 記錄用戶投票
      await connection.query(
        `INSERT INTO review_helpfulness (review_id, user_id, is_helpful, createdAt)
         VALUES (?, ?, true, NOW())`,
        [reviewId, userId]
      );

      // 更新評論的有用計數
      await connection.query(
        `UPDATE reviews 
         SET useful_count = useful_count + 1
         WHERE id = ?`,
        [reviewId]
      );

      // 獲取更新後的計數
      const [updatedReview] = await connection.query(
        `SELECT useful_count FROM reviews WHERE id = ?`,
        [reviewId]
      );

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: "成功標記評論為有用",
        data: {
          useful_count: updatedReview[0].useful_count,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("標記評論為有用失敗:", error);
    return res.status(500).json({
      success: false,
      message: "標記評論為有用失敗",
      error: error.message,
    });
  }
});

export default router;
