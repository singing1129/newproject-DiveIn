"use client";
import { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext(null);
WebSocketContext.displayName = "WebSocketContext";

export const WebSocketProvider = ({ children }) => {
    // WebSocketProvide 內容
    const [messages, setMessages] = useState([]); // 建立 message 的 state，用來存放伺服器回應的訊息內容
    const [ws, setWs] = useState(null); // 建立 ws state，用來存放 new WebSocket() 的結果
    const [isConnected, setIsConnected] = useState(false); // 連線狀態

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:3005"); // 和 3005 連線
        // 等於 addEventListener("open")，當連線成立時觸發
        socket.onopen = () => {
            console.log("WebSocket 已連線")
            setIsConnected(true);
        }
        // 等於 addEventListener("message")，當收到伺服器傳的的訊息時
        socket.onmessage = async (event) => {
            try {
                let data = event.data;
                // 如果收到 Blob，先轉成 text
                if (data instanceof Blob) {
                    data = await data.text();
                }
                // 把內容轉成 JSON
                const message = JSON.parse(data);
                if (message.type === "history") {
                    // 設定對話歷史紀錄
                    setMessages(message.messages)
                } else if (message.type === "message") {
                    // 只添加不是自己發送的訊息（避免重複）
                    setMessages((prev) => {
                        const isDuplicate = prev.some(
                            (msg) =>
                                msg.userId === message.userId &&
                                msg.content === message.content &&
                                msg.timestamp === message.timestamp
                        );
                        if (!isDuplicate) {
                            return [...prev, message];
                        }
                        return prev;
                    });
                } else if (message.type === "error") {
                    console.error("WebSocket錯誤:", message.message);
                }
            } catch (error) {
                console.error("WebSocket JSON 解析失敗:", error);
            }
        };

        // 等於 addEventListener("close")，當連線斷開時觸發
        socket.onclose = () => {
            console.log("WebSocket 已斷開")
            setIsConnected(false)
        };
        // 把 new WebSocket() 的結果設定進 ws 這個 state 中，這樣在其他地方也能使用連線物件
        setWs(socket);
        // 有 retuen 的 useEffect，等於有 dismounted，在頁面結束時會觸發
        return () => {
            socket.close(); // 關掉頁面時會斷開 socket 的連線
        };
    }, []); // 進入網站時就執行一次
    // 提供送訊息的方法
    const sendMessage = (msg) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        } else {
            console.error("WebSocket未連線");
        }
    };
    // 加入房間
    const joinRoom = (userID, groupId) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ "type": "joinRoom", "groupId": groupId, "userId": userID }));
        } else {
            console.error("WebSocket未連線，加入房間失敗！");
        }
    }
    return (
        <WebSocketContext.Provider value={{ messages,setMessages, sendMessage, joinRoom, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);