"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";
import styles from "./styles.module.css"; // 假設你有 styles.module.css
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function MessagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { systemNotifications } = useWebSocket(); // 從 WebSocket 獲取系統通知

  // 揪團資料
  const [myGroups, setMyGroups] = useState([]);
  const [condition, setCondition] = useState({});

  // API 基礎路徑
  const api = "http://localhost:3005/api";

  // 當 user 更新時，設定條件並獲取揪團資料
  useEffect(() => {
    if (user && user.id) {
      const userId = user.id;
      setCondition({ ...condition, user: userId });
    }
  }, [user]);

  // 獲取揪團資料
  useEffect(() => {
    if (!condition.user) return;
    const getGroups = async () => {
      try {
        const res = await axios.post(`${api}/admin/myGroup`, condition);
        setMyGroups(res.data.data); // 直接使用所有揪團資料
      } catch (error) {
        console.error("獲取揪團資料失敗:", error);
      }
    };
    getGroups();
  }, [condition]);

  // 總系統通知數量
  const totalNotifications = systemNotifications ? systemNotifications.length : 0;

  return (
    <div className={styles.accountPage}>
      <PageHeader title="我的訊息" />
      {/* 系統通知總覽 */}
      <div className={styles.notificationSummary}>
        <div>系統通知: {totalNotifications}</div>
        <button
          className={styles.viewNotificationsBtn}
          onClick={() => router.push("/admin/message/notifications")}
        >
          查看通知
        </button>
      </div>
      {/* 揪團列表 */}
      <div className={styles.groupList}>
        <div>揪團訊息</div>
        {myGroups.length > 0 ? (
          myGroups.map((group) => (
            <div
              key={group.id}
              className={styles.groupItem}
              onClick={() => router.push(`/admin/message/${group.id}`)}
            >
              <p>{group.name}</p>
              <span>{group.user_id === user.id ? "（我發起的）" : "（我參加的）"}</span>
            </div>
          ))
        ) : (
          <p className="text-center">目前沒有參與任何揪團</p>
        )}
      </div>
    </div>
  );
}