"use client";
import styles from "./chatRoom.module.css";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const { messages, setMessages, sendMessage, joinRoom, isConnected } = useWebSocket();
  const chatContainerRef = useRef(null); // 用於引用聊天區塊

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    console.log("useEffect觸發 - userId:", userId, "id:", id, "isConnected:", isConnected);
    if (userId && id && isConnected) {
      console.log("即將加入房間:", { userId, id });
      joinRoom(userId, id);
    }
  }, [userId, id, isConnected]);
  // 每次messages更新時，滾動到最底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const doSendMessage = () => {
    if (!input.trim()) return;
    // const newMessage = {
    //   type: "message",
    //   groupId: Number(id),
    //   userId,
    //   content: input,
    //   timestamp: new Date().toISOString(),
    // };
    // setMessages((prev) => [...prev, newMessage]);
    sendMessage({
      type: "chat",
      userId: userId,
      groupId: id,
      content: input,
    });
    setInput("");
  };
  const dealTimestamp = (time) => {
    const date = new Date(time);
    const taiwanTime = date.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    // 將 "2025/03/08 23:55:35" 轉為 "2025-03-08 23:55:35"
    return taiwanTime.replace(/\//g, "-");
  }

  return (
    <div className={styles.chatRoomPage}>
      <div className={`d-flex flex-column gap-4`}>
        <div className={styles.chatSection} ref={chatContainerRef}>
          <div className="d-flex flex-column gap-2">
            {
              messages.length > 0 ? (
                messages.map((msg, index) =>
                  msg.userId == userId ? (
                    <div className={`d-flex justify-content-end w-100`} key={index}>
                      <div className={`d-flex flex-column gap-1 align-items-end w-100`}>
                        <div className="w-100 text-end">[{msg.role || "未知"}] 我 :</div>
                        <div className={` ${styles.selfMessage} ${styles.message}`}>
                          <div className="">{msg.content}</div>
                        </div>
                        <div className={styles.time}>{dealTimestamp(msg.timestamp)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-start" key={index}>
                      <div className={`d-flex flex-column gap-1 align-items-start w-100`}>
                        <div>[{msg.role || "未知"}] {msg.userName} :</div>
                        <div className={`${styles.message} ${styles.otherMessage}`}>
                          <div className="">{msg.content}</div>
                        </div>
                        <div className={styles.time}>{dealTimestamp(msg.timestamp)}</div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center text-muted">目前還沒有人開始聊天喔！快發起話題吧！</div>
              )
            }

          </div>
        </div>
        <div className="w-100 d-flex gap-2">
          <input
            className="form-control"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSendMessage()}
            placeholder="請輸入訊息"
          />
          <button className={`text-nowrap ${styles.sendBtn}`} onClick={doSendMessage}>發送</button>
        </div>

      </div>
    </div>
  );
}