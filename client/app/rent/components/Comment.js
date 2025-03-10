"use client";

import { useState } from "react";
import styles from "./Comment.module.css";
import Image from "next/image";

const Comment = ({ comments = [] }) => {
  const [sortBy, setSortBy] = useState("all");
  const [visibleComments, setVisibleComments] = useState(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localComments, setLocalComments] = useState(comments); // 新增本地狀態管理評論

  // 當外部傳入的 comments 更新時，同步到本地狀態
  useState(() => {
    setLocalComments(comments);
  }, [comments]);

  const totalRating =
    localComments.reduce((sum, comment) => sum + comment.rating, 0) / localComments.length || 0;
  const roundedRating = Math.round(totalRating * 10) / 10;

  const sortOptions = [
    { value: "all", label: "全部留言" },
    { value: "popular", label: "熱門留言" },
    { value: "newest", label: "時間由新到舊" },
    { value: "oldest", label: "時間由舊到新" },
    { value: "highestRating", label: "星級由高到低" },
    { value: "lowestRating", label: "星級由低到高" },
  ];

  const handleSortSelect = (value) => {
    setSortBy(value);
    setIsDropdownOpen(false);
  };

  const sortedComments = [...localComments].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
    if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
    if (sortBy === "highestRating") return b.rating - a.rating;
    if (sortBy === "lowestRating") return a.rating - b.rating;
    if (sortBy === "popular") return b.likes - a.likes;
    return 0;
  });

  const loadMoreComments = () => {
    setVisibleComments((prev) => prev + 6);
  };

  // 按讚功能
  const handleLike = (commentId) => {
    const updatedComments = localComments.map((comment) =>
      comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment
    );
    setLocalComments(updatedComments); // 更新本地評論狀態
  };

  return (
    <div className={styles.commentSection}>
      <div className={styles.ratingSummary}>
        <div className={styles.totalRating}>
          <span className={styles.ratingValue}>{roundedRating}</span>
          <div className={styles.stars}>
            {"★".repeat(Math.round(roundedRating))}
            {"☆".repeat(5 - Math.round(roundedRating))}
          </div>
          <span className={styles.ratingCount}>
            ({localComments.length} 則評價)
          </span>
        </div>
        <div className={styles.sortDropdownContainer}>
          <div
            className={styles.sortDropdown}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {sortOptions.find((opt) => opt.value === sortBy)?.label || "選擇排序"}
          </div>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  className={styles.dropdownItem}
                  onClick={() => handleSortSelect(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.commentList}>
        {sortedComments.slice(0, visibleComments).map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <Image
                  src={comment.avatar || "/image/rent/default-avatar.png"}
                  alt="會員"
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