"use client"; // 告知 Next.js 此組件在客戶端執行（Client Component）

// 載入 CouponCard 專用的 CSS 樣式檔
import "./styles/MyCouponCard.css";

// 從 next/image 載入 Image 組件，用來優化圖片顯示
import Image from "next/image";

// 從 React 載入 useState 與 useEffect hook，用來管理狀態與副作用
import { useState, useEffect } from "react";

/**
 * CouponImage 元件
 * 用途：顯示優惠券圖片
 * - 如果 coupon.image_url 存在，就使用詆圖片
 * - 若不存在，則顯示預設圖片（/img/coupon/coupon-photo.jpg）
 */
export function CouponImage({ coupon }) {
  return (
    <Image
      src={coupon.image_url || "/img/coupon/coupon-photo.jpg"} // 使用提供的圖片網址，若無則顯示預設圖片
      alt="優惠券圖片" // 圖片替代文字，利於無障礙設計
      fill
      style={{ objectFit: "cover" }} // 設定圖片的填充模式，避免變形
    />
  );
}

/**
 * CouponCard 元件
 * 用途：顯示優惠券卡片，包括圖片、內容、進度條以及領取按鈕
 * 右上角 badge 顯示邏輯：
 * - 若 coupon.max_per_user 大於 1：
 *     * 若未領取（claimed 為 false），顯示「剩餘 {remaining}」
 *     * 若已領取（claimed 為 true），顯示「可使用 {usable}」
 * - 若等於 1，則不顯示 badge
 */
export default function CouponCard({ coupon, onClaim }) {
  console.log("CouponCard received coupon:", coupon); // 確保有拿到資料

  // 狀態管理：claimed, remaining, usable 與提示訊息
  const [claimed, setClaimed] = useState(coupon.claimed || false);
  const [remaining, setRemaining] = useState(coupon.remaining || coupon.max_per_user);
  const [usable, setUsable] = useState(coupon.usable || 0);
  const [message, setMessage] = useState("");

  // 當外部傳入的 coupon 資料更新時，同步更新狀態
  useEffect(() => {
    setClaimed(coupon.claimed || false);
    setRemaining(coupon.remaining || coupon.max_per_user);
    setUsable(coupon.usable || 0);
  }, [coupon]); // 這樣當 coupon 更新時，會同步更新狀態

  // 判斷優惠券是否已過期
  const now = new Date();
  const isExpired = coupon.end_date ? now > new Date(coupon.end_date) : false;

  // 若優惠券未被領取並且未過期則渲染該卡片
  if (!claimed && isExpired) {
    return null; // 可以根據您的需求進一步修改邏輯來顯示不同的內容
  }

  return (
    <div
      className="coupon-card"
      style={{ position: "relative", display: "flex" }} // 使用 flex 佈局方便排版
    >
      {/* 右上角 badge：
          僅當優惠券每人可領取數量大於 1 時才顯示， 
          並依據 coupon.remaining 顯示剩餘可領取張數 */}
      {coupon.max_per_user > 1 && (
        <div className="coupon-max">x {remaining}</div>
      )}

      {/* 圖片區塊 */}
      <div className="coupon-image">
        <CouponImage coupon={coupon} /> {/* 使用 CouponImage 元件來顯示圖片 */}
      </div>

      {/* 內容區塊 */}
      <div className="coupon-left">
        {/* 顯示優惠券折扣金額或折扣率 */}
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
          {/* 若沒有設定折扣，預設顯示 NT$100 */}
        </div>

        {/* 顯示使用優惠券的最低消費金額條件 */}
        <div className="coupon-condition">
          {coupon.min_spent
            ? `滿 NT$${Number(coupon.min_spent).toFixed(0)} 可用`
            : "使用條件"}
        </div>

        {/* 顯示優惠券名稱與代碼 */}
        <div className="d-flex justify-content-left align-items-center">
          <div className="coupon-type">{coupon.campaign_name || "折扣券"}</div>
          <div className="coupon-code" style={{ fontWeight: "300" }}>
            代碼：{coupon.code || "無代碼"}
          </div>
        </div>

        {/* 顯示有效期限與使用條件連結 */}
        <div>
          <span className="coupon-expiry">
            {`有效期限：${
              coupon.end_date ? coupon.end_date.slice(0, 10) : "2025-02-10"
            }`}
          </span>
          <a href="#" className="coupon-terms">
            使用條件
          </a>
        </div>
      </div>

      {/* 按鈕區：已領取則顯示前往逛逛按鈕 */}
      <div className="coupon-right d-flex align-items-center">
        <button
          className="btn btn-claim btn-claim-style"
          onClick={() => (window.location.href = "/browse")}
        >
          去逛逛
        </button>
      </div>

      {/* 若有訊息則顯示，例如錯誤或成功提示 */}
      {message && <p>{message}</p>}
    </div>
  );
}
