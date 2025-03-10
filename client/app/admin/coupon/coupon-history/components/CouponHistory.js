"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import CouponHistoryList from "./CouponHistoryList"; // 引入新的 CouponList 組件
import Pagination from "./Pagination"; // 引入 Pagination 組件
import CouponSortPagination from "./CouponSortPagination"; // 引入 CouponSortPagination 組件
import "./styles/CouponHistory.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useAuth } from "@/hooks/useAuth";

export default function CouponHistory() {
  const { user } = useAuth(); // 取得使用者資訊
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("全部");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(Infinity); // 預設為全部顯示
  const [totalPages, setTotalPages] = useState(1);
  const API_BASE_URL = "http://localhost:3005/api/coupon";

  useEffect(() => {
    if (!user || !user.id) return; // 確保 user 存在且有 id 才發送請求

    setLoading(true);
    setError(null); // 清除先前的錯誤狀態
    axios
      .get(`${API_BASE_URL}/history`, {
        params: { userId: user.id, status, sort, page, limit }
      })
      .then((response) => {
        if (response.data.success) {
          setCoupons(response.data.coupons);
          setTotalPages(response.data.totalPages);
        } else {
          setError("獲取優惠券資料失敗");
        }
      })
      .catch((err) => {
        console.error("Error fetching coupons:", err);
        setError("獲取優惠券資料時發生錯誤");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, status, sort, page, limit]);

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1); // 重置到第一頁
  };

  const handleDisplayChange = (newLimit) => {
    setLimit(newLimit === "Infinity" ? Infinity : newLimit);
    setPage(1); // 重置到第一頁
  };

  if (!user) return <div>載入使用者資訊中...</div>; // 防止未登入時發送請求
  if (loading) return <div>載入優惠券資料中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  // 優惠券列表（動態渲染）
  return (
    <>
      <div className="coupon-content">
        <div className="row">
          {/* 主要內容 */}
          <main>
            <div className="row">
              <div className="bg-white text-dark p-3">
                <div style={{ borderBottom: "1px solid lightgray" }}>
                  <h1>歷史紀錄</h1>
                </div>
                {/* 歷史紀錄篩選列 */}
                <div className="filter-group">
                  <button
                    type="button"
                    className={status === "全部" ? "active" : ""}
                    onClick={() => setStatus("全部")}
                  >
                    全部
                  </button>
                  <button
                    type="button"
                    className={status === "未使用" ? "active" : ""}
                    onClick={() => setStatus("未使用")}
                  >
                    未使用
                  </button>
                  <button
                    type="button"
                    className={status === "已使用" ? "active" : ""}
                    onClick={() => setStatus("已使用")}
                  >
                    已使用
                  </button>
                  <button
                    type="button"
                    className={status === "已過期" ? "active" : ""}
                    onClick={() => setStatus("已過期")}
                  >
                    已過期
                  </button>
                </div>
                {/* 分頁與排序選單 */}
                <CouponSortPagination 
                  onSortChange={handleSortChange} 
                  onDisplayChange={handleDisplayChange} 
                />
                {/* 優惠券列表 */}
                <CouponHistoryList coupons={coupons} loading={loading} />
                {/* 分頁控制區：顯示優惠券總數與分頁按鈕 */}
                {limit !== Infinity && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}