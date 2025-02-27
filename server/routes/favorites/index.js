import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 1. 取得收藏清單
router.get("/", async (req, res) => {
  try {
    const userId = 1; // 之後從 JWT 取得

    console.log("正在處理取得收藏清單的請求，userId:", userId);

    // 分別獲取三種類型的收藏
    const [product] = await pool.execute(
      `SELECT f.*, p.name, p.description, pi.image_url, pv.price 
       FROM favorites f
       JOIN product p ON f.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
       LEFT JOIN product_variant pv ON p.id = pv.product_id
       WHERE f.user_id = ? AND f.product_id != 0`,
      [userId]
    );

    const [activity] = await pool.execute(
      `SELECT f.*, a.name, a.introduction, ai.img_url as image_url, a.price
       FROM favorites f
       JOIN activity a ON f.activity_id = a.id
       LEFT JOIN activity_image ai ON a.id = ai.activity_id AND ai.is_main = 1
       WHERE f.user_id = ? AND f.activity_id != 0`,
      [userId]
    );

    // nana：補充 ri.is_like，以便前端能夠知道租借商品是否被收藏
    const [rental] = await pool.execute(
      `SELECT f.*, ri.name, ri.description, rim.img_url as image_url, ri.price, ri.is_like
       FROM favorites f
       JOIN rent_item ri ON f.rental_id = ri.id
       LEFT JOIN rent_image rim ON ri.id = rim.rent_item_id AND rim.is_main = 1
       WHERE f.user_id = ? AND f.rental_id != 0`,
      [userId]
    );

    console.log("收藏清單結果:", { product, activity, rental });

    res.json({
      success: true,
      data: {
        product,
        activity,
        rental,
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

// 2. 租借：檢查單一租借商品的收藏狀態
router.get("/check", async (req, res) => {
  try {
    const { userId, rentalId } = req.query;

    // 基本驗證
    if (!userId || !rentalId) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數：userId 或 rentalId",
      });
    }

    console.log("正在檢查收藏狀態，userId:", userId, "rentalId:", rentalId);

    // 檢查是否已經收藏
    const [favorite] = await pool.execute(
      `SELECT ri.is_like 
       FROM favorites f
       JOIN rent_item ri ON f.rental_id = ri.id
       WHERE f.user_id = ? AND f.rental_id = ?`,
      [userId, rentalId]
    );

    // 如果找不到對應的租借商品
    if (favorite.length === 0) {
      return res.status(404).json({
        success: false,
        message: "未找到該租借商品",
      });
    }

    // 返回收藏狀態
    res.json({
      success: true,
      is_like: favorite[0].is_like, // 0: 未收藏, 1: 已收藏
    });
  } catch (error) {
    console.error("檢查收藏狀態錯誤:", error);
    res.status(500).json({
      success: false,
      message: "檢查收藏狀態失敗",
    });
  }
});

// 加入收藏
router.post("/add", async (req, res) => {
  try {
    const userId = 1; // 之後從 JWT 取得
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

    // 驗證收藏類型
    if (!["product", "activity", "rental"].includes(type)) {
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
        : "rent_item";

    console.log("檢查項目是否存在，tableName:", tableName, "ids:", ids);

    const [existingItems] = await pool.execute(
      `SELECT id FROM ${tableName} WHERE id IN (${ids.join(",")})`
    );

    // 檢查每個租借商品是否有效
    if (type === "rental") {
      const [rentalItems] = await pool.execute(
        `SELECT id FROM rent_item WHERE id IN (${ids.join(",")})`
      );

      // 確認所有租借商品是否存在
      if (rentalItems.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: "某些租借商品不存在",
        });
      }
    }

    // 檢查是否已經收藏
    const [existingFavorites] = await pool.execute(
      `SELECT ${type}_id FROM favorites 
       WHERE user_id = ? AND ${type}_id IN (${ids.join(",")})`,
      [userId]
    );

    console.log("已經收藏的項目:", existingFavorites);

    // 過濾掉已經收藏的項目
    const existingIds = existingFavorites.map((f) => f[`${type}_id`]);
    const newIds = ids.filter((id) => !existingIds.includes(parseInt(id)));

    if (newIds.length === 0) {
      return res.status(200).json({
        // 改為 200，因為這不是錯誤情況
        success: true,
        message: "商品已在收藏中",
      });
    }

    // 準備批量插入的值
    const values = newIds
      .map((id) => {
        return `(${userId}, ${type === "product" ? id : 0}, ${
          type === "activity" ? id : 0
        }, ${type === "rental" ? id : 0})`;
      })
      .join(",");

    console.log("插入收藏的值:", values);

    // 批量插入收藏
    await pool.execute(
      `INSERT INTO favorites 
       (user_id, product_id, activity_id, rental_id) 
       VALUES ${values}`
    );

    // 更新 rent_item 的 is_like 狀態
    if (type === "rental") {
      await pool.execute(
        `UPDATE rent_item SET is_like = 1 WHERE id IN (${newIds.join(",")})`
      );
    }

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

// 移除收藏
router.post("/remove", async (req, res) => {
  try {
    const userId = 1; // 之後從 JWT 取得
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
    if (!["product", "activity", "rental"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "無效的收藏類型",
      });
    }

    // 檢查項目是否在收藏中並直接刪除
    const [result] = await pool.execute(
      `DELETE FROM favorites 
       WHERE user_id = ? AND 
       ${type}_id IN (${ids.join(",")})`,
      [userId]
    );

    // 更新 rent_item 的 is_like 狀態
    if (type === "rental") {
      // 確保 ids 是陣列，即使只有一個 id
      const idsArray = Array.isArray(ids) ? ids : [ids]; // 保證 ids 為陣列

      // 使用展開運算符來解構 idsArray 並傳遞給 execute 方法
      await pool.execute(
        `UPDATE rent_item SET is_like = 0 WHERE id IN (${idsArray
          .map(() => "?")
          .join(",")})`,
        idsArray
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
