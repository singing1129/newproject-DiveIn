// components/CouponSelector.js
import React, { useState, useEffect } from 'react';
import { useCoupon } from '@/hooks/useCoupon';

const CouponSelector = ({ cartData, onApplyCoupon, onRemoveCoupon }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [debug, setDebug] = useState(false);
  const {
    eligibleCoupons,
    allCoupons,
    selectedCoupon,
    applyCoupon,
    removeCoupon,
    loading,
    error,
    couponCode,
    setCouponCode,
    applyByCouponCode
  } = useCoupon(cartData);

  // 當組件渲染時記錄優惠券信息
  useEffect(() => {
    console.log("CouponSelector 渲染");
    console.log("可用優惠券:", eligibleCoupons.length);
    console.log("所有優惠券:", allCoupons.length);
    console.log("已選擇優惠券:", selectedCoupon);
  }, [eligibleCoupons, allCoupons, selectedCoupon]);

  const handleApplyCoupon = (coupon) => {
    applyCoupon(coupon);
    if (onApplyCoupon) onApplyCoupon(coupon);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    if (onRemoveCoupon) onRemoveCoupon();
  };

  const handleSubmitCode = (e) => {
    e.preventDefault();
    applyByCouponCode();
  };

  // 顯示折扣類型
  const formatDiscountType = (coupon) => {
    if (coupon.discount_type === '金額') {
      return `折抵 NT$${coupon.discount}`;
    } else {
      return `${coupon.discount}% 折扣`;
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="coupon-selector">
      {/* 優惠碼輸入區 */}
      <div className="mb-4">
        <form onSubmit={handleSubmitCode} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="請輸入優惠券代碼"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-outline-primary"
            disabled={loading || !couponCode.trim()}
          >
            {loading ? '處理中...' : '使用'}
          </button>
        </form>
        {error && <div className="text-danger mt-2"><small>{error}</small></div>}
        {selectedCoupon && (
          <div className="mt-2 alert alert-success d-flex justify-content-between align-items-center">
            <div>
              <strong>已套用：</strong> {selectedCoupon.name} ({formatDiscountType(selectedCoupon)})
            </div>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={handleRemoveCoupon}
            >
              移除
            </button>
          </div>
        )}
      </div>

      {/* 優惠券標籤頁 */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            可用優惠券 ({eligibleCoupons.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部優惠券 ({allCoupons.length})
          </button>
        </li>
        {process.env.NODE_ENV === 'development' && (
          <li className="nav-item ms-auto">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDebug(!debug)}
            >
              {debug ? '關閉調試' : '顯示調試'}
            </button>
          </li>
        )}
      </ul>

      {/* 優惠券列表 */}
      <div className="vstack gap-2 coupon-list">
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : activeTab === 'available' ? (
          eligibleCoupons.length > 0 ? (
            eligibleCoupons.map((coupon) => (
              <div 
                key={coupon.coupon_usage_id}
                className={`border rounded p-3 position-relative coupon-item ${
                  selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id 
                  ? 'border-primary bg-light' 
                  : ''
                }`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold text-danger mb-1">
                      {coupon.name} {formatDiscountType(coupon)}
                    </div>
                    <small className="text-muted d-block">
                      消費滿 NT${coupon.min_spent} 可使用
                    </small>
                    <small className="text-muted">
                      有效期限：{formatDate(coupon.end_date)}
                    </small>
                    {debug && (
                      <>
                        <small className="d-block text-secondary">
                          狀態: {coupon.usage_status || '無狀態'}
                        </small>
                        <small className="d-block text-secondary">
                          ID: {coupon.id}, Usage ID: {coupon.coupon_usage_id}
                        </small>
                      </>
                    )}
                  </div>
                  <button 
                    className={`btn ${
                      selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id 
                      ? 'btn-primary' 
                      : 'btn-outline-primary'
                    } btn-sm`}
                    onClick={() => handleApplyCoupon(coupon)}
                    disabled={selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id}
                  >
                    {selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id ? '已使用' : '使用'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-muted">
              目前沒有可用的優惠券
            </div>
          )
        ) : (
          allCoupons.length > 0 ? (
            allCoupons.map((coupon) => {
              const isEligible = eligibleCoupons.some(c => c.coupon_usage_id === coupon.coupon_usage_id);
              const isExpired = new Date() > new Date(coupon.end_date);
              const isUsed = coupon.usage_status === '已使用';
              
              return (
                <div 
                  key={coupon.coupon_usage_id}
                  className={`border rounded p-3 position-relative coupon-item ${
                    selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id 
                    ? 'border-primary bg-light' 
                    : ''
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-danger mb-1">
                        {coupon.name} {formatDiscountType(coupon)}
                      </div>
                      <small className="text-muted d-block">
                        消費滿 NT${coupon.min_spent} 可使用
                      </small>
                      <small className="text-muted">
                        有效期限：{formatDate(coupon.end_date)}
                      </small>
                      <small className="d-block">
                        {isUsed ? (
                          <span className="text-secondary">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            已使用
                          </span>
                        ) : isExpired ? (
                          <span className="text-danger">
                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                            已過期
                          </span>
                        ) : !isEligible ? (
                          <span className="text-warning">
                            <i className="bi bi-info-circle-fill me-1"></i>
                            不符合使用條件
                          </span>
                        ) : (
                          <span className="text-success">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            可使用
                          </span>
                        )}
                      </small>
                      {debug && (
                        <>
                          <small className="d-block text-secondary">
                            狀態: {coupon.usage_status || '無狀態'}
                          </small>
                          <small className="d-block text-secondary">
                            ID: {coupon.id}, Usage ID: {coupon.coupon_usage_id}
                          </small>
                        </>
                      )}
                    </div>
                    {isEligible && !isExpired && !isUsed ? (
                      <button 
                        className={`btn ${
                          selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id 
                          ? 'btn-primary' 
                          : 'btn-outline-primary'
                        } btn-sm`}
                        onClick={() => handleApplyCoupon(coupon)}
                        disabled={selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id}
                      >
                        {selectedCoupon?.coupon_usage_id === coupon.coupon_usage_id ? '已使用' : '使用'}
                      </button>
                    ) : (
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        disabled
                      >
                        {isExpired ? '已過期' : isUsed ? '已使用' : '不可用'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-3 text-muted">
              沒有優惠券記錄
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CouponSelector;