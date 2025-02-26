import React from "react";

const ProductReviews = ({ rating = 4.5, reviewCount = 245 }) => {
  return (
    <div className="container">
      <div className="product-reviews my-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">商品評價</h5>
          <a href="#" className="text-primary small">
            查看全部 ({reviewCount})
          </a>
        </div>

        {/* 評分摘要 */}
        <div className="rating-summary d-flex align-items-center mb-3 p-2 bg-light rounded">
          <div className="text-center me-4">
            <h4 className="mb-0">{rating}</h4>
            <div className="stars small">
              {[...Array(5)].map((_, index) => (
                <i
                  key={index}
                  className={`fa-${
                    index < Math.floor(rating) ? "solid" : "regular"
                  } fa-star text-warning`}
                />
              ))}
            </div>
            <small className="text-muted">{reviewCount} 個評價</small>
          </div>
          <div className="flex-grow-1">
            {[
              { stars: 5, percentage: 75 },
              { stars: 4, percentage: 15 },
              { stars: 3, percentage: 10 },
            ].map((item) => (
              <div
                key={item.stars}
                className="d-flex align-items-center small mb-1"
              >
                <span style={{ width: "30px" }}>{item.stars}星</span>
                <div
                  className="progress flex-grow-1 mx-2"
                  style={{ height: "6px" }}
                >
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-muted" style={{ width: "30px" }}>
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 評論列表 */}
        <div className="row g-3">
          {[
            {
              user: "王**",
              rating: 4,
              date: "2024-01-15",
              content: "商品品質非常好，包裝完整，運送速度快！",
              spec: "規格：黑色 / M號",
            },
            {
              user: "李**",
              rating: 3,
              date: "2024-01-10",
              content: "尺寸符合，材質還不錯，整體CP值高。",
              spec: "規格：藍色 / L號",
            },
          ].map((review, index) => (
            <div key={index} className="col-md-6">
              <div className="border rounded p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <div className="me-2 small">{review.user}</div>
                    <div className="stars small">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fa-${
                            i < review.rating ? "solid" : "regular"
                          } fa-star text-warning`}
                        />
                      ))}
                    </div>
                  </div>
                  <small className="text-muted">{review.date}</small>
                </div>
                <p className="small mb-1">{review.content}</p>
                <small className="text-muted">{review.spec}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
