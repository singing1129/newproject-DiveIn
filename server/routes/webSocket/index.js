import { pool } from "../../config/mysql.js";

// 將 clients 設為全局變數
global.clients = new Map();
const rooms = new Map();

function createWebsocketRoom(wss) {
  wss.on("connection", (ws, request) => {
    console.log("新的使用者已連線，URL:", request.url);

    ws.on("message", async (data) => {
      const rawData = data.toString();
      console.log("收到原始數據:", rawData);

      if (!rawData || rawData.trim() === "") {
        ws.send(JSON.stringify({ type: "error", message: "訊息不能為空" }));
        return;
      }

      let msg;
      try {
        msg = JSON.parse(rawData);
        console.log("解析後的訊息:", msg);
      } catch (error) {
        console.error("JSON解析錯誤:", error.message);
        ws.send(JSON.stringify({ type: "error", message: "無效的JSON格式" }));
        return;
      }

      // 處理用戶加入
      if (msg.type === "join") {
        global.clients.set(msg.userId, ws);
        ws.userId = msg.userId;
        console.log(`用戶 ${msg.userId} 已加入，當前連線數量: ${global.clients.size}`);
        const [notifications] = await pool.execute(
          "SELECT id, content, created_at FROM system_notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 1",
          [msg.userId]
        );
        if (notifications.length > 0) {
          ws.send(JSON.stringify({
            type: "system",
            id: notifications[0].id,
            content: notifications[0].content,
            timestamp: new Date(),
          }));
        }
      }

      // 處理系統通知
      else if (msg.type === "sendSystemNotification") {
        const { userId, content } = msg;
        const timestamp = new Date().toISOString();
        const [result] = await pool.execute(
          "INSERT INTO system_notifications (user_id, content, created_at) VALUES (?, ?)",
          [userId || null, content]
        );
        const notificationId = result.insertId;
        const systemMsg = {
          type: "system",
          id: notificationId,
          content,
          timestamp,
        };
        console.log("準備推送通知，當前連線數量:", global.clients.size);
        if (userId) {
          const targetWs = global.clients.get(userId);
          if (targetWs && targetWs.readyState === targetWs.OPEN) {
            console.log(`推送給特定用戶 ${userId}`);
            targetWs.send(JSON.stringify(systemMsg));
          }
        } else {
          global.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              console.log("推送給客戶端:", client.userId || "未註冊用戶");
              client.send(JSON.stringify(systemMsg));
            }
          });
        }
      }

      // 處理加入聊天室並讀取歷史紀錄
      else if (msg.type === "joinRoom") {
        const { groupId, userId } = msg;
        ws.userId = userId;
        ws.groupId = groupId;
        global.clients.set(userId, ws);
        console.log(`用戶 ${userId} 加入聊天室 ${groupId}，當前連線數量: ${global.clients.size}`);

        const [history] = await pool.execute(
          "SELECT * FROM chat_messages WHERE group_id = ? ORDER BY created_at ASC",
          [groupId]
        );
        ws.send(JSON.stringify({
          type: "history",
          messages: history.map((m) => ({
            id: m.id,
            userId: m.user_id,
            content: m.content,
            timestamp: m.created_at,
          })),
        }));
      }

      // 處理聊天訊息
      else if (msg.type === "chat") {
        const { groupId, userId, content } = msg;
        const timestamp = new Date().toISOString();
        const [result] = await pool.execute(
          "INSERT INTO chat_messages (group_id, user_id, content) VALUES (?, ?, ?)",
          [groupId, userId, content]
        );
        const messageId = result.insertId;

        const message = {
          type: "message",
          id: messageId,
          groupId,
          userId,
          content,
          timestamp,
        };

        global.clients.forEach((client) => {
          if (client.readyState === client.OPEN && client.groupId === groupId) {
            console.log(`推送聊天訊息給用戶 ${client.userId} 在聊天室 ${groupId}`);
            client.send(JSON.stringify(message));
          }
        });
      }
    });

    ws.on("close", () => {
      console.log(`使用者 ${ws.userId} 已斷開連線，剩餘連線數量: ${global.clients.size - 1}`);
      global.clients.delete(ws.userId);
    });

    ws.on("error", (error) => {
      console.error("WebSocket 伺服器錯誤:", error);
    });
  });

  wss.on("error", (error) => {
    console.error("WebSocket 伺服器全局錯誤:", error);
  });
}

export default createWebsocketRoom;