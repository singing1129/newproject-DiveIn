"use client";
import React, { useEffect } from "react";
import CouponClaimCard from "./CouponClaimCard";

export default function CouponClaimList({ coupons, loading, error, onClaim }) {
  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="row row-cols-1 row-cols-md-2 g-4 mb-2" id="couponContainer">
      {coupons && coupons.length > 0 ? (
        coupons.map((coupon, index) => (
          <div key={`${coupon.id}-${index}`}>
            <CouponClaimCard coupon={coupon} onClaim={onClaim} />
          </div>
        ))
      ) : (
        <div>目前沒有優惠券</div>
      )}
    </div>
  );
}
