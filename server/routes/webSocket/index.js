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

        if (msg.userId && !ws.userId) {
          clients.set(msg.userId, ws);
          ws.userId = msg.userId;
          console.log(`用戶 ${msg.userId} 已加入（從joinRoom設定）`);
        }
        if (!ws.userId) {
          ws.send(JSON.stringify({ type: "error", message: "請先提供userId" }));
          return;
        }

        let isGroupOwner = false;
        let isParticipant = false;

        try {
          const [groupRows] = await pool.execute(
            "SELECT user_id FROM groups WHERE id = ?",
            [groupId]
          );
          console.log("groupRows:", groupRows);
          if (groupRows.length > 0 && String(groupRows[0].user_id) === String(ws.userId)) {
            isGroupOwner = true;
          }

          const [participantRows] = await pool.execute(
            "SELECT user_id FROM groups_participants WHERE groups_id = ? AND user_id = ?",
            [groupId, ws.userId]
          );
          console.log("participantRows:", participantRows);
          if (participantRows.length > 0) {
            isParticipant = true;
          }

          if (!isGroupOwner && !isParticipant) {
            ws.send(JSON.stringify({ type: "error", message: "您不是此團的團主或團員" }));
            return;
          }

          ws.role = isGroupOwner ? "團主" : "團員";
          console.log(`用戶 ${ws.userId} 是${ws.role}`);

          if (!rooms.has(groupId)) rooms.set(groupId, new Set());
          rooms.get(groupId).add(ws);
          ws.groupId = groupId;
          console.log(`用戶 ${ws.userId} (${ws.role}) 加入房間 ${groupId}, 房間人數: ${rooms.get(groupId).size}`);

          const history = await loadChatHistory(pool, groupId);
          console.log("載入的歷史訊息:", history);
          ws.send(JSON.stringify({ type: "history", messages: history }));
        } catch (error) {
          console.error("查詢身份錯誤:", error);
          ws.send(JSON.stringify({ type: "error", message: "伺服器錯誤，請稍後再試" }));
          return;
        }
      } else if (msg.type === "chat") {
        if (!ws.userId) {
          ws.send(JSON.stringify({ type: "error", message: "請先提供userId" }));
          return;
        }
        // 查詢發送者的名字
        const [userRows] = await pool.execute("SELECT name FROM users WHERE id = ?", [ws.userId]);
        const userName = userRows.length > 0 ? userRows[0].name : "未知用戶";
        const chatMsg = {
          groupId: msg.groupId,
          userId: ws.userId,
          content: msg.content,
          timestamp: new Date(),
          role: ws.role || "未知身份",
          userName: userName || "已刪除的用戶",
        };
        const roomClients = rooms.get(msg.groupId) || new Set();
        console.log(`廣播到房間 ${msg.groupId}，客戶端數: ${roomClients.size}`);
        roomClients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            const displayMsg = {
              ...chatMsg,
              content: `${chatMsg.content}`,
            };
            console.log(`發送給客戶端 ${client.userId}:`, displayMsg);
            client.send(JSON.stringify({ type: "message", ...displayMsg }));
          } else {
            console.log(`客戶端 ${client.userId} 未開放，無法發送`);
          }
        });
        await saveToDatabase(pool, chatMsg);
      }
    });

    ws.on("close", () => {
      console.log(`使用者 ${ws.userId} 已斷開連線，groupId: ${ws.groupId}`);
      clients.delete(ws.userId);
      if (ws.groupId && rooms.has(ws.groupId)) {
        const room = rooms.get(ws.groupId);
        room.delete(ws);
        console.log(`房間 ${ws.groupId} 剩餘人數: ${room.size}`);
        if (room.size === 0) {
          rooms.delete(ws.groupId);
          console.log(`房間 ${ws.groupId} 已刪除`);
        }
      }
    });
  });
}

// saveToDatabase 和 loadChatHistory 保持不變
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
  const sql = `
    SELECT 
      chat_messages.*,
      users.name AS user_name,
      CASE 
        WHEN groups.user_id = chat_messages.user_id THEN '團主'
        WHEN EXISTS (
          SELECT 1 
          FROM groups_participants 
          WHERE groups_participants.groups_id = chat_messages.group_id 
          AND groups_participants.user_id = chat_messages.user_id
        ) THEN '團員'
        ELSE '未知身份'
      END AS role
    FROM chat_messages
    JOIN users ON users.id = chat_messages.user_id
    LEFT JOIN groups ON groups.id = chat_messages.group_id AND groups.user_id = chat_messages.user_id
    WHERE chat_messages.group_id = ?
    ORDER BY chat_messages.created_at ASC
  `;
  try {
    const [rows] = await db.execute(sql, [groupId]);
    return rows.map((row) => ({
      groupId: row.group_id,
      userName: row.user_name,
      userId: row.user_id,
      content: row.content,
      timestamp: row.created_at,
      role: row.role, // 新增role
    }));
  } catch (error) {
    console.error("載入歷史訊息錯誤:", error);
    return [];
  }
}

export default createWebsocketRoom;