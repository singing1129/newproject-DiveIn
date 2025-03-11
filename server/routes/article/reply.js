import express from "express";
import { db } from "../../config/articleDb.js";

const router = express.Router();

/**
 * 取得文章的留言與回覆 (兩層)
 * GET /api/article/:article_id/replies
 */
router.get("/:article_id/replies", async (req, res) => {
  const { article_id } = req.params;

  try {
    const { results: replies } = await db.query(
      `
      SELECT ar.*, u.name,
          (SELECT COUNT(*) FROM article_likes_dislikes ald WHERE ald.reply_id = ar.id AND ald.is_like = 1) AS likes,
          (SELECT COUNT(*) FROM article_likes_dislikes ald WHERE ald.reply_id = ar.id AND ald.is_like = 0) AS dislikes
       FROM article_reply ar
       LEFT JOIN users u ON ar.user_id = u.id
       WHERE ar.article_id = ?
       ORDER BY ar.created_at ASC`,
      [article_id]
    );

    if (!replies || !Array.isArray(replies)) {
      return res.status(500).json({ message: "獲取留言失敗，查詢結果無效" });
    }

    const replyMap = {};
    const structuredReplies = [];

    replies.forEach((reply) => {
      reply.replies = [];
      replyMap[reply.id] = reply;
      if (reply.parent_id === null) {
        structuredReplies.push(reply);
      } else {
        if (replyMap[reply.parent_id]) {
          replyMap[reply.parent_id].replies.push(reply);
        }
      }
    });

    res.json(structuredReplies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "取得留言失敗" });
  }
});

/**
 * 新增留言或回覆
 * POST /api/article/:article_id/replies
 */
router.post("/:article_id/replies", async (req, res) => {
  const { article_id } = req.params;
  const { user_id, content, parent_id } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ message: "缺少必要參數" });
  }

  try {
    // 確保 parent_id 是第一層留言（防止超過兩層）
    if (parent_id) {
      const { results: parent } = await db.query(
        "SELECT parent_id FROM article_reply WHERE id = ?",
        [parent_id]
      );
      if (!parent || parent.length === 0) {
        return res.status(400).json({ message: "父留言不存在" });
      }
      if (parent[0].parent_id !== null) {
        return res.status(400).json({ message: "只能回覆第一層留言" });
      }
    }

    const { results } = await db.query(
      "INSERT INTO article_reply (article_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
      [article_id, user_id, content, parent_id || null]
    );

    const { results: newReply } = await db.query(
      `
      SELECT ar.*, u.name,
          (SELECT COUNT(*) FROM article_likes_dislikes ald WHERE ald.reply_id = ar.id AND ald.is_like = 1) AS likes,
          (SELECT COUNT(*) FROM article_likes_dislikes ald WHERE ald.reply_id = ar.id AND ald.is_like = 0) AS dislikes
      FROM article_reply ar
      LEFT JOIN users u ON ar.user_id = u.id
      WHERE ar.id = ?`,
      [results.insertId]
    );

    res.json({ message: "留言成功", reply: newReply[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "留言失敗" });
  }
});

export default router;