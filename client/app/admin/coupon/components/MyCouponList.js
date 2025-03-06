import MyCouponCard from "./MyCouponCard"; // 引入 CouponCard 组件

export default function MyCouponList({ coupons, loading, error, onClaim }) {
  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <>
      {coupons.length > 0 ? (
        coupons.map((coupon) => (
          <div key={coupon.id} className="col">
            <MyCouponCard coupon={coupon} onClaim={onClaim} />
          </div>
        ))
      ) : (
        <div className="no-coupons">目前沒有優惠券</div>
      )}
    </>
  );
}