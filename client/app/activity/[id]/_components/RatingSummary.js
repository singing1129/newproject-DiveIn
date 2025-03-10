import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'; // 引入不同星星圖示
import styles from './comment.module.css';

const RatingSummary = ({ score = 5, reviewCount = 999, maxScore = 5 }) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(score); // 完整星星數量
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
    <div className={`d-flex align-items-center`}>
      <div className={`${styles.square} me-2`}>{score}</div>
      <div className={`d-flex flex-column justify-content-between`}>
        <div className={`${styles.star} fs-5 d-flex justify-content-between`}>
          {renderStars()}
        </div>
        <p className={`m-0`}>{reviewCount}則旅客評價</p>
      </div>
    </div>
  );
};

export default RatingSummary;