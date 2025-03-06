"use client";
import React from "react";
import CouponHistoryCard from "./CouponHistoryCard";

export default function CouponHistoryList({ coupons, loading, error }) {
  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="row row-cols-1 row-cols-md-2 g-4 mb-2" id="couponContainer">
      {coupons && coupons.length > 0 ? (
        coupons.map((coupon, index) => (
          <div key={`${coupon.id}-${index}`}>
            <CouponHistoryCard coupon={coupon}/>
          </div>
        ))
      ) : (
        <div>目前沒有優惠券</div>
      )}
    </div>
  );
}
