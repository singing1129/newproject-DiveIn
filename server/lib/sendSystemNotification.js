import { pool } from "../config/mysql.js";

export async function sendSystemNotification({ userIds, content }) {
  try {
    const timestamp = new Date().toISOString();
    console.log("準備發送通知，userIds:", userIds, "content:", content);

    if (Array.isArray(userIds) && userIds.length > 0) {
      console.log("進入特定用戶通知分支，userIds:", userIds);
      const insertPromises = userIds.map((userId) =>
        pool.execute(
          "INSERT INTO system_notifications (user_id, content) VALUES (?, ?)",
          [userId, content]
        )
      );
      const results = await Promise.all(insertPromises);
      console.log("資料庫插入結果:", results);
      const notificationIds = results.map((result) => result[0].insertId);

      const systemMsg = {
        type: "system", // 修正為前端期待的 type
        id: notificationIds[0], // 改回 id，而不是 userId
        content,
        timestamp,
        isNew:true
      };
      console.log("準備推送的訊息:", systemMsg);

      console.log("當前連線數量:", global.clients.size);
      if (global.clients.size === 0) {
        console.log("無連線客戶端，跳過推送");
      }

      global.clients.forEach((client) => {
        if (client.readyState === client.OPEN && userIds.includes(client.userId)) {
          console.log(`推送系統通知給用戶 ${client.userId}`);
          client.send(JSON.stringify(systemMsg));
        } else {
          console.log(`客戶端 ${client.userId || "未註冊"} 未匹配或非 OPEN`);
        }
      });

      console.log(`已通知 ${userIds.length} 位用戶`);
      return { success: true, message: `已通知 ${userIds.length} 位用戶` };
    } else {
      console.log("進入全體通知分支");
      const [result] = await pool.execute(
        "INSERT INTO system_notifications (user_id, content, created_at) VALUES (NULL, ?, ?)",
        [content, timestamp]
      );
      const notificationId = result.insertId;

      const systemMsg = {
        type: "system",
        id: notificationId,
        content,
        timestamp,
        isNew:true
      };

      global.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          console.log(`推送全體通知給用戶 ${client.userId || "未註冊用戶"}`);
          client.send(JSON.stringify(systemMsg));
        }
      });

      console.log("已發送全體通知");
      return { success: true, message: "已發送全體通知" };
    }
  } catch (error) {
    console.error("發送系統通知失敗:", error);
    return { success: false, message: "發送通知失敗" };
  }
}