"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "@/components/Breadcrumb/breadcrumb";
import CouponClaimList from "./CouponClaimList";
import Carousel from "./Carousel/Carousel";
import CouponSearchBox from "./CouponSearchBox";
import CouponFilterBar from "./CouponFilterBar";
import CouponSortPagination from "./CouponSortPagination";
import Pagination from "./Pagination";
import "./styles/CouponClaim.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuth } from "@/hooks/useAuth";

export default function CouponClaim() {
  const API_BASE_URL = "http://localhost:3005/api/coupon";
  const { user, token } = useAuth(); // 從 useAuth 取得 token

  // 儲存從 API 取得的優惠券資料
  const [coupons, setCoupons] = useState([]);
  // 儲存分頁資訊：總筆數、目前頁碼、總頁數
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  // 儲存所有優惠券的檔期活動
  const [campaignOptions, setCampaignOptions] = useState([]);
  // 儲存每頁顯示的數量
  const [displayCount, setDisplayCount] = useState("全部顯示");
  // 載入狀態與錯誤訊息
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 儲存篩選條件
  const [filters, setFilters] = useState({
    campaign_name: "全部",
    coupon_category: "全部",
    claim_status: "全部",
  });

  // 儲存排序條件
  const [sort, setSort] = useState("latest");

  // 根據分頁與篩選條件呼叫後端 API，取得優惠券資料
  const fetchCoupons = async (page = 1, filters = {}, sort = "latest", limit = "全部顯示") => {
    console.log("fetchCoupons");
    setLoading(true);
    setError(null);
    try {
      // 組合 query 參數，包含分頁、篩選條件和排序條件
      const params = {
        page,
        limit: limit === "全部顯示" ? Infinity : limit,
        ...filters,
        sort,
        userId: user.id,
      };
      // 呼叫後端 /api/coupon/claim API
      const response = await axios.get(`${API_BASE_URL}/claim`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`, // 在請求標頭中加入認證 token
        },
      });
      if (response.data.success) {
        setCoupons(response.data.coupons);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages,
        });
      } else {
        setCoupons([]);
        setError("取得優惠券資料失敗");
      }
    } catch (err) {
      setCoupons([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初次載入時取得所有優惠券的檔期活動
  const fetchCampaignOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaignOptions`, {
        params: {
          userId: user.id, // 傳入 user ID
        },
        headers: {
          Authorization: `Bearer ${token}`, // 在請求標頭中加入認證 token
        },
      });
      if (response.data.success) {
        setCampaignOptions(response.data.campaignOptions);
      } else {
        setCampaignOptions([]);
      }
    } catch (err) {
      setCampaignOptions([]);
      console.error("取得檔期活動失敗:", err.message);
    }
  };

  useEffect(() => {
    fetchCoupons(1, filters, sort, displayCount);
    fetchCampaignOptions();
  }, [filters, sort, displayCount]);

  // 當篩選條件改變時，更新 filters 狀態並重新呼叫 API（從第一頁開始）
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 當排序條件改變時，更新 sort 狀態並重新呼叫 API（從第一頁開始）
  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  // 當分頁切換時呼叫此回呼
  const handlePageChange = (newPage) => {
    fetchCoupons(newPage, filters, sort, displayCount);
  };

  // 當每頁顯示數量改變時呼叫此回呼
  const handleDisplayChange = (newDisplayCount) => {
    setDisplayCount(newDisplayCount);
  };

  // 當使用者在搜尋框輸入或點擊搜尋時，根據搜尋字串呼叫 /search API
  const handleSearch = async (searchText) => {
    setLoading(true);
    setError(null);
    try {
      // 呼叫 /search API，假設後端根據搜尋字串回傳優惠券資料
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { q: searchText, userId: user.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCoupons(response.data.coupons);
        // 搜尋結果通常不含分頁資訊，需要可自行調整
        setPagination({
          total: response.data.coupons.length,
          page: 1,
          totalPages: 1,
        });
      } else {
        setCoupons([]);
        setError("搜尋失敗");
      }
    } catch (err) {
      setCoupons([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 新增 handleClaim 函式：處理使用者領取優惠券的動作
  const handleClaim = async (couponId) => {
    try {
      const requestBody = { couponId, userId: user.id }; // 使用實際登入的 userId
      const res = await fetch(`${API_BASE_URL}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "伺服器錯誤");
      }
      // 領取成功後重新取得最新優惠券資料
      fetchCoupons(1, filters, sort, displayCount);
      return data;
    } catch (error) {
      console.error("領取失敗:", error.message);
      return { success: false, error: error.message };
    }
  };

  return (
    <div>
      <div className="carousel">
        <Carousel />
      </div>
      {/* 麵包屑導航 */}
      <Breadcrumb />
      {/* 優惠券內容區 */}
      <div className="container mt-2 coupon-content">
        <h1 className="mb-4">您的專屬優惠</h1>
        {/* 搜尋功能 */}
        <CouponSearchBox onSearch={handleSearch} />
        {/* 篩選元件，傳入 campaignOptions 讓檔期活動依資料呈現 */}
        <CouponFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          campaignOptions={campaignOptions}
        />
        <CouponSortPagination 
          onSortChange={handleSortChange} 
          onDisplayChange={handleDisplayChange} // 傳入 handleDisplayChange
        />
        {/* 優惠券列表 */}
        <div className="coupon-list-container">
        <CouponClaimList 
          coupons={coupons}
          loading={loading}
          onClaim={handleClaim}
        />
        </div>
        {/* 分頁元件 */}
        {displayCount !== "全部顯示" && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}