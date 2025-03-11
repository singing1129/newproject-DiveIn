import express from "express";
import { db } from "../../config/articleDb.js";

const router = express.Router();

/**
 * 点赞或倒赞留言（支持取消）
 */
router.post("/reply/:replyId/like", async (req, res) => {
  const { replyId } = req.params;
  const { user_id, is_like } = req.body;

  if (typeof is_like !== "boolean" || !user_id) {
    return res
      .status(400)
      .json({ success: false, message: "缺少必要参数或数据类型错误" });
  }

  try {
    // 检查是否已有点赞/倒赞记录
    const checkSql = `SELECT id, is_like FROM article_likes_dislikes WHERE reply_id = ? AND user_id = ?`;
    const { results: rows } = await db.query(checkSql, [replyId, user_id]);

    if (rows.length > 0) {
      if (rows[0].is_like === is_like) {
        // 取消点赞/倒赞
        const deleteSql = `DELETE FROM article_likes_dislikes WHERE id = ?`;
        await db.query(deleteSql, [rows[0].id]);
        return res.json({ success: true, message: "取消成功" });
      } else {
        // 更新点赞/倒赞状态
        const updateSql = `UPDATE article_likes_dislikes SET is_like = ? WHERE id = ?`;
        await db.query(updateSql, [is_like, rows[0].id]);
        return res.json({ success: true, message: "状态更新成功" });
      }
    }

    // 新增点赞/倒赞
    const insertSql = `INSERT INTO article_likes_dislikes (reply_id, user_id, is_like) VALUES (?, ?, ?)`;
    await db.query(insertSql, [replyId, user_id, is_like]);
    res.json({ success: true, message: "操作成功" });
  } catch (error) {
    console.error("点赞/倒赞失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

/**
 * 获取留言的点赞、倒赞数
 */
router.get("/reply/:replyId/likes", async (req, res) => {
  const { replyId } = req.params;

  try {
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM article_likes_dislikes
      WHERE reply_id = ?
    `;
    const { results } = await db.query(sql, [replyId]);
    const result = results[0] || { likes: 0, dislikes: 0 };

    res.json({
      success: true,
      likes: result.likes,
      dislikes: result.dislikes,
    });
  } catch (error) {
    console.error("获取点赞/倒赞数失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

/**
 * 获取当前用户对某回覆的点赞/倒赞状态
 */
router.get("/reply/:replyId/user-like", async (req, res) => {
  const { replyId } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "缺少 user_id 参数" });
  }

  try {
    const sql = `
      SELECT is_like 
      FROM article_likes_dislikes 
      WHERE reply_id = ? AND user_id = ?
    `;
    const { results } = await db.query(sql, [replyId, user_id]);

    if (results.length > 0) {
      res.json({
        success: true,
        hasLiked: results[0].is_like === 1,
        hasDisliked: results[0].is_like === 0,
      });
    } else {
      res.json({
        success: true,
        hasLiked: false,
        hasDisliked: false,
      });
    }
  } catch (error) {
    console.error("获取用户点赞/倒赞状态失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

export default router;