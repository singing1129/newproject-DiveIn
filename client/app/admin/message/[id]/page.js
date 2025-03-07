"use client"
import styles from "./styles.module.css"
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function ChatRoomPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [userId, setUserId] = useState("")
    const [input, setInput] = useState(""); // 輸入框內容
    const { messages, sendMessage, joinRoom, isConnected } = useWebSocket();

    useEffect(() => {
        if (user?.id) {
            setUserId(user.id)
        }
    }, [user])
    useEffect(() => {
        if(userId && id ){
            joinRoom(userId,id)
        }
    }, [userId, id,isConnected])


    return (
        <div className={styles.accountPage} >
            <div>
                <div></div>
                <input type="text" name="" id="" onChange={(e) => {
                    setInput(e.target.value)
                }} />
            </div>
        </div>
    );
}