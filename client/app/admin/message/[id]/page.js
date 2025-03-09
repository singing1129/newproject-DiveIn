"use client"; // 因為需要用到 React 的狀態管理，所以標記為 Client Component

import PageHeader from "../../components/PageHeader";
import ChatRoom from "@/admin/components/ChatRoom";
import styles from "../../components/Favorites.module.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


export default function MyMessagePage() {
    const { id } = useParams();
    const [groupName,setGroupName] = useState("") 
    
    useEffect(()=>{
        const getRoomName = async () => {
            if (!id) return; // 如果id不存在，跳過請求
            try {
              const res = await axios.get(`http://localhost:3005/api/group/list/${id}`);
              console.log("API完整回應:", res.data); // 檢查完整回應
              const groupData = res.data.data && res.data.data[0]; // 安全訪問data[0]
              if (groupData && groupData.name) {
                setGroupName(groupData.name);
              } else {
                setGroupName("未知揪團"); // 預設值
                console.error("未找到group name:", res.data);
              }
            } catch (error) {
              console.error("獲取揪團名稱失敗:", error);
              setGroupName("載入失敗"); // 錯誤時顯示
            } 
          };
          getRoomName();
    },[id])
  return (
    <div className={styles.favoritesPage}>
      <PageHeader title={`揪團 [${groupName}] 的聊天室`} />
      <div className={styles.contentWrapper}>
        <ChatRoom />
      </div>
    </div>
  );
}