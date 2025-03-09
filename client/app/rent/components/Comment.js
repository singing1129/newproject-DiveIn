"use client";

import { useState } from "react";
import styles from "./Comment.module.css";
import Image from "next/image";

const Comment = ({ comments = [] }) => {
  const [sortBy, setSortBy] = useState("all"); // 預設排序方式
  const [visibleComments, setVisibleComments] = useState(6); // 初始顯示 6 筆評論

  // 計算總星級評分
  const totalRating =
    comments.reduce((sum, comment) => sum + comment.rating, 0) /
    comments.length;
  const roundedRating = Math.round(totalRating * 10) / 10; // 四捨五入到小數點後一位

  // 根據排序方式處理評論
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "oldest") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === "highestRating") {
      return b.rating - a.rating;
    } else if (sortBy === "lowestRating") {
      return a.rating - b.rating;
    } else if (sortBy === "all") {
      return 0; // 不排序
    } else if (sortBy === "popular") {
      return b.likes - a.likes; // 按熱門排序
    }
    return 0;
  });

  // 加載更多評論，每次增加 6 筆
  const loadMoreComments = () => {
    setVisibleComments((prev) => prev + 6); // 每次點擊增加 6 筆顯示
  };

  // 按讚功能
  const handleLike = (commentId) => {
    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    );
    setComments(updatedComments); // 注意：這裡需要定義 setComments 或改進邏輯
  };

  return (
    <div className={styles.commentSection}>
      {/* 總評分區塊 */}
      <div className={styles.ratingSummary}>
        <div className={styles.totalRating}>
          <span className={styles.ratingValue}>{roundedRating}</span>
          <div className={styles.stars}>
            {"★".repeat(Math.round(roundedRating))}
            {"☆".repeat(5 - Math.round(roundedRating))}
          </div>
          <span className={styles.ratingCount}>
            ({comments.length} 則評價)
          </span>
        </div>
        <div className={styles.sortDropdownContainer}>
          <select
            className={styles.sortDropdown}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="all">全部留言</option>
            <option value="popular">熱門留言</option>
            <option value="newest">時間由新到舊</option>
            <option value="oldest">時間由舊到新</option>
            <option value="highestRating">星級由高到低</option>
            <option value="lowestRating">星級由低到高</option>
          </select>
          <i className="bi bi-caret-down-fill"></i>
        </div>
      </div>

      {/* 評論列表 */}
      <div className={styles.commentList}>
        {sortedComments.slice(0, visibleComments).map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <Image
                  src={comment.avatar || "/image/rent/default-avatar.png"}
                  alt="用戶頭像"
                  width={50}
                  height={50}
                  className={styles.avatarImage}
                />
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {comment.user}
                  <span className={styles.userContact}>
                    {comment.email || comment.phone || comment.line}
                  </span>
                </div>
                <div className={styles.userRating}>
                  {"★".repeat(comment.rating)}
                  {"☆".repeat(5 - comment.rating)}
                </div>
              </div>
              <div className={styles.commentDate}>{comment.date}</div>
            </div>
            <div className={styles.commentContent}>
              <p className={styles.userComment}>{comment.comment}</p>
              <div
                className={styles.likeButton}
                onClick={() => handleLike(comment.id)}
              >
                <i className="bi bi-hand-thumbs-up"></i> {comment.likes}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 加載更多按鈕 */}
      {visibleComments < sortedComments.length && (
        <div className={styles.loadMore}>
          <button className={styles.loadMoreButton} onClick={loadMoreComments}>
            查看更多評價
          </button>
        </div>
      )}
    </div>
  );
};

export default Comment;