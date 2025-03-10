export default function OrderSummary({ items }) {
  if (!items || !items.products || !items.bundles) return null;

  return (
    <div className="order-summary">
      {/* 一般商品 */}
      {items.products.length > 0 && (
        <div className="product-section mb-4">
          <h6 className="section-title">一般商品</h6>
          {items.products.map((product) => (
            <div key={product.id} className="item-row">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="item-name">{product.name}</div>
                  <div className="item-spec text-muted">
                    {/* 有商品和尺寸才會有/  */}
                    {product.color && product.size && `${product.color}/`}
                    {product.size && `${product.size}`}
                    {product.color && !product.size && `${product.color}`}
                    {product.size && !product.color && `${product.size}`}
                  </div>
                </div>
                <div className="text-end">
                  <div>NT$ {product.price}</div>
                  <small className="text-muted">x{product.quantity}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 套装商品 */}
      {items.bundles && items.bundles.length > 0 && (
        <div className="bundle-section mb-4">
          <h6 className="section-title">套裝商品</h6>
          {items.bundles.map((bundle) => (
            <div key={bundle.id} className="item-row">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="item-name">{bundle.name}</div>
                  <div className="item-spec text-muted">
                    套裝內含{bundle.items.length}項商品
                    {bundle.items.map((item) => (
                      <div key={item.id}>
                        {item.name}
                        {item.color && `/${item.color}`}
                        {item.size && `/${item.size}`}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-end">
                  <div>NT$ {bundle.discount_price}</div>
                  <small className="text-muted">x{bundle.quantity}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
