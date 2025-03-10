"use client";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa"; // 引入不同星星圖示
import styles from "./comment.module.css";

export default function CommentCard({ comment }) {
  // 假設 comment.score 是評分，如果沒有預設為 5
  const score = comment.score || 5;
  const maxScore = 5; // 最大星星數

  // 動態生成星星的函數
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(score); // 完整星星數
    const hasHalfStar = score % 1 >= 0.5; // 是否有半顆星

    // 渲染實心星星
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} />);
    }

    // 渲染半顆星（如果有）
    if (hasHalfStar && stars.length < maxScore) {
      stars.push(<FaStarHalfAlt key="half" />);
    }

    // 渲染空心星星（補滿到 maxScore）
    while (stars.length < maxScore) {
      stars.push(<FaRegStar key={`empty-${stars.length}`} />);
    }

    return stars;
  };

  return (
    <div
      className={`d-flex ${styles.commentCard} gap-3 activity-score ${styles.activityDescriptionBorder} py-5`}
    >
      <div className={`${styles.imgContainer} rounded-circle`}>
        <img
          src={
            comment.avatar
              ? `http://localhost:3005/public/upload/avartars/${comment.avatar}`
              : "/image/images.jpg"
          }
          alt=""
        />
      </div>
      <div className={`d-flex flex-column gap-2`}>
        <h6 className={`m-0`}>{comment.name || "Shu Hui"}</h6>
        <div className={`${styles.star}`}>
          {renderStars()}
          <span className={`${styles.text}`}>
            {comment.created_at || "2021/10/23"}
          </span>
        </div>
        <div className={`${styles.commentText}`}>
          <h6 className={`fw-bold`}>{comment.title || "很開心"}</h6>
          <p className={`m-0`}>
            {comment.content ||
              "接待人員態度很親切，仔細解說、氣氛融洽、服務100分，浮潛裝備很齊全，裝口罩的防水罐很棒，有海龜在身邊共游，讓人回味無窮"}
          </p>
        </div>
      </div>
    </div>
  );
}