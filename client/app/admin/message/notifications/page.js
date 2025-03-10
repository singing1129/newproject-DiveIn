"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/admin/components/PageHeader";
import styles from "./chatRoom.module.css";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function NotificationsPage() {
    const { user } = useAuth();
    const { systemNotifications } = useWebSocket() || {};
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const api = "http://localhost:3005/api";
    const chatContainerRef = useRef(null); // 用於引用聊天區塊


    const formatTime = (isoString) => {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "無效時間";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份從 0 開始
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };


    // 從後端 API 獲取歷史通知
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${api}/notifications`, {
                    params: { userId: user?.id },
                });
                if (response.data.success) {
                    setNotifications(response.data.data);
                }
            } catch (error) {
                console.error("請求通知失敗:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchNotifications();
        }
    }, [user]);
    // 每次messages更新時，滾動到最底部
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [notifications]);

    // 監聽 WebSocket 的即時通知
    useEffect(() => {
        if (systemNotifications && systemNotifications.length > 0) {
            setNotifications((prev) => {
                const newNotifs = systemNotifications
                    .filter((notif) => !prev.some((p) => p.id === notif.id))
                    .map((n) => ({
                        id: n.id,
                        content: n.content,
                        time: n.timestamp,
                    }));
                return [...prev, ...newNotifs];
            });
        }
    }, [systemNotifications]);

    return (
        <div className={styles.notificationsPage}>
            <PageHeader title="系統通知" />
            <div className={styles.chatRoomPage}>
                <div className={`d-flex flex-column gap-4`}>
                    <div className={styles.chatSection} ref={chatContainerRef}>
                        <div className="d-flex flex-column gap-2">
                            {loading ? (
                                <p>載入中...</p>
                            ) : notifications.length > 0 ? (
                                notifications.map((msg, index) =>
                                    <div className="d-flex justify-content-start" key={index}>
                                        <div className={`d-flex flex-column gap-1 align-items-start w-100`}>
                                            <div>系統通知 :</div>
                                            <div className={`${styles.message} ${styles.otherMessage}`}>
                                                <div className="">{msg.content}</div>
                                            </div>
                                            <div className={styles.time}>{formatTime(msg.time)}</div>
                                        </div>
                                    </div>

                                )
                            ) : (
                                <p>目前沒有系統通知</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}