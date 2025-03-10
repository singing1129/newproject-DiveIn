"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./articleList.css";
import axios from "axios";
import DOMPurify from "dompurify";
import { useAuth } from "../../hooks/useAuth";

export default function ArticleCard({ article, isMyArticles, onDeleteSuccess }) {
  const backendURL = "http://localhost:3005";
  const defaultImage = `${backendURL}/uploads/article/no_is_main.png`;
  const [imageUrl, setImageUrl] = useState(
    article.img_url?.startsWith("http")
      ? article.img_url
      : `${backendURL}${article.img_url || "/uploads/article/no_is_main.png"}`
  );
  const [tags, setTags] = useState([]); // 新增狀態來儲存標籤

  const { user } = useAuth();
  const router = useRouter();
  const sanitizedContent = DOMPurify.sanitize(article.content || "");

  // 獲取單篇文章的標籤資料
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/article/${article.id}`);
        const articleData = res.data.data;
        setTags(articleData.tags || []); // 從單篇 API 獲取 tags
      } catch (error) {
        console.error(`無法獲取文章 ${article.id} 的標籤:`, error);
        setTags([]); // 失敗時設置為空陣列
      }
    };

    fetchTags();
  }, [article.id]);

  const handleDelete = async () => {
    if (window.confirm("確定要刪除這篇文章嗎？")) {
      try {
        console.log(`Deleting article with ID: ${article.id}`);
        const response = await axios.delete(`${backendURL}/api/article/${article.id}`);
        if (response.data.status === "success") {
          alert("文章刪除成功");
          onDeleteSuccess();
        }
      } catch (error) {
        console.error("刪除失敗:", error);
        alert("刪除文章失敗");
      }
    }
  };

  useEffect(() => {
    const fullImageUrl = article.img_url?.startsWith("http")
      ? article.img_url
      : `${backendURL}${article.img_url || "/uploads/article/no_is_main.png"}`;
    setImageUrl(fullImageUrl);
  }, [article.img_url]);

  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = sanitizedContent;
    }
  }, [sanitizedContent]);

  const isAuthor = user && user.id === article.users_id;

  return (
    <Link href={`/article/${article.id}`} passHref legacyBehavior>
      <a className="article-list-card-link">
        <div className="article-list-card">
          <div className="article-list-card-photo">
            <Image
              className="article-list-card-photo-img"
              src={imageUrl}
              alt="Article Thumbnail"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImageUrl(defaultImage)}
            />
          </div>
          <div className="article-list-card-text">
            <div className="article-list-card-title">{article.title}</div>
            <div className="article-list-card-info">
              <div className="article-list-card-author">
                <span className="article-list-icon">
                  <i className="fa-solid fa-user"></i>
                </span>
                {article.author_name}
              </div>
              <div className="article-list-card-publishtime">
                <span className="article-list-icon">
                  <i className="fa-solid fa-calendar-days"></i>
                </span>
                {article.publish_at}
              </div>
              <div className="article-list-card-comment">
                <span className="article-list-icon">
                  <i className="fa-regular fa-comment-dots"></i>
                </span>
                {article.reply_count} 則評論
              </div>
            </div>
       
          
            <div
              className="article-list-card-content"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
              <div className="article-list-card-tag">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag.trim()}
                </span>
              ))}
            </div>
            <div className="article-list-card-btn">
              {isMyArticles && isAuthor && (
                <>
                  <button
                    className="btn btn-card btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/article/${article.id}/update`);
                    }}
                  >
                    編輯
                  </button>
                  <button
                    className="btn btn-card btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    刪除
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}