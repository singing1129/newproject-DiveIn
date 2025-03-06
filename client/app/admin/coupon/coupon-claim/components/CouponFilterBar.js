"use client";
import React, { useState, useEffect } from "react";
import "./styles/CouponFilterBar.css";

const CouponFilterBar = ({
  onFilterChange,
  filters = { campaign_name: "全部優惠", coupon_category: "全部", claim_status: "全部" },
  campaignOptions = [],
  couponTypeOptions = ["全部", "全館", "商品", "租賃", "活動", "會員專屬"],
  claimStatusOptions = ["全部", "已領取", "未領取"],
  mapping = {
    "全部優惠": {
      couponTypes: ["全部", "全館", "商品", "租賃", "活動", "會員專屬"],
      claimStatuses: ["全部", "已領取", "未領取"],
    },
    "優惠活動": {
      couponTypes: ["全部", "全館", "商品"],
      claimStatuses: ["全部", "未領取"],
    },
  },
}) => {
  const defaultCampaignOptions =
    campaignOptions && campaignOptions.length > 0
      ? campaignOptions.includes("全部優惠")
        ? campaignOptions
        : ["全部優惠", ...campaignOptions]
      : ["全部優惠"];

  // 設定初始值
  const [selectedCampaign, setSelectedCampaign] = useState(filters.campaign_name || defaultCampaignOptions[0]);
  const [selectedCouponType, setSelectedCouponType] = useState(filters.coupon_category || "全部");
  const [selectedClaimStatus, setSelectedClaimStatus] = useState(filters.claim_status || "全部");

  // 設定目前的篩選選項
  const [currentCouponTypeOptions, setCurrentCouponTypeOptions] = useState(couponTypeOptions);
  const [currentClaimStatusOptions, setCurrentClaimStatusOptions] = useState(claimStatusOptions);

  // 當 selectedCampaign 改變時，依據 mapping 更新 couponType 與 claimStatus 的可選項，並檢查目前選取的值是否有效
  useEffect(() => {
    if (selectedCampaign in mapping) {
      setCurrentCouponTypeOptions(mapping[selectedCampaign].couponTypes);
      setCurrentClaimStatusOptions(mapping[selectedCampaign].claimStatuses);
      if (!mapping[selectedCampaign].couponTypes.includes(selectedCouponType)) {
        setSelectedCouponType("全部");
      }
      if (!mapping[selectedCampaign].claimStatuses.includes(selectedClaimStatus)) {
        setSelectedClaimStatus("全部");
      }
    } else {
      setCurrentCouponTypeOptions(couponTypeOptions);
      setCurrentClaimStatusOptions(claimStatusOptions);
    }
  }, [selectedCampaign]);

  // 每次 filter 狀態變更時，都呼叫 onFilterChange，送出最新篩選參數
  useEffect(() => {
    onFilterChange({
      campaign_name: selectedCampaign,
      coupon_category: selectedCouponType,
      claim_status: selectedClaimStatus,
    });
  }, [selectedCampaign, selectedCouponType, selectedClaimStatus]);

  const renderFilterButtons = (options, selectedValue, setSelected) => {
    return options.map((option) => (
      <button
        key={option}
        type="button"
        className={`btn rounded-pill px-3 ${selectedValue === option ? "active" : ""}`}
        onClick={() => setSelected(option)}
      >
        {option}
      </button>
    ));
  };

  return (
    <>
      <div className="d-flex">
        <div className="d-flex gap-2 mt-4 mb-2 horizontal-scroll">
          {renderFilterButtons(defaultCampaignOptions, selectedCampaign, setSelectedCampaign)}
        </div>
        <div className="d-flex align-items-center justify-content-center scroll-indicator mt-4">
          <i className="fa-solid fa-circle-chevron-right" />
        </div>
      </div>

      {/* 優惠類型篩選 */}
      <div className="filter-group mt-2">
        <span className="filter-label">優惠類型：</span>
        {renderFilterButtons(currentCouponTypeOptions, selectedCouponType, setSelectedCouponType)}
      </div>

      {/* 領取狀態篩選 */}
      <div className="filter-group">
        <span className="filter-label">領取狀態：</span>
        {renderFilterButtons(currentClaimStatusOptions, selectedClaimStatus, setSelectedClaimStatus)}
      </div>
    </>
  );
};

export default CouponFilterBar;
