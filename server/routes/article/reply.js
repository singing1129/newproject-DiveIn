import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 獲取特定文章的留言
router.get("/:articleId", async (req, res) => {
  const { articleId } = req.params;
  try {
    const [replies] = await pool.execute(
      "SELECT r.*, u.name AS author_name, " +
      "COUNT(ld.is_like = TRUE) as likes, COUNT(ld.is_like = FALSE) as dislikes " +
      "FROM article_reply r " +
      "LEFT JOIN users u ON r.users_id = u.id " +
      "LEFT JOIN article_likes_dislikes ld ON r.id = ld.reply_id " +
      "WHERE r.article_id = ? AND r.is_deleted = FALSE " +
      "GROUP BY r.id",
      [articleId]
    );
    res.json(replies);
  } catch (error) {
    console.error("❌ 獲取留言失敗：", error);
    res.status(500).json({ status: "error", message: "獲取留言失敗", error: error.message });
  }
});

// 新增留言或回覆
router.post("/:articleId", async (req, res) => {
  const { articleId } = req.params;
  const { content, parentId } = req.body;
  const usersId = req.user?.id; // 假設有認證中間件

  if (!usersId) return res.status(401).json({ status: "error", message: "未授權" });

  try {
    const level = parentId ? 2 : 1;
    const replyNumber = parentId || 0;

    const [floorResult] = await pool.execute(
      "SELECT COALESCE(MAX(floor_number), 0) + 1 as next_floor FROM article_reply WHERE article_id = ?",
      [articleId]
    );
    const floorNumber = floorResult[0].next_floor;

    await pool.execute(
      "INSERT INTO article_reply (article_id, users_id, content, floor_number, level, reply_number) " +
      "VALUES (?, ?, ?, ?, ?, ?)",
      [articleId, usersId, content, floorNumber, level, replyNumber]
    );

    await pool.execute("UPDATE article SET reply_count = reply_count + 1 WHERE id = ?", [articleId]);

    const [updatedReplies] = await pool.execute(
      "SELECT r.*, u.name AS author_name, " +
      "COUNT(ld.is_like = TRUE) as likes, COUNT(ld.is_like = FALSE) as dislikes " +
      "FROM article_reply r " +
      "LEFT JOIN users u ON r.users_id = u.id " +
      "LEFT JOIN article_likes_dislikes ld ON r.id = ld.reply_id " +
      "WHERE r.article_id = ? AND r.is_deleted = FALSE " +
      "GROUP BY r.id",
      [articleId]
    );
    res.json(updatedReplies);
  } catch (error) {
    console.error("❌ 新增留言失敗：", error);
    res.status(500).json({ status: "error", message: "新增留言失敗", error: error.message });
  }
});

export default router;