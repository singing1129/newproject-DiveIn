"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./articleList.css";

export default function ArticleCard({
  article,
  isMyArticles,
  onDeleteSuccess,
}) {
  const backendURL = "http://localhost:3005";
  // 在 useState 內設定初始圖片網址
  const [imageUrl, setImageUrl] = useState(
    article.img_url?.startsWith("http")
      ? article.img_url
      : `${backendURL}${article.img_url || "/uploads/article/no_is_main.png"}`
  );

  //刪除文章
  const handleDelete = async () => {
    if (!confirm("確定要刪除此文章嗎？")) return;

    try {
      const response = await fetch(`${backendURL}/api/article/${article.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("文章刪除成功");
        onDeleteSuccess();
      } else {
        alert("刪除失敗");
      }
    } catch (error) {
      console.error("刪除失敗:", error);
      alert("刪除時發生錯誤");
    }
  };

  // 生成完整的圖片 URL
  useEffect(() => {
    const fullImageUrl = article.img_url?.startsWith("http")
      ? article.img_url
      : `${backendURL}${article.img_url || "/uploads/article/no_is_main.png"}`;

    setImageUrl(fullImageUrl); // 更新 imageUrl 狀態
  }, [article.img_url]);

  return (
    <div className="article-list-card">
      <div className="article-list-card-photo">
        <Image
          className="article-list-card-photo-img"
          src={imageUrl}
          alt="Article Thumbnail"
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, 50vw" // 根據視窗寬度設置大小
          onError={() => setImageUrl(defaultImage)}
        />
      </div>

      <div className="article-list-card-text">
        <div className="article-list-card-title">{article.title}</div>
        <div className="article-list-card-info">
          <div className="article-list-card-author">
            <span className="article-list-icon">
              {" "}
              <i className="fa-solid fa-user"></i>
            </span>

            {article.author_name}
          </div>
          <div className="article-list-card-publishtime">
            <span className="article-list-icon">
              {" "}
              <i className="fa-solid fa-calendar-days"></i>
            </span>

            {article.publish_at}
          </div>
          <div className="article-list-card-comment">
            <span className="article-list-icon">
              {" "}
              <i className="fa-regular fa-comment-dots"></i>
            </span>
            {article.reply_count} 則評論
          </div>
        </div>
        <div className="article-list-card-content">{article.content}</div>
        <div className="article-list-card-btn">
          {/* 只有在“我的文章”页面才显示删除按钮 */}
          {isMyArticles && (
            <button className="btn btn-danger" onClick={handleDelete}>
              刪除
            </button>
          )}
           {/* 更多按钮 */}
          <Link href={`/article/${article.id}`} passHref>
            <button className="btn">更多</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
