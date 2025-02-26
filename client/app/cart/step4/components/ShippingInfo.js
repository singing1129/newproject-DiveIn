export default function ShippingInfo({ shipping }) {
  if (!shipping) return <div className="text-muted">無配送資訊</div>;

  return (
    <div className="shipping-info">
      <div className="row">
        <div className="col-md-6">
          <div className="info-group">
            <label className="text-muted">配送方式</label>
            <div>{shipping.method}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="info-group">
            <label className="text-muted">預計出貨</label>
            <div>{shipping.estimatedDelivery || "尚未出貨"}</div>
          </div>
        </div>
        <div className="col-12 mt-3">
          <div className="info-group">
            <label className="text-muted">收件資訊</label>
            <div>{shipping.recipient} {shipping.phone}</div>
            <div className="mt-1">{shipping.address}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
