"use client"; // 告知 Next.js 此組件在客戶端執行（Client Component）

import "./styles/CouponHistoryCard.css";
import Image from "next/image";
import { useState, useEffect } from "react";

/**
 * CouponImage 元件
 * 用途：顯示優惠券圖片
 */
export function CouponImage({ coupon }) {
  return (
    <Image
      src={coupon.image_url || "/img/coupon/coupon-photo.jpg"}
      alt="優惠券圖片"
      fill
      style={{ objectFit: "cover" }}
    />
  );
}

/**
 * CouponCard 元件
 * 用途：顯示優惠券卡片
 */
export default function CouponCard({ coupon }) {
  console.log("CouponCard received coupon:", coupon);

  const now = new Date();
  
  // 透過後端回傳的 display_status 判斷狀態
  const isExpired = coupon.display_status
    ? coupon.display_status === '已過期'
    : (coupon.end_date ? now > new Date(coupon.end_date) : false);
    
  const isUsed = coupon.display_status
    ? coupon.display_status === '已使用'
    : coupon.used || false; // 若沒有 display_status，則依據 coupon.used 判斷

  return (
    <div className="coupon-card" style={{ position: "relative", display: "flex" }}>
      {/* 右上角顯示可領取數量 */}
      {coupon.max_per_user > 1 && (
        <div className="coupon-max">x {coupon.remaining || coupon.max_per_user}</div>
      )}

      {/* 遮罩顯示「已過期」或「已使用」 */}
      {(isExpired || isUsed) && (
        <div
          className="coupon-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            fontSize: "1.5rem",
            fontWeight: "bold"
          }}
        >
          {isExpired ? "已過期" : "已使用"}
        </div>
      )}

      {/* 圖片區塊 */}
      <div className="coupon-image">
        <CouponImage coupon={coupon} />
      </div>

      {/* 內容區塊 */}
      <div className="coupon-left">
        <div className="coupon-value">
          {coupon.discount != null
            ? coupon.discount_type === "金額"
              ? `NT$${Number(coupon.discount).toFixed(0)}`
              : (() => {
                  let discountValue;
                  const discountNum = Number(coupon.discount);
                  if (discountNum < 1) {
                    discountValue = Number.isInteger(discountNum * 10)
                      ? discountNum * 10
                      : discountNum * 100;
                  } else {
                    discountValue = discountNum;
                  }
                  return `${discountValue}折`;
                })()
            : "NT$100"}{" "}
        </div>

        <div className="coupon-condition">
          {coupon.min_spent
            ? `滿 NT$${Number(coupon.min_spent).toFixed(0)} 可用`
            : "使用條件"}
        </div>

        <div className="d-flex justify-content-left align-items-center">
          <div className="coupon-type">{coupon.campaign_name || "折扣券"}</div>
          <div className="coupon-code" style={{ fontWeight: "300" }}>
            代碼：{coupon.code || "無代碼"}
          </div>
        </div>

        <div>
          <span className="coupon-expiry">
            {`有效期限：${coupon.end_date ? coupon.end_date.slice(0, 10) : "2025-02-10"}`}
          </span>
          <a href="#" className="coupon-terms">
            使用條件
          </a>
        </div>
      </div>

      {/* 按鈕區域，已過期或已使用則不顯示 */}
      <div className="coupon-right d-flex align-items-center">
        {!isExpired && !isUsed && (
          <button
            className="btn btn-claim btn-claim-style"
            onClick={() => (window.location.href = "/")}
          >
            去逛逛
          </button>
        )}
      </div>
    </div>
  );
}
