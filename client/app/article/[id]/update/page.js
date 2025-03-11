"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Sidebar from "../../components/sidebar";
import Edit from "../../components/edit"; // 引入編輯組件
import "../../components/articleCreate.css";
import { useSonner } from "../../../hooks/useSonner"; // 引入 useSonner hook

export default function ArticleUpdate() {
  const { id } = useParams(); // 獲取文章 ID
  const router = useRouter();
  const [initialData, setInitialData] = useState(null);
  const { success, error: sonnerError } = useSonner();

  const [error, setError] = useState(null);
  // 獲取文章初始數據
  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3005/api/article/${id}`
        );
        if (response.data.status === "success") {
          setInitialData(response.data.data);
        } else {
          setError("獲取文章數據失敗");
        }
      } catch (error) {
        setError("獲取文章數據失敗，請稍後再試");
        console.error("❌ 獲取文章數據失敗：", error);
      }
    };

    fetchArticleData();
  }, [id]);
  // 在頁面中顯示錯誤訊息
  {
    error && <div className="error-message">{error}</div>;
  }
  // 處理保存

const handleSave = async (formData, status) => {
  try {
    const response = await axios.put(
      `http://localhost:3005/api/article/update/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    //sonner
    if (response.data.status === "success") {
      success("文章更新成功！"); // 使用 sonner 的成功通知
      router.push(`/article/${id}`);
    } else {
      sonnerError("更新文章失敗"); // 使用 sonner 的錯誤通知
    }
  } catch (error) {
    console.error("❌ 提交表單失敗：", error);
    sonnerError("提交表單失敗，請稍後再試"); // 使用 sonner 的錯誤通知
  }
};

  return (
    <div className="container mt-4">
      <div className="row">
      <div className="col-3 d-none d-md-block"> {/* 在大尺寸顯示，小尺寸隱藏 */}
        <Sidebar />
        </div>
        <div className="article-create col-12 col-md-9"> {/* 小尺寸佔滿，大尺寸佔 9/12 */}
          {initialData && (
            <Edit initialData={initialData} onSave={handleSave} />
          )}
        </div>
      </div>
    </div>
  );
}
