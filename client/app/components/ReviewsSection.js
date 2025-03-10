"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useAuth } from "@/hooks/useAuth";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const API_BASE_URL = "http://localhost:3005/api";

const ReviewsSection = ({ type, id }) => {
  const [summary, setSummary] = useState({
    averageRating: "0.0",
    totalReviews: 0,
    fiveStarPercentage: 0,
    fourStarPercentage: 0,
    threeStarPercentage: 0,
    twoStarPercentage: 0,
    oneStarPercentage: 0,
  });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("newest");
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const { getToken } = useAuth();
  const token = getToken();
  // // 當前用戶 ID（需從登入狀態獲取）
  // const currentUserId = user.id;

  // 根據 type 決定 API 端點
  const getApiEndpoint = (method) => {
    switch (type) {
      case "product":
        return method === "get"
          ? `${API_BASE_URL}/reviews/product/${id}`
          : `${API_BASE_URL}/reviews`;
      case "bundle":
        return method === "get"
          ? `${API_BASE_URL}/reviews/bundle/${id}`
          : `${API_BASE_URL}/reviews`;
      case "activity":
        return method === "get"
          ? `${API_BASE_URL}/reviews/activity/${id}`
          : `${API_BASE_URL}/reviews`;
      case "rental":
        return method === "get"
          ? `${API_BASE_URL}/reviews/rental/${id}`
          : `${API_BASE_URL}/reviews`;
      default:
        throw new Error("無效的類型");
    }
  };

  // 獲取評價數據
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = getApiEndpoint("get");
        // 如果用戶已登入，添加 Authorization header
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(endpoint, { headers });

        if (response.data.success) {
          setSummary(response.data.data.summary);
          setReviews(response.data.data.reviews);
        } else {
          setError("無法獲取評價數據");
        }
      } catch (err) {
        console.error(`獲取 ${type} 評價失敗:`, err);
        setError("載入評價時發生錯誤");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [type, id, token]); // 加入 token 作為依賴

  // 處理排序
  useEffect(() => {
    if (reviews.length === 0) return;

    let sortedReviews = [...reviews];

    switch (sortOption) {
      case "highest":
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case "newest":
        sortedReviews.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        sortedReviews.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "mostUseful":
        sortedReviews.sort((a, b) => b.useful_count - a.useful_count);
        break;
      default:
        break;
    }

    setDisplayedReviews(sortedReviews);
  }, [reviews, sortOption]);

  // 處理「有用」點擊

  const handleMarkUseful = async (reviewId) => {
    try {
      // 檢查用戶是否已登入
      if (!token) {
        alert("請先登入再標記評論為有用");
        return;
      }

      // 檢查用戶是否已經點過有用
      const reviewIndex = displayedReviews.findIndex((r) => r.id === reviewId);
      if (reviewIndex === -1) return;

      const review = displayedReviews[reviewIndex];
      if (review.hasVoted) {
        // 如果前端已標記為投票過，則不發送請求
        console.log("您已經標記過此評論為有用");
        return;
      }

      // 立即更新UI狀態，避免用戶重複點擊
      // 創建臨時更新的評論列表
      const tempUpdatedReviews = [...displayedReviews];
      tempUpdatedReviews[reviewIndex] = {
        ...tempUpdatedReviews[reviewIndex],
        hasVoted: true, // 立即標記為已投票
      };
      setDisplayedReviews(tempUpdatedReviews);

      // 同時更新主評論列表
      const mainReviewIndex = reviews.findIndex((r) => r.id === reviewId);
      if (mainReviewIndex !== -1) {
        const tempMainReviews = [...reviews];
        tempMainReviews[mainReviewIndex] = {
          ...tempMainReviews[mainReviewIndex],
          hasVoted: true,
        };
        setReviews(tempMainReviews);
      }

      // 發送請求到後端
      try {
        const response = await axios.post(
          `${API_BASE_URL}/reviews/${reviewId}/useful`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // 請求成功，更新評論的有用計數
          const finalUpdatedReviews = [...displayedReviews];
          finalUpdatedReviews[reviewIndex] = {
            ...finalUpdatedReviews[reviewIndex],
            useful_count: response.data.data.useful_count,
            hasVoted: true,
          };
          setDisplayedReviews(finalUpdatedReviews);

          // 更新主評論列表
          if (mainReviewIndex !== -1) {
            const finalMainReviews = [...reviews];
            finalMainReviews[mainReviewIndex] = {
              ...finalMainReviews[mainReviewIndex],
              useful_count: response.data.data.useful_count,
              hasVoted: true,
            };
            setReviews(finalMainReviews);
          }
        }
      } catch (apiError) {
        // 處理API錯誤
        console.error("標記有用API錯誤:", apiError);

        // 即使API返回錯誤，也保持"已投票"狀態
        // 因為可能是用戶已經在另一處投票過（400錯誤）
        if (apiError.response && apiError.response.status !== 400) {
          // 如果不是 "已投票" 錯誤，可以顯示錯誤信息
          console.log("標記評論為有用時發生錯誤");
        }
      }
    } catch (err) {
      console.error("處理評論投票失敗:", err);
    }
  };
  // 渲染星級進度條
  const renderStarProgress = (stars, percentage) => (
    <div key={stars} className="d-flex align-items-center small mb-1">
      <span style={{ width: "30px" }}>{stars}星</span>
      <div className="progress flex-grow-1 mx-2" style={{ height: "8px" }}>
        <div
          className="progress-bar bg-warning"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-muted" style={{ width: "40px" }}>
        {percentage}%
      </span>
    </div>
  );

  // 渲染星級圖標
  const renderStars = (rating) => (
    <div className="stars small">
      {[...Array(5)].map((_, i) => (
        <i
          key={i}
          className={`fa-${
            i < Math.floor(rating) ? "solid" : "regular"
          } fa-star text-warning`}
        />
      ))}
    </div>
  );

  // 處理郵箱打碼
  const maskEmail = (email) => {
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length !== 2) return email;

    const name = parts[0];
    const domain = parts[1];

    let maskedName = "";
    if (name.length <= 2) {
      maskedName = name[0] + "*";
    } else {
      maskedName =
        name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
    }

    return `${maskedName}@${domain}`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">載入評價中...</span>
        </div>
        <p className="mt-2">載入評價中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-danger">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
      </div>
    );
  }

  return (
    <div className="reviews-section my-5">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0 fw-bold">
                {type === "product"
                  ? "商品評價"
                  : type === "bundle"
                  ? "套裝評價"
                  : type === "activity"
                  ? "活動評價"
                  : "租賃評價"}
                <span className="ms-2 text-primary">
                  ({summary.totalReviews})
                </span>
              </h4>
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="sortDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {sortOption === "newest" && "最新評價"}
                  {sortOption === "oldest" && "最舊評價"}
                  {sortOption === "highest" && "評分高至低"}
                  {sortOption === "lowest" && "評分低至高"}
                  {sortOption === "mostUseful" && "最有用"}
                </button>
                <ul className="dropdown-menu" aria-labelledby="sortDropdown">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setSortOption("newest")}
                    >
                      最新評價
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setSortOption("oldest")}
                    >
                      最舊評價
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setSortOption("highest")}
                    >
                      評分高至低
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setSortOption("lowest")}
                    >
                      評分低至高
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setSortOption("mostUseful")}
                    >
                      最有用
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 評分摘要 */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="text-center p-4 bg-light rounded-3 h-100 d-flex flex-column justify-content-center">
              <h2 className="display-4 fw-bold text-primary mb-0">
                {summary.averageRating}
              </h2>
              <div className="my-2">{renderStars(summary.averageRating)}</div>
              <p className="text-muted mb-0">
                共 {summary.totalReviews} 個評價
              </p>
            </div>
          </div>
          <div className="col-md-8">
            <div className="p-4 bg-light rounded-3 h-100">
              <h5 className="mb-3">評分分佈</h5>
              {[
                { stars: 5, percentage: summary.fiveStarPercentage },
                { stars: 4, percentage: summary.fourStarPercentage },
                { stars: 3, percentage: summary.threeStarPercentage },
                { stars: 2, percentage: summary.twoStarPercentage },
                { stars: 1, percentage: summary.oneStarPercentage },
              ].map((item) => renderStarProgress(item.stars, item.percentage))}
            </div>
          </div>
        </div>

        {/* 評論滑塊 */}
        {displayedReviews.length > 0 ? (
          <div className="review-slider position-relative mb-4">
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              className="py-4"
            >
              {displayedReviews.map((review) => (
                <SwiperSlide key={review.id}>
                  <div className="review-card h-100 border rounded-3 p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <div className="review-avatar me-3">
                        {review.userAvatar ? (
                          <Image
                            src={review.userAvatar}
                            alt="User Avatar"
                            width={50}
                            height={50}
                            className="rounded-circle"
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                            style={{ width: 50, height: 50 }}
                          >
                            {review.userName?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">{review.userName}</h6>
                        <small className="text-muted">
                          {maskEmail(review.userEmail)}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>{renderStars(review.rating)}</div>
                      <small className="text-muted">
                        {formatDate(review.createdAt)}
                      </small>
                    </div>

                    <p className="review-content flex-grow-1 mb-3">
                      {review.comment}
                    </p>

                    {review.spec && (
                      <div className="review-spec mb-3">
                        <span className="badge bg-light text-dark">
                          規格：{review.spec}
                        </span>
                      </div>
                    )}

                    {/* 評論卡片內的「有用」按鈕 */}
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <button
                        className={`btn btn-sm ${
                          review.hasVoted
                            ? "btn-success"
                            : token
                            ? "btn-outline-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => handleMarkUseful(review.id)}
                        disabled={review.hasVoted || !token}
                        title={
                          !token
                            ? "請先登入再標記為有用"
                            : review.hasVoted
                            ? "您已標記此評論為有用"
                            : "標記此評論為有用"
                        }
                      >
                        <i
                          className={`fa${
                            review.hasVoted ? "s" : "r"
                          } fa-thumbs-up me-1`}
                        />
                        有用{" "}
                        {review.useful_count > 0
                          ? `(${review.useful_count})`
                          : ""}
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="text-center py-5 bg-light rounded-3">
            <i className="far fa-comment-dots fa-3x text-muted mb-3"></i>
            <h5>暫無評價</h5>
            <p className="text-muted">
              成為第一個評價此
              {type === "product"
                ? "商品"
                : type === "bundle"
                ? "套裝"
                : type === "activity"
                ? "活動"
                : "租賃"}
              的用戶吧！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
