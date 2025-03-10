"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import useToast from "./useToast";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const {showToast} = useToast();

  useEffect(() => {
     // 如果 user 還沒登入，則不進行 WebSocket 連線
     if (!user || !user.id) return;
    const socket = new WebSocket("ws://localhost:3005");
    socket.onopen = () => {
      console.log("WebSocket 已連線");
      setIsConnected(true);
      if (user && user.id) {
        socket.send(JSON.stringify({ type: "join", userId: user.id }));
        console.log("發送 join 訊息，用户 ID:", user.id);
      }
    };
    socket.onmessage = async (event) => {
      const data = JSON.parse(await event.data.text?.() || event.data);
      console.log("收到 WebSocket 訊息:", data);
      if (data.type === "history") {
        setMessages(data.messages);
      } else if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
      } else if (data.type === "system") {
        setSystemNotifications((prev) => [...prev, data]);
        console.log("系統通知 isNew: ", data.isNew);  // 確認是否有 isNew 屬性
        // 只有在 isNew 為 true 時顯示土司通知
    if (data.isNew == true) {
      showToast("收到一則新的系統通知");
    }
        console.log("收到系統訊息");
      }
    };
    socket.onclose = () => {
      console.log("WebSocket 已斷開");
      setIsConnected(false);
    };
    setWs(socket);
    return () => socket.close();
  }, [user]);

  const sendMessage = (msg) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg));
  const joinRoom = (userId, groupId) =>
    ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "joinRoom", groupId, userId }));

  return (
    <WebSocketContext.Provider value={{ messages, setMessages, systemNotifications, sendMessage, joinRoom, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};