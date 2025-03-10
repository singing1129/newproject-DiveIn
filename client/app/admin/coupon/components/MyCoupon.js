"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import MyCouponList from "./MyCouponList"; // 引入 MyCouponList 组件
import Pagination from "./Pagination"; // 引入 Pagination 组件
import CouponSortPagination from "./CouponSortPagination"; // 引入 CouponSortPagination 组件
import "./styles/MyCoupon.css";
import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { LuTicketPlus } from "react-icons/lu";
import { useAuth } from "@/hooks/useAuth"; // 引入 useAuth 钩子

const API_BASE_URL = "http://localhost:3005/api/coupon";

export default function Coupon() {
  const { user, loading: authLoading } = useAuth(); // 使用 useAuth 钩子获取用户信息和加载状态
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // 用於搜尋輸入
  const [couponType, setCouponType] = useState("all"); // 優惠券類型篩選
  const [statusFilter, setStatusFilter] = useState("all"); // 活動狀態篩選
  const [sortOrder, setSortOrder] = useState("latest"); // 排序方式
  const [limit, setLimit] = useState(Infinity); // 預設為全部顯示
  const [showAlert, setShowAlert] = useState(false); // 控制彈出提醒的顯示

  // 讀取優惠券資料
  useEffect(() => {
    if (!authLoading && user) {
      const fetchCoupons = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/my-coupons`, {
            params: {
              userId: user.id, // 確保傳遞了用戶ID
              page: currentPage,
              limit: limit === Infinity ? undefined : limit,
              type: couponType, // 優惠券類型篩選
              status: statusFilter, // 活動狀態篩選
              sort: sortOrder, // 排序方式
            },
          });

          console.log("API response:", response.data); // 添加日誌以檢查API返回的數據

          if (response.data.success) {
            setCoupons(response.data.coupons);
            setTotalPages(response.data.totalPages); // 設置總頁數
          } else {
            setError("獲取優惠券資料失敗");
          }
        } catch (err) {
          console.error("Error fetching coupons:", err);
          setError("獲取優惠券資料時發生錯誤");
        } finally {
          setLoading(false);
        }
      };

      fetchCoupons();
    }
  }, [authLoading, user, currentPage, couponType, statusFilter, sortOrder, limit]); // 當這些狀態改變時重新加載資料

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClaim = async (couponId) => {
    console.log("發送的 couponId:", couponId);
    console.log("發送的 userId:", user.id);
    try {
      const response = await axios.post(`${API_BASE_URL}/code-claim`, {
        couponId,
        userId: user.id, // 傳遞用戶ID
      });
      console.log("Claim response:", response.data);

      // 更新本地狀態，避免重新加載
      const claimedCoupon = response.data.coupon;
      setCoupons((prevCoupons) =>
        prevCoupons.map((coupon) =>
          coupon.id === couponId ? { ...coupon, ...claimedCoupon, status: "已領取" } : coupon
        )
      );
    } catch (error) {
      console.error("Error claiming coupon:", error);
      setShowAlert(true); // 顯示彈出提醒
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/code-claim`, {
        couponId: searchTerm,
        userId: user.id, // 傳遞用戶ID
      });
      console.log("Claim response:", response.data);

      // 更新本地狀態，避免重新加載
      const claimedCoupon = response.data.coupon;
      setCoupons((prevCoupons) => [
        ...prevCoupons,
        { ...claimedCoupon, status: "已領取" },
      ]);
      setSearchTerm(""); // 清空輸入框
    } catch (error) {
      console.error("Error claiming coupon:", error);
      setShowAlert(true); // 顯示彈出提醒
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false); // 隱藏彈出提醒
  };

  if (authLoading || loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  // 優惠券列表（動態渲染）
  return (
    <>
      {/* 主內容區塊：優惠券頁面主要內容 */}
      <div className="coupon-content container">
        <div className="row">
          {/* 主要內容區：顯示優惠券列表及相關操作 */}
          <main>
            <div className="row">
              <div className="bg-white text-dark">
                {/* 優惠券標題與快速操作連結 */}
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ borderBottom: "1px solid lightgray" }}
                >
                  <h1>我的優惠券</h1>
                  <div className="link-list">
                    <Link className="me-3" href="/admin/coupon/coupon-claim">
                      領取優惠券 &gt;
                    </Link>
                    |
                    <Link className="ms-3" href="/admin/coupon/coupon-history">
                      查看歷史資料
                    </Link>
                  </div>
                </div>
                {/* 搜尋區：可輸入優惠券代碼或名稱 */}
                <div className="d-flex bg-light p-3 mt-3 gray-block">
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ width: "100%" }}
                  >
                    <span className="me-3 search-text">新增優惠券</span>
                    <div
                      className="input-group input-group-md coupon-search"
                      style={{ maxWidth: 400 }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        id="searchInput"
                        placeholder="輸入優惠券代碼"
                        value={searchTerm}
                        onChange={handleSearchChange} // 設定搜尋變更
                      />
                      <span
                        className="input-group-text d-flex justify-content-center"
                        style={{ cursor: "pointer" }}
                        onClick={handleSearchSubmit} // 添加點擊事件處理函數
                      >
                        <LuTicketPlus
                          style={{
                            fontSize: "1.5rem",
                            color: "white",
                            cursor: "pointer",
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
                {/* 優惠券類型篩選列 */}
                <div className="filter-group flex-wrap mt-2">
                  <span className="filter-label">優惠類型：</span>
                  <div className="flex-wrap">
                    <button
                      type="button"
                      className={couponType === "all" ? "active" : ""}
                      onClick={() => setCouponType("all")}
                    >
                      全部
                    </button>
                    <button
                      type="button"
                      className={couponType === "全館" ? "active" : ""}
                      onClick={() => setCouponType("全館")}
                    >
                      全館優惠券
                    </button>
                    <button
                      type="button"
                      className={couponType === "商品" ? "active" : ""}
                      onClick={() => setCouponType("商品")}
                    >
                      商品優惠券
                    </button>
                    <button
                      type="button"
                      className={couponType === "租賃" ? "active" : ""}
                      onClick={() => setCouponType("租賃")}
                    >
                      租賃優惠券
                    </button>
                    <button
                      type="button"
                      className={couponType === "活動" ? "active" : ""}
                      onClick={() => setCouponType("活動")}
                    >
                      活動優惠券
                    </button>
                    <button
                      type="button"
                      className={couponType === "會員專屬" ? "active" : ""}
                      onClick={() => setCouponType("會員專屬")}
                    >
                      會員專屬優惠券
                    </button>
                  </div>
                </div>
                {/* 活動狀態篩選列 */}
                <div className="filter-group flex-wrap mt-1">
                  <span className="filter-label">活動狀態：</span>
                  <div className="flex-wrap">
                    <button
                      type="button"
                      className={statusFilter === "all" ? "active" : ""}
                      onClick={() => setStatusFilter("all")}
                    >
                      全部
                    </button>
                    <button
                      type="button"
                      className={statusFilter === "started" ? "active" : ""}
                      onClick={() => setStatusFilter("started")}
                    >
                      已開始
                    </button>
                    <button
                      type="button"
                      className={statusFilter === "ending" ? "active" : ""}
                      onClick={() => setStatusFilter("ending")}
                    >
                      即將結束
                    </button>
                    <button
                      type="button"
                      className={statusFilter === "upcoming" ? "active" : ""}
                      onClick={() => setStatusFilter("upcoming")}
                    >
                      即將開始
                    </button>
                    <button
                      type="button"
                      className={statusFilter === "not_started" ? "active" : ""}
                      onClick={() => setStatusFilter("not_started")}
                    >
                      未開始
                    </button>
                  </div>
                </div>
                {/* 分頁與排序選單 */}
                <CouponSortPagination 
                  onSortChange={setSortOrder} 
                  onDisplayChange={(newLimit) => {
                    setLimit(newLimit === "Infinity" ? Infinity : newLimit);
                    setCurrentPage(1); // 重置到第一頁
                  }}
                />
                {/* 優惠券列表：使用 MyCouponList 组件 */}
                <div
                  className="row row-cols-1 row-cols-md-2 g-4 mb-2"
                  id="couponContainer"
                >
                  <MyCouponList
                    coupons={coupons}
                    loading={loading}
                    // error={error}
                    onClaim={handleClaim}
                  />
                </div>
                {/* 分頁控制區：顯示優惠券總數與分頁按鈕 */}
                {limit !== Infinity && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 彈出提醒 */}
      {showAlert && (
        <div className="alert-popup">
          <div className="alert-content">
            <p>不符合領取資格</p>
            <button onClick={handleCloseAlert}>關閉</button>
          </div>
        </div>
      )}
    </>
  );
}