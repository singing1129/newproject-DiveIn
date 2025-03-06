import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 獲取某用戶的按讚/倒讚記錄
router.get("/users/:usersId", async (req, res) => {
  const { usersId } = req.params;
  try {
    const [likes] = await pool.execute(
      "SELECT article_id, reply_id, is_like FROM article_likes_dislikes WHERE users_id = ?",
      [usersId]
    );
    res.json(likes);
  } catch (error) {
    console.error("❌ 獲取用戶按讚記錄失敗：", error);
    res.status(500).json({ status: "error", message: "獲取用戶按讚記錄失敗", error: error.message });
  }
});

// 對文章按讚/倒讚
router.post("/article/:id", async (req, res) => {
  const { id } = req.params;
  const { isLike } = req.body;
  const usersId = req.user?.id;

  if (!usersId) return res.status(401).json({ status: "error", message: "未授權" });

  try {
    const [existing] = await pool.execute(
      "SELECT * FROM article_likes_dislikes WHERE article_id = ? AND users_id = ? AND reply_id IS NULL",
      [id, usersId]
    );

    if (existing.length) {
      await pool.execute(
        "UPDATE article_likes_dislikes SET is_like = ? WHERE article_id = ? AND users_id = ? AND reply_id IS NULL",
        [isLike, id, usersId]
      );
    } else {
      await pool.execute(
        "INSERT INTO article_likes_dislikes (article_id, users_id, is_like, reply_id) VALUES (?, ?, ?, NULL)",
        [id, usersId, isLike]
      );
    }

    const [updatedLikes] = await pool.execute(
      "SELECT COUNT(is_like = TRUE) as likes, COUNT(is_like = FALSE) as dislikes " +
      "FROM article_likes_dislikes WHERE article_id = ? AND reply_id IS NULL",
      [id]
    );
    res.json(updatedLikes[0]);
  } catch (error) {
    console.error("❌ 文章按讚失敗：", error);
    res.status(500).json({ status: "error", message: "文章按讚失敗", error: error.message });
  }
});

// 對留言按讚/倒讚
router.post("/reply/:id", async (req, res) => {
  const { id } = req.params;
  const { isLike, articleId } = req.body;
  const usersId = req.user?.id;

  if (!usersId) return res.status(401).json({ status: "error", message: "未授權" });

  try {
    const [existing] = await pool.execute(
      "SELECT * FROM article_likes_dislikes WHERE article_id = ? AND reply_id = ? AND users_id = ?",
      [articleId, id, usersId]
    );

    if (existing.length) {
      await pool.execute(
        "UPDATE article_likes_dislikes SET is_like = ? WHERE article_id = ? AND reply_id = ? AND users_id = ?",
        [isLike, articleId, id, usersId]
      );
    } else {
      await pool.execute(
        "INSERT INTO article_likes_dislikes (article_id, reply_id, users_id, is_like) VALUES (?, ?, ?, ?)",
        [articleId, id, usersId, isLike]
      );
    }

    const [updatedLikes] = await pool.execute(
      "SELECT COUNT(is_like = TRUE) as likes, COUNT(is_like = FALSE) as dislikes " +
      "FROM article_likes_dislikes WHERE article_id = ? AND reply_id = ?",
      [articleId, id]
    );
    res.json(updatedLikes[0]);
  } catch (error) {
    console.error("❌ 留言按讚失敗：", error);
    res.status(500).json({ status: "error", message: "留言按讚失敗", error: error.message });
  }
});

export default router;