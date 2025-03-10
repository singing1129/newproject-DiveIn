"use client";
import React, { useState, useEffect, useRef } from "react";
import "./styles/CouponFilterBar.css";

const CouponFilterBar = ({
  onFilterChange,
  filters = { campaign_name: "全部", coupon_category: "全部", claim_status: "全部" },
  campaignOptions = [],
  couponTypeOptions = ["全部", "全館", "商品", "租賃", "活動", "會員專屬"],
  claimStatusOptions = ["全部", "已領取", "未領取"],
}) => {
  const labelMapping = {
    "全部": "全部",
    "全館": "全館優惠券",
    "商品": "商品優惠券",
    "租賃": "租賃優惠券",
    "活動": "活動優惠券",
    "會員專屬": "會員專屬優惠券"
  };

  const defaultCampaignOptions = ["全部", ...campaignOptions];

  // 設定初始值
  const [selectedCampaign, setSelectedCampaign] = useState(filters.campaign_name);
  const [selectedCouponType, setSelectedCouponType] = useState(filters.coupon_category);
  const [selectedClaimStatus, setSelectedClaimStatus] = useState(filters.claim_status);

  const scrollRef = useRef(null);
  const [showScrollRightButton, setShowScrollRightButton] = useState(false);
  const [showScrollLeftButton, setShowScrollLeftButton] = useState(false);

  // 每次 filter 狀態變更時，都呼叫 onFilterChange，送出最新篩選參數
  useEffect(() => {
    onFilterChange({
      campaign_name: selectedCampaign,
      coupon_category: selectedCouponType,
      claim_status: selectedClaimStatus,
    });
  }, [selectedCampaign, selectedCouponType, selectedClaimStatus]);

  // 檢查是否需要顯示向右和向左滾動按鈕
  useEffect(() => {
    const checkScrollButtonVisibility = () => {
      if (scrollRef.current) {
        setShowScrollRightButton(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
        setShowScrollLeftButton(scrollRef.current.scrollLeft > 0);
      }
    };

    checkScrollButtonVisibility();
    window.addEventListener("resize", checkScrollButtonVisibility);
    if (scrollRef.current) {
      scrollRef.current.addEventListener("scroll", checkScrollButtonVisibility);
    }

    return () => {
      window.removeEventListener("resize", checkScrollButtonVisibility);
      if (scrollRef.current) {
        scrollRef.current.removeEventListener("scroll", checkScrollButtonVisibility);
      }
    };
  }, [campaignOptions]);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    } 
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const renderFilterButtons = (options, selectedValue, setSelected) => {
    return options.map((option) => (
      <button
        key={option}
        type="button"
        className={`btn rounded-pill px-3 ${selectedValue === option ? "active" : ""}`}
        onClick={() => setSelected(option)}
      >
        {labelMapping[option] || option}
      </button>
    ));
  };

  // 當 loading 為 true 時顯示空白，否則顯示篩選欄
  return (
    <>
      <div className="d-flex">
        {showScrollLeftButton && (
          <div className="d-flex align-items-center justify-content-center scroll-indicator mt-4" onClick={handleScrollLeft}>
            <i className="fa-solid fa-circle-chevron-left" />
          </div>
        )}
        <div className="d-flex gap-2 mt-4 mb-2 horizontal-scroll" ref={scrollRef}>
          {renderFilterButtons(defaultCampaignOptions, selectedCampaign, setSelectedCampaign)}
        </div>
        {showScrollRightButton && (
          <div className="d-flex align-items-center justify-content-center scroll-indicator mt-4" onClick={handleScrollRight}>
            <i className="fa-solid fa-circle-chevron-right" />
          </div>
        )}
      </div>

      {/* 優惠類型篩選 */}
      <div className="filter-group mt-2">
        <span className="filter-label">優惠類型：</span>
        {renderFilterButtons(couponTypeOptions, selectedCouponType, setSelectedCouponType)}
      </div>

      {/* 領取狀態篩選 */}
      <div className="filter-group">
        <span className="filter-label">領取狀態：</span>
        {renderFilterButtons(claimStatusOptions, selectedClaimStatus, setSelectedClaimStatus)}
      </div>
    </>
  );
};

export default CouponFilterBar;