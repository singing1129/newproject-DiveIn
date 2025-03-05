"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import CouponHistoryList from "./CouponHistoryList"; // 引入新的 CouponList 組件
import Pagination from "./Pagination"; // 引入 Pagination 組件
import "./styles/CouponHistory.css";
import '@fortawesome/fontawesome-free/css/all.min.css'
import useAuth from '@/hooks/useAuth';

const API_BASE_URL = "http://localhost:3005/api/coupon";

export default function CouponHistory() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("全部");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  

  // 讀取優惠券資料
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/history`, {
        params: { status, sort, page, limit: 10 }
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
  }, [status, sort, page]);

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  // 優惠券列表（動態渲染）
  return (
    <>
      <div className="coupon-content">
        <div className="row">
          {/* 主要內容 */}
          <main>
            <div className="row">
              <div className=" bg-white text-dark p-3">
                <div style={{borderBottom: '1px solid lightgray'}}>
                  <h1>歷史紀錄</h1>
                </div>
                {/* 歷史紀錄篩選列 */}
                <div className="filter-group">
                  <button type="button" className={status === "全部" ? "active" : ""} onClick={() => setStatus("全部")}>全部</button>
                  <button type="button" className={status === "未使用" ? "active" : ""} onClick={() => setStatus("未使用")}>未使用</button>
                  <button type="button" className={status === "已使用" ? "active" : ""} onClick={() => setStatus("已使用")}>已使用</button>
                  <button type="button" className={status === "已過期" ? "active" : ""} onClick={() => setStatus("已過期")}>已過期</button>
                </div>
                {/* 分頁與排序選單 */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  {/* 分頁顯示 */}
                  <div className="pagination">顯示 第{page}頁 / 共{totalPages}頁</div>
                  {/* 排序選單 */}
                  <div className="d-flex align-items-center">
                    <span className="me-2">排序方式：</span>
                    <select className="form-select form-select-sm rounded-pill custom-select-container" value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="latest">最新</option>
                      <option value="expiry">即將到期</option>
                      <option value="discount">最高折扣</option>
                    </select>
                  </div>
                </div>
                {/* 優惠券列表 */}
                <CouponHistoryList coupons={coupons} loading={loading} error={error} />
                {/* 分頁控制區：顯示優惠券總數與分頁按鈕 */}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}