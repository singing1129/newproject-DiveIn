import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 獲取系統通知的 API
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = "SELECT id, content, created_at FROM system_notifications WHERE user_id IS NULL OR user_id = ?";
    const params = [userId || null];
    const [notifications] = await pool.execute(query, params);

    res.json({
      success: true,
      data: notifications.map((notif) => {
        // 處理 created_at，確保是 ISO 字串
        let time;
        if (notif.created_at instanceof Date) {
          time = notif.created_at.toISOString();
        } else if (typeof notif.created_at === "string") {
          time = new Date(notif.created_at).toISOString();
        } else {
          time = new Date().toISOString(); // 預設值，防止 null 或無效值
        }

        return {
          id: notif.id,
          content: notif.content,
          time: time,
        };
      }),
    });
  } catch (error) {
    console.error("獲取通知失敗:", error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

export default router;