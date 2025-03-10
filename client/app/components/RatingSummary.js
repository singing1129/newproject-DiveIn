import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:3005/api";

const RatingSummary = ({ type, id, size = "small" }) => {
  const [ratingData, setRatingData] = useState({
    averageRating: "0.0",
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  // 根據 type 決定 API 端點
  const getApiEndpoint = () => {
    switch (type) {
      case "product":
        return `${API_BASE_URL}/reviews/product/${id}`;
      case "bundle":
        return `${API_BASE_URL}/reviews/bundle/${id}`;
      case "activity":
        return `${API_BASE_URL}/reviews/activity/${id}`;
      case "rental":
        return `${API_BASE_URL}/reviews/rental/${id}`;
      default:
        throw new Error("無效的類型");
    }
  };

  // 獲取評價數據
  useEffect(() => {
    const fetchRating = async () => {
      setLoading(true);
      try {
        const endpoint = getApiEndpoint();
        const response = await axios.get(endpoint);
        if (response.data.success) {
          setRatingData({
            averageRating: response.data.data.summary.averageRating,
            totalReviews: response.data.data.summary.totalReviews,
          });
        }
      } catch (err) {
        console.error(`獲取 ${type} 評價失敗:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRating();
    }
  }, [type, id]);

  // 渲染星級圖標（支持半星）
  const renderStars = () => {
    const rating = parseFloat(ratingData.averageRating);
    const fullStars = Math.floor(rating); // 完整星星數
    const hasHalfStar = rating - fullStars >= 0.5; // 是否有半星

    return (
      <div className={`stars ${size} d-flex align-items-center`}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            // 完整星星
            return (
              <i
                key={i}
                className="fa-solid fa-star text-warning"
                style={{ fontSize: size === "small" ? "12px" : "16px" }}
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            // 半星
            return (
              <i
                key={i}
                className="fa-solid fa-star-half-alt text-warning"
                style={{ fontSize: size === "small" ? "12px" : "16px" }}
              />
            );
          } else {
            // 空星星
            return (
              <i
                key={i}
                className="fa-regular fa-star text-warning"
                style={{ fontSize: size === "small" ? "12px" : "16px" }}
              />
            );
          }
        })}
      </div>
    );
  };

  // 格式化顯示文字
  const renderRatingText = () => {
    const { averageRating, totalReviews } = ratingData;
    if (totalReviews === 0) {
      return <span className="text-muted small">尚無評價</span>;
    }
    return (
      <div className="d-flex align-items-center">
        {renderStars()}
        <span className="ms-1 small">
          {averageRating} ({totalReviews})
        </span>
      </div>
    );
  };

  if (loading) {
    return <span className="text-muted small">載入中...</span>;
  }

  return <div>{renderRatingText()}</div>;
};

export default RatingSummary;