import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Orders.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const userId = user.id;

  useEffect(() => {
    fetchUserOrders();
  }, [userId]);

  // 獲取用戶所有訂單的基本資訊
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3005/api/order/user/${userId}`
      );

      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message || "取得訂單失敗");
      }
      setLoading(false);
    } catch (err) {
      console.error("獲取訂單資料失敗:", err);
      setError(err.message || "獲取訂單資料時發生錯誤");
      setLoading(false);
    }
  };

  // 獲取特定訂單的詳細資訊
  const fetchOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      // 如果已經展開，則收合
      setExpandedOrderId(null);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3005/api/order/${orderId}`
      );

      if (response.data.success) {
        // 更新訂單列表中的特定訂單詳情
        const updatedOrders = orders.map((order) =>
          order.id === orderId
            ? { ...order, details: response.data.data }
            : order
        );
        setOrders(updatedOrders);
        setExpandedOrderId(orderId);
      } else {
        throw new Error(response.data.message || "取得訂單詳情失敗");
      }
    } catch (err) {
      console.error("獲取訂單詳情失敗:", err);
      alert("獲取訂單詳情時發生錯誤: " + (err.message || "未知錯誤"));
    }
  };

  // 根據訂單類型顯示對應的標籤
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

  // 處理評價按鈕點擊
  const handleRateOrder = (orderId) => {
    // 這裡可以發送評價請求到後端或導向評價頁面
    alert(`評價訂單 #${orderId}`);
    // 更新訂單評價狀態
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, isRated: true } : order
    );
    setOrders(updatedOrders);
  };

  // 查看詳情按鈕處理
  const handleViewDetails = (orderId) => {
    // 可以導向詳情頁面，或者獲取並顯示詳情
    fetchOrderDetails(orderId);
  };

  if (loading) {
    return <div className="text-center p-4">載入中...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className={styles.ordersContent}>
      {/* 訂單列表 */}
      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className="text-center p-4">目前沒有訂單記錄</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              {/* 訂單標題 - 始終顯示 */}
              <div className={styles.orderHeader}>
                <h3 className={styles.orderId}>
                  訂單 #{order.orderNumber || order.id}
                </h3>
                <p className={styles.orderStatus}>
                  狀態: {/* 付款狀態   */}
                  {order.payment_status === "paid"
                    ? "已付款"
                    : order.status === "pending"
                    ? "已付款"
                    : "已取消"}
                </p>
              </div>

              {/* 訂單簡易資訊 - 收合時顯示 */}
              {
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
                        {order.firstItem ? order.firstItem.name : "訂單項目"}
                      </h4>
                      <p className={styles.orderDescription}>
                        訂單金額: NT$ {order.total_price} | 日期:{" "}
                        {new Date(order.createdAt).toLocaleDateString()} | 共{" "}
                        {order.totalItems || "多"} 項商品 | 付款方式:{" "}
                        {order.payment_method === "ecpay"
                          ? "信用卡"
                          : order.payment_method === "linepay"
                          ? "LINE Pay"
                          : "其他"}
                      </p>
                    </div>
                  </div>
                </div>
              }

              {/* 訂單詳細資訊 - 展開時顯示 */}
              {expandedOrderId === order.id && order.details && (
                <div className={styles.orderDetails}>
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
                          {order.details.items.products.map((product) => (
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
                                  數量: {product.quantity} | 單價: NT${" "}
                                  {product.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 活動區塊 */}
                  {order.details.items.activities &&
                    order.details.items.activities.length > 0 && (
                      <div className={styles.orderSection}>
                        <div className={`${styles.orderType} ${styles.events}`}>
                          {getTypeLabel("activity")}
                        </div>
                        <div className={styles.orderItems}>
                          {order.details.items.activities.map((activity) => (
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
                                  日期: {activity.date} | 時間: {activity.time}{" "}
                                  | 人數: {activity.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
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
                          {order.details.items.rentals.map((rental) => (
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
                                  租借期間: {rental.startDate} 至{" "}
                                  {rental.endDate}
                                </p>
                                <p className={styles.orderDescription}>
                                  數量: {rental.quantity} | 租金: NT${" "}
                                  {rental.rentalFee} | 押金: NT${" "}
                                  {rental.deposit}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* 下方按鈕 */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.orderButton}
                  onClick={() => handleViewDetails(order.id)}
                >
                  {expandedOrderId === order.id ? "收合" : "查看詳情"}
                </button>
                <div className={styles.tooltipContainer}>
                  <button
                    className={`${styles.orderButton} ${
                      order.isRated ? styles.disabledButton : ""
                    }`}
                    onClick={() => handleRateOrder(order.id)}
                    disabled={order.isRated}
                  >
                    {order.isRated ? "已評價" : "評價訂單"}
                  </button>
                  {!order.isRated && (
                    <span className={styles.tooltipText}>評價可得點數！</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
