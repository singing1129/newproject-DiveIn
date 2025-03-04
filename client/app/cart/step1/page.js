"use client";
import { useState, useEffect, useMemo } from "react";
import "./cart1.css";
import { useRouter } from "next/navigation";
import CartFlow from "../components/cartFlow";
import CartHeader from "../components/CartHeader";
import BatchActions from "../components/BatchActions";
import CartItem from "../components/CartItem";
import { useCart } from "@/hooks/cartContext";
import { useAuth } from "@/hooks/useAuth";

export default function Cart1() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user.id;
  const { cartData, fetchCart, selectedItems, proceedToCheckout } = useCart();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 計算商品小計
  const calculateSubtotal = () => {
    return cartData.total?.final || 0;
  };

  // 計算運費
  const calculateShipping = () => {
    // 如果只有活動商品，不需要運費
    if (hasOnlyActivities) {
      return 0;
    }
    // 根據配送方式計算運費
    const subtotal = calculateSubtotal();
    return subtotal >= 1000 ? 0 : 60; // step1 階段都用超商運費計算
  };

  // 計算總金額
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  // 計算單個商品的小計
  const calculateItemSubtotal = (item, type) => {
    switch (type) {
      case "products":
        return Number(item.price) * item.quantity;
      case "activities":
        return Number(item.price) * item.quantity;
      case "rentals":
        return Number(item.price_per_day) * item.rental_days * item.quantity;
      case "bundles":
        return Number(item.discount_price);
      default:
        return 0;
    }
  };

  // 使用 useMemo 計算所有金額
  const totals = useMemo(() => {
    const selectedProducts =
      cartData.products?.filter((item) =>
        selectedItems.products?.includes(item.id)
      ) || [];
    const selectedActivities =
      cartData.activities?.filter((item) =>
        selectedItems.activities?.includes(item.id)
      ) || [];
    const selectedRentals =
      cartData.rentals?.filter((item) =>
        selectedItems.rentals?.includes(item.id)
      ) || [];
    const selectedBundles =
      cartData.bundles?.filter((item) =>
        selectedItems.bundles?.includes(item.id)
      ) || [];

    const productsTotal = selectedProducts.reduce(
      (sum, item) => sum + calculateItemSubtotal(item, "products"),
      0
    );
    const activitiesTotal = selectedActivities.reduce(
      (sum, item) => sum + calculateItemSubtotal(item, "activities"),
      0
    );
    const rentalsTotal = selectedRentals.reduce(
      (sum, item) => sum + calculateItemSubtotal(item, "rentals"),
      0
    );
    const bundlesTotal = selectedBundles.reduce(
      (sum, item) => sum + calculateItemSubtotal(item, "bundles"),
      0
    );

    // 計算租賃押金總額（）
    const depositTotal = selectedRentals.reduce(
      (sum, item) =>
        sum + Number(item.deposit || 0) * item.rental_days * item.quantity,
      0
    );

    return {
      products: productsTotal,
      activities: activitiesTotal,
      rentals: rentalsTotal,
      bundles: bundlesTotal,
      depositTotal,
      subtotal: productsTotal + activitiesTotal + rentalsTotal + bundlesTotal,
      total:
        productsTotal + activitiesTotal + rentalsTotal + bundlesTotal + depositTotal,
    };
  }, [cartData, selectedItems, calculateItemSubtotal]);

  useEffect(() => {
    // 簡化 useEffect，只負責獲取購物車數據
    fetchCart(userId).finally(() => {
      setIsInitialLoad(false);
    });
  }, [userId]); // 只依賴 userId

  // 在初始載入時不顯示任何內容
  if (isInitialLoad) {
    return null;
  }

  // 確保資料載入後才進行空購物車的判斷
  const isEmpty =
    !cartData.products?.length &&
    !cartData.activities?.length &&
    !cartData.rentals?.length &&
    !cartData.bundles?.length;

  // 檢查是否只有活動商品
  const hasOnlyActivities =
    cartData.activities?.length > 0 &&
    !cartData.products?.length &&
    !cartData.rentals?.length &&
    !cartData.bundles?.length;

  return (
    <div className="cartCss">
      <div className="container py-5">
        <CartFlow currentStep={1} />
        {isEmpty ? (
          <div className="card">
            <div className="card-body text-center py-4">
              <h5>購物車是空的</h5>
              <button
                className="btn btn-primary mt-3"
                onClick={() => router.push("/products")}
              >
                去購物
              </button>
            </div>
          </div>
        ) : (
          <div className="row mt-3">
            <div className="col-12">
              {/* 一般商品區塊 */}
              {cartData.products?.length > 0 && (
                <div className="card mb-3">
                  <CartHeader
                    title="一般商品"
                    totalItems={cartData.products.length}
                  />
                  <div className="card-body">
                    <BatchActions type="products" />
                    {cartData.products.map((item) => (
                      <CartItem
                        key={item.id}
                        item={{
                          ...item,
                          image: "/article-5ae9687eec0d4.jpg",
                          name: item.product_name,
                          // 新增了stock
                          stock: item.stock == null ? null : item.stock,
                          color: item.color_name,
                          size: item.size_name,
                        }}
                        type="products"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 套組商品區塊 - 新增 */}
              {cartData.bundles?.length > 0 && (
                <div className="card mb-3">
                  <CartHeader
                    title="套組商品"
                    totalItems={cartData.bundles.length}
                  />
                  <div className="card-body">
                    <BatchActions type="bundles" />
                    {cartData.bundles.map((bundle) => (
                      <div
                        key={bundle.id}
                        className="cart-bundle-item mb-3 border-bottom pb-3"
                      >
                        <div className="d-flex align-items-center">
                          <div className="form-check me-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedItems.bundles.includes(
                                bundle.id
                              )}
                              onChange={(e) =>
                                handleSelectItem(
                                  "bundles",
                                  bundle.id,
                                  e.target.checked
                                )
                              }
                              id={`bundle-${bundle.id}`}
                            />
                          </div>
                          <div className="flex-grow-1">
                            <h5>{bundle.name}</h5>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <p className="mb-1">{bundle.description}</p>
                                <div className="text-muted">
                                  共 {bundle.items.length} 件商品
                                </div>
                              </div>
                              <div className="bundle-price text-end">
                                <div className="text-decoration-line-through text-muted">
                                  NT$ {bundle.original_total}
                                </div>
                                <div className="text-danger h5 mb-0">
                                  NT$ {bundle.discount_price}
                                </div>
                                <div className="text-success">
                                  省下 NT$
                                  {bundle.original_total -
                                    bundle.discount_price}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() =>
                                  router.push(`/bundle/${bundle.id}`)
                                }
                              >
                                查看詳情
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  removeFromCart("bundles", bundle.id)
                                }
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 活動商品區塊 */}
              {cartData.activities?.length > 0 && (
                <div className="card mb-3">
                  <CartHeader
                    title="活動商品"
                    totalItems={cartData.activities.length}
                  />
                  <div className="card-body">
                    <BatchActions type="activities" />
                    {cartData.activities.map((item) => (
                      <CartItem
                        key={item.id}
                        item={{
                          ...item,
                          image: "./article-5ae9687eec0d4.jpg",
                          name: item.activity_name,
                          activityInfo: `${item.date} ${item.time}`,
                        }}
                        type="activities"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 租借商品區塊 */}
              {cartData.rentals?.length > 0 && (
                <div className="card mb-3">
                  <CartHeader
                    title="租借商品"
                    totalItems={cartData.rentals.length}
                  />
                  <div className="card-body">
                    <BatchActions type="rentals" />
                    {cartData.rentals.map((item) => (
                      <CartItem
                        key={item.id}
                        item={{
                          ...item,
                          image: item.image_url || "/image/rent/no-img.png",
                          name: (
                            <>
                              <span>{item.rentalBrand} -</span>
                              <br />
                              <span>{item.rental_name}</span>
                            </>
                          ),
                          rentalInfo: `${item.start_date} ~ ${item.end_date} (${item.rental_days}天)`,
                          deposit: item.deposit,
                        }}
                        type="rentals"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 訂單總計 */}
              {!isEmpty && (
                <div className="card">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col text-end">
                        {totals.depositTotal > 0 && (
                          <div className="text-muted mb-2">
                            含 租借押金：NT$ {totals.depositTotal}
                          </div>
                        )}
                        <div className="mb-2">
                          <span className="me-3">總計金額：</span>
                          <span className="h4 text-danger mb-0">
                            NT$ {totals.total}
                          </span>
                        </div>
                        <small className="text-muted">
                          結帳後可獲得 {Math.floor(totals.total / 100)} 點購物金
                        </small>
                      </div>
                      <div className="col-auto">
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={proceedToCheckout}
                        >
                          前往結帳
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
