import { pool } from "../../config/mysql.js";

const clients = new Map();
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

      if (msg.type === "join") {
        clients.set(msg.userId, ws);
        ws.userId = msg.userId;
        console.log(`用戶 ${msg.userId} 已加入`);
      } else if (msg.type === "joinRoom") {
        const groupId = msg.groupId;

        // 設定userId
        if (msg.userId && !ws.userId) {
          clients.set(msg.userId, ws);
          ws.userId = msg.userId;
          console.log(`用戶 ${msg.userId} 已加入（從joinRoom設定）`);
        }
        if (!ws.userId) {
          ws.send(JSON.stringify({ type: "error", message: "請先提供userId" }));
          return;
        }

        // 檢查是否為團主或團員
        let isGroupOwner = false;
        let isParticipant = false;

        try {
          // 檢查團主 (groups.user_id)
          const [groupRows] = await pool.execute(
            "SELECT user_id FROM groups WHERE id = ?",
            [groupId]
          );
          console.log("groupRows:",groupRows);
          if (groupRows.length > 0 && groupRows[0].user_id == ws.userId) {
            isGroupOwner = true;
          }

          // 檢查團員 (groups_participants.user_id)
          const [participantRows] = await pool.execute(
            "SELECT user_id FROM groups_participants WHERE groups_id = ? AND user_id = ?",
            [groupId, ws.userId]
          );
          if (participantRows.length > 0) {
            isParticipant = true;
          }

          // 如果既不是團主也不是團員，拒絕加入
          if (!isGroupOwner && !isParticipant) {
            ws.send(JSON.stringify({ type: "error", message: "您不是此團的團主或團員" }));
            return;
          }

          // 設定用戶角色
          ws.role = isGroupOwner ? "團主" : "團員";
          console.log(`用戶 ${ws.userId} 是${ws.role}`);
        } catch (error) {
          console.error("查詢身份錯誤:", error);
          ws.send(JSON.stringify({ type: "error", message: "伺服器錯誤，請稍後再試" }));
          return;
        }

        // 加入房間
        if (!rooms.has(groupId)) rooms.set(groupId, new Set());
        rooms.get(groupId).add(ws);
        ws.groupId = groupId;
        console.log(`用戶 ${ws.userId} (${ws.role}) 加入房間 ${groupId}`);

        const history = await loadChatHistory(pool, groupId);
        console.log("載入的歷史訊息:", history);
        ws.send(JSON.stringify({ type: "history", messages: history }));
      } else if (msg.type === "chat") {
        if (!ws.userId) {
          ws.send(JSON.stringify({ type: "error", message: "請先提供userId" }));
          return;
        }
        const chatMsg = {
          groupId: msg.groupId,
          userId: ws.userId,
          content: msg.content,
          timestamp: new Date().toISOString(),
          role: ws.role || "未知身份", // 添加角色標示
        };
        const roomClients = rooms.get(msg.groupId) || new Set();
        roomClients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            // 在訊息中加入角色標示
            const displayMsg = {
              ...chatMsg,
              content: `[${chatMsg.role}] ${chatMsg.content}`,
            };
            client.send(JSON.stringify({ type: "message", ...displayMsg }));
          }
        });
        await saveToDatabase(pool, chatMsg);
      }
    });

    ws.on("close", () => {
      console.log(`使用者 ${ws.userId} 已斷開連線`);
      clients.delete(ws.userId);
      if (ws.groupId && rooms.get(ws.groupId)) {
        rooms.get(ws.groupId).delete(ws);
        if (rooms.get(ws.groupId).size === 0) rooms.delete(ws.groupId);
      }
    });
  });
}

async function saveToDatabase(db, chatMsg) {
  console.log("存進資料庫:", chatMsg);
  const sql = `INSERT INTO chat_messages (group_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`;
  try {
    await db.execute(sql, [chatMsg.groupId, chatMsg.userId, chatMsg.content, chatMsg.timestamp]);
    console.log("訊息已成功存入資料庫");
  } catch (error) {
    console.error("資料庫儲存錯誤:", error);
  }
}

async function loadChatHistory(db, groupId) {
  const sql = `SELECT * FROM chat_messages WHERE group_id = ? ORDER BY created_at ASC`;
  try {
    const [rows] = await db.execute(sql, [groupId]);
    // console.log("查詢結果:", rows);
    return rows.map((row) => ({
      groupId: row.group_id,
      userId: row.user_id,
      content: row.content,
      timestamp: row.created_at,
    }));
  } catch (error) {
    console.error("載入歷史訊息錯誤:", error);
    return [];
  }
}

export default createWebsocketRoom;