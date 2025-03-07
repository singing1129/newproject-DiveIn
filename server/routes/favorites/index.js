import express from "express";
import { pool } from "../../config/mysql.js";
import { checkToken } from "../../middleware/auth.js";

const router = express.Router();

// 1. 取得收藏清單 - 修復重複項目問題
router.get("/", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;

    console.log("正在處理取得收藏清單的請求，userId:", userId);

    // 修改產品查詢 - 使用 GROUP BY 確保每個收藏只返回一次
    const [product] = await pool.execute(
      `SELECT 
         f.id,
         f.user_id,
         f.product_id,
         f.activity_id,
         f.rental_id,
         f.bundle_id,
         f.created_at,
         p.name,
         p.description,
         pi.image_url,
         MIN(pv.price) as price
       FROM favorites f
       JOIN product p ON f.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
       LEFT JOIN product_variant pv ON p.id = pv.product_id AND pv.isDeleted = 0
       WHERE f.user_id = ? AND f.product_id != 0
       GROUP BY f.id, f.user_id, f.product_id, f.activity_id, f.rental_id, f.bundle_id, f.created_at, p.name, p.description, pi.image_url`,
      [userId]
    );

    // 活動收藏查詢
    const [activity] = await pool.execute(
      `SELECT f.*, a.name, a.introduction, ai.img_url as image_url, a.price
       FROM favorites f
       JOIN activity a ON f.activity_id = a.id
       LEFT JOIN activity_image ai ON a.id = ai.activity_id AND ai.is_main = 1
       WHERE f.user_id = ? AND f.activity_id != 0`,
      [userId]
    );

    // 租賃收藏查詢
    const [rental] = await pool.execute(
      `SELECT f.*, ri.name, ri.description, rim.img_url as image_url, ri.price
       FROM favorites f
       JOIN rent_item ri ON f.rental_id = ri.id
       LEFT JOIN rent_image rim ON ri.id = rim.rent_item_id AND rim.is_main = 1
       WHERE f.user_id = ? AND f.rental_id != 0`,
      [userId]
    );

    // 套組收藏查詢
    const [bundle] = await pool.execute(
      `SELECT f.*, pb.name, pb.description, pb.discount_price as price
       FROM favorites f
       JOIN product_bundle pb ON f.bundle_id = pb.id
       WHERE f.user_id = ? AND f.bundle_id != 0`,
      [userId]
    );
    
    console.log("收藏清單結果:", { product, activity, rental, bundle});

    res.json({
      success: true,
      data: {
        product,
        activity,
        rental,
        bundle,
      },
    });
  } catch (error) {
    console.error("取得收藏清單錯誤:", error);
    res.status(500).json({
      success: false,
      message: "取得收藏清單失敗",
    });
  }
});

// 2. 加入收藏 - 修正型別轉換問題
router.post("/add", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { type, itemIds } = req.body;
    console.log(
      "收到加入收藏的請求，userId:",
      userId,
      "type:",
      type,
      "itemIds:",
      itemIds
    );

    // 基本驗證
    if (!type || !itemIds) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數",
      });
    }

    // 確保 itemIds 是陣列
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];

    console.log("處理的 itemIds:", ids);

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "請提供至少一個項目ID",
      });
    }

    // 允許的收藏類型
    if (!["product", "activity", "rental", "bundle"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "無效的收藏類型",
      });
    }

    // 檢查項目是否存在
    const tableName =
      type === "product"
        ? "product"
        : type === "activity"
        ? "activity"
        : type === "rental"
        ? "rent_item"
        : "product_bundle";

    console.log("檢查項目是否存在，tableName:", tableName, "ids:", ids);

    // 生成問號占位符，並確保轉換為數字
    const placeholders = ids.map(() => "?").join(",");
    const numericIds = ids.map(id => parseInt(id, 10));
    
    const [existingItems] = await pool.execute(
      `SELECT id FROM ${tableName} WHERE id IN (${placeholders})`,
      numericIds
    );

    if (existingItems.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "某些收藏的項目不存在",
      });
    }

    // 檢查是否已經收藏
    const [existingFavorites] = await pool.execute(
      `SELECT id, ${type}_id FROM favorites 
       WHERE user_id = ? AND ${type}_id IN (${placeholders})`,
      [userId, ...numericIds]
    );

    console.log("已經收藏的項目:", existingFavorites);

    // 過濾掉已經收藏的項目，確保類型一致
    const existingIds = existingFavorites.map(f => parseInt(f[`${type}_id`], 10));
    const newIds = numericIds.filter(id => !existingIds.includes(id));

    if (newIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "商品已在收藏中",
      });
    }

    // 準備批量插入的值
    const values = newIds
      .map((id) => {
        return `(${userId}, ${type === "product" ? id : 0}, ${
          type === "activity" ? id : 0
        }, ${type === "rental" ? id : 0}, ${type === "bundle" ? id : 0})`;
      })
      .join(",");

    console.log("插入收藏的值:", values);

    // 批量插入收藏
    await pool.execute(
      `INSERT INTO favorites 
       (user_id, product_id, activity_id, rental_id, bundle_id) 
       VALUES ${values}`
    );

    res.json({
      success: true,
      message: "已加入收藏",
    });
  } catch (error) {
    console.error("加入收藏錯誤:", error);
    res.status(500).json({
      success: false,
      message: "加入收藏失敗",
    });
  }
});

// 3. 移除收藏 - 確保ID轉換為數字
router.post("/remove", checkToken, async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { type, itemIds } = req.body;

    // 基本驗證
    if (!type || !itemIds) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數",
      });
    }

    // 確保 itemIds 是陣列
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "請提供至少一個項目ID",
      });
    }

    // 驗證收藏類型
    if (!["product", "activity", "rental", "bundle"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "無效的收藏類型",
      });
    }

    // 生成問號占位符
    const placeholders = ids.map(() => "?").join(",");
    // 確保ID為數字
    const numericIds = ids.map(id => parseInt(id, 10));
    
    // 檢查項目是否在收藏中並直接刪除
    const [result] = await pool.execute(
      `DELETE FROM favorites 
       WHERE user_id = ? AND 
       ${type}_id IN (${placeholders})`,
      [userId, ...numericIds]
    );

    // 更新 rent_item 的 is_like 狀態
    if (type === "rental") {
      await pool.execute(
        `UPDATE rent_item SET is_like = 0 WHERE id IN (${placeholders})`,
        numericIds
      );
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "沒有找到要移除的收藏項目",
      });
    }

    res.json({
      success: true,
      message: "已移除收藏",
    });
  } catch (error) {
    console.error("移除收藏錯誤:", error);
    res.status(500).json({
      success: false,
      message: "移除收藏失敗",
    });
  }
});

export default router;