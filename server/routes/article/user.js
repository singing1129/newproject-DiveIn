// server/routes/user.js
import express from "express";
import { db } from "../../config/articleDb.js";

const router = express.Router();

/**
 * 獲取用戶資訊
 * GET /api/user/:user_id
 */
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  console.log(`Received request for user_id: ${user_id}`); // 確認是否進入

  try {
    const { results } = await db.query(
      "SELECT head FROM users WHERE id = ?",
      [user_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "用戶不存在" });
    }

    res.json({ head: results[0].head });
  } catch (error) {
    console.error("獲取用戶資訊失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

export default router;