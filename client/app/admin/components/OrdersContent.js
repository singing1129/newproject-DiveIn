import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Orders.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  // 控制各項目的評價視窗是否開啟，key 格式："orderId-itemId-type"
  const [reviewWindows, setReviewWindows] = useState({});
  // 儲存各項目評價輸入的文字內容
  const [reviewTexts, setReviewTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const userId = user.id;

  useEffect(() => {
    fetchUserOrders();
  }, [userId]);

  // 取得用戶所有訂單基本資訊
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3005/api/order/user/${userId}`);
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message || "取得訂單失敗");
      }
      setLoading(false);
    } catch (err) {
      console.error("取得訂單資料失敗:", err);
      setError(err.message || "取得訂單資料時發生錯誤");
      setLoading(false);
    }
  };

  // 取得特定訂單詳情
  const fetchOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3005/api/order/${orderId}`);
      if (response.data.success) {
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, details: response.data.data } : order
        );
        setOrders(updatedOrders);
        setExpandedOrderId(orderId);
      } else {
        throw new Error(response.data.message || "取得訂單詳情失敗");
      }
    } catch (err) {
      console.error("取得訂單詳情失敗:", err);
      alert("取得訂單詳情時發生錯誤: " + (err.message || "未知錯誤"));
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "product":
        return "商品";
      case "rental":
        return "租借";
      case "activity":
        return "活動";
      default:
        return "";
    }
  };

  // 取得用於評價視窗的 key
  const getReviewKey = (orderId, itemId, type) =>
    `${orderId}-${itemId}-${type}`;

  // 切換單一項目的評價視窗
  const toggleReviewWindow = (orderId, itemId, type) => {
    const key = getReviewKey(orderId, itemId, type);
    setReviewWindows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 更新對應評價項目的輸入內容
  const handleReviewTextChange = (key, value) => {
    setReviewTexts((prev) => ({ ...prev, [key]: value }));
  };

  // 處理提交評價
  const handleReviewSubmit = (orderId, itemId, type) => {
    const key = getReviewKey(orderId, itemId, type);
    const reviewText = reviewTexts[key] || "";
    // 這裡可調用 API 提交評論，這裡僅以 alert 示範
    alert(`提交評論: ${reviewText} (訂單 ${orderId}, 項目 ${itemId}, 類型 ${type})`);
    // 評論提交後，關閉視窗並清除輸入內容
    setReviewWindows((prev) => ({ ...prev, [key]: false }));
    setReviewTexts((prev) => ({ ...prev, [key]: "" }));
  };

  if (loading) {
    return <div className="text-center p-4">載入中...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className={styles.ordersContent}>
      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className="text-center p-4">目前沒有訂單記錄</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              {/* 訂單標題與基本資訊 */}
              <div className={styles.orderHeader}>
                <h3 className={styles.orderId}>
                  訂單 #{order.orderNumber || order.id}
                </h3>
                <p className={styles.orderStatus}>
                  {order.payment_status === "paid"
                    ? "已付款"
                    : order.status === "pending"
                    ? "已付款"
                    : "已取消"}
                </p>
              </div>
              <div className={styles.orderHeader}>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                <p>NT$ {order.total_price}</p>
              </div>

              {/* 當未展開時，顯示預覽摘要 */}
              {expandedOrderId !== order.id && (
                <div className={styles.orderSummary}>
                  <div className={styles.orderItem}>
                    {order.firstItem && (
                      <img
                        src={order.firstItem.image_url || "/placeholder.jpg"}
                        alt="訂單預覽"
                        className={styles.orderImage}
                      />
                    )}
                    <div className={styles.orderDetails}>
                      <h4 className={styles.orderTitle}>
                        {order.firstItem
                          ? order.firstItem.name
                          : "訂單項目"}
                      </h4>
                      {order.totalItems > 1 && (
                        <p className={styles.orderDescription}>
                          共 {order.totalItems} 項商品
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 當展開時，顯示各區塊詳細內容（不重複預覽） */}
              {expandedOrderId === order.id && order.details && (
                <div className={styles.orderExpanded}>
                  {/* 商品區塊 */}
                  {order.details.items.products &&
                    order.details.items.products.length > 0 && (
                      <div className={styles.orderSection}>
                        <div
                          className={`${styles.orderType} ${styles.products}`}
                        >
                          {getTypeLabel("product")}
                        </div>
                        <div className={styles.orderItems}>
                          {order.details.items.products.map((product) => {
                            const reviewKey = getReviewKey(
                              order.id,
                              product.id,
                              "product"
                            );
                            return (
                              <div key={product.id} className={styles.orderItem}>
                                <img
                                  src={product.image || "/placeholder.jpg"}
                                  alt={product.name}
                                  className={styles.orderImage}
                                />
                                <div className={styles.orderDetails}>
                                  <h4 className={styles.orderTitle}>
                                    {product.name}
                                  </h4>
                                  <p className={styles.orderDescription}>
                                    {product.color && product.size
                                      ? `${product.color} / ${product.size}`
                                      : "標準款式"}
                                  </p>
                                  <p className={styles.orderDescription}>
                                    數量: {product.quantity} | 單價: NT$
                                    {product.price}
                                  </p>
                                  <button
                                    className={styles.orderButton}
                                    onClick={() =>
                                      toggleReviewWindow(
                                        order.id,
                                        product.id,
                                        "product"
                                      )
                                    }
                                  >
                                    {reviewWindows[reviewKey]
                                      ? "取消評價"
                                      : "評價"}
                                  </button>
                                  {reviewWindows[reviewKey] && (
                                    <div className={styles.reviewWindow}>
                                      <textarea
                                        className={styles.reviewTextarea}
                                        placeholder="請輸入評論"
                                        value={reviewTexts[reviewKey] || ""}
                                        onChange={(e) =>
                                          handleReviewTextChange(
                                            reviewKey,
                                            e.target.value
                                          )
                                        }
                                      />
                                      <button
                                        className={styles.orderButton}
                                        onClick={() =>
                                          handleReviewSubmit(
                                            order.id,
                                            product.id,
                                            "product"
                                          )
                                        }
                                      >
                                        提交評論
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* 活動區塊 */}
                  {order.details.items.activities &&
                    order.details.items.activities.length > 0 && (
                      <div className={styles.orderSection}>
                        <div
                          className={`${styles.orderType} ${styles.events}`}
                        >
                          {getTypeLabel("activity")}
                        </div>
                        <div className={styles.orderItems}>
                          {order.details.items.activities.map((activity) => {
                            const reviewKey = getReviewKey(
                              order.id,
                              activity.id,
                              "activity"
                            );
                            return (
                              <div key={activity.id} className={styles.orderItem}>
                                <img
                                  src={activity.image || "/placeholder.jpg"}
                                  alt={activity.name}
                                  className={styles.orderImage}
                                />
                                <div className={styles.orderDetails}>
                                  <h4 className={styles.orderTitle}>
                                    {activity.name}
                                  </h4>
                                  <p className={styles.orderDescription}>
                                    {activity.projectName}
                                  </p>
                                  <p className={styles.orderDescription}>
                                    日期: {activity.date} | 時間: {activity.time} | 人數:{" "}
                                    {activity.quantity}
                                  </p>
                                  <button
                                    className={styles.orderButton}
                                    onClick={() =>
                                      toggleReviewWindow(
                                        order.id,
                                        activity.id,
                                        "activity"
                                      )
                                    }
                                  >
                                    {reviewWindows[reviewKey]
                                      ? "取消評價"
                                      : "評價"}
                                  </button>
                                  {reviewWindows[reviewKey] && (
                                    <div className={styles.reviewWindow}>
                                      <textarea
                                        className={styles.reviewTextarea}
                                        placeholder="請輸入評論"
                                        value={reviewTexts[reviewKey] || ""}
                                        onChange={(e) =>
                                          handleReviewTextChange(
                                            reviewKey,
                                            e.target.value
                                          )
                                        }
                                      />
                                      <button
                                        className={styles.orderButton}
                                        onClick={() =>
                                          handleReviewSubmit(
                                            order.id,
                                            activity.id,
                                            "activity"
                                          )
                                        }
                                      >
                                        提交評論
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* 租借區塊 */}
                  {order.details.items.rentals &&
                    order.details.items.rentals.length > 0 && (
                      <div className={styles.orderSection}>
                        <div
                          className={`${styles.orderType} ${styles.rentals}`}
                        >
                          {getTypeLabel("rental")}
                        </div>
                        <div className={styles.orderItems}>
                          {order.details.items.rentals.map((rental) => {
                            const reviewKey = getReviewKey(
                              order.id,
                              rental.id,
                              "rental"
                            );
                            return (
                              <div key={rental.id} className={styles.orderItem}>
                                <img
                                  src={rental.image || "/placeholder.jpg"}
                                  alt={rental.name}
                                  className={styles.orderImage}
                                />
                                <div className={styles.orderDetails}>
                                  <h4 className={styles.orderTitle}>
                                    {rental.name}
                                  </h4>
                                  <p className={styles.orderDescription}>
                                    租借期間: {rental.startDate} 至 {rental.endDate}
                                  </p>
                                  <p className={styles.orderDescription}>
                                    數量: {rental.quantity} | 租金: NT$ {rental.rentalFee} | 押金: NT$ {rental.deposit}
                                  </p>
                                  <button
                                    className={styles.orderButton}
                                    onClick={() =>
                                      toggleReviewWindow(
                                        order.id,
                                        rental.id,
                                        "rental"
                                      )
                                    }
                                  >
                                    {reviewWindows[reviewKey]
                                      ? "取消評價"
                                      : "評價"}
                                  </button>
                                  {reviewWindows[reviewKey] && (
                                    <div className={styles.reviewWindow}>
                                      <textarea
                                        className={styles.reviewTextarea}
                                        placeholder="請輸入評論"
                                        value={reviewTexts[reviewKey] || ""}
                                        onChange={(e) =>
                                          handleReviewTextChange(
                                            reviewKey,
                                            e.target.value
                                          )
                                        }
                                      />
                                      <button
                                        className={styles.orderButton}
                                        onClick={() =>
                                          handleReviewSubmit(
                                            order.id,
                                            rental.id,
                                            "rental"
                                          )
                                        }
                                      >
                                        提交評論
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* 切換展開/收合 */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.orderButton}
                  onClick={() => fetchOrderDetails(order.id)}
                >
                  {expandedOrderId === order.id ? "收合" : "查看詳情"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
