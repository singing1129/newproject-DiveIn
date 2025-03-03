import React from "react";
import styles from "./Orders.module.css";

export default function OrdersContent() {
  const orders = [
    {
      id: 1,
      status: "已完成", // 訂單狀態
      products: [
        {
          id: 1,
          image: "/image/product1.jpg",
          title: "商品 1",
          description: "這是商品 1 的描述",
        },
        {
          id: 2,
          image: "/image/product2.jpg",
          title: "商品 2",
          description: "這是商品 2 的描述",
        },
      ],
      rentals: [
        {
          id: 1,
          image: "/image/rental1.jpg",
          title: "租借商品 1",
          description: "這是租借商品 1 的描述",
        },
      ],
      events: [
        {
          id: 1,
          image: "/image/event1.jpg",
          title: "活動 1",
          description: "這是活動 1 的描述",
        },
      ],
    },
    {
      id: 2,
      status: "處理中", // 訂單狀態
      products: [],
      rentals: [
        {
          id: 2,
          image: "/image/rental2.jpg",
          title: "租借商品 2",
          description: "這是租借商品 2 的描述",
        },
      ],
      events: [],
    },
  ];

  // 根據訂單類型顯示對應的標籤
  const getTypeLabel = (type) => {
    switch (type) {
      case "products":
        return "商品";
      case "rentals":
        return "租借";
      case "events":
        return "活動";
      default:
        return "";
    }
  };

  // 處理評價按鈕點擊
  const handleRateOrder = (orderId) => {
    // 這裡可以發送評價請求到後端
    alert(`評價訂單 #${orderId}`);
    // 更新訂單評價狀態
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, isRated: true } : order
    );
    // 這裡可以將更新後的訂單狀態保存到後端或狀態管理工具
  };

  return (
    <div className={styles.ordersContent}>
      {/* 訂單列表 */}
      <div className={styles.orderList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            {/* 訂單標題 */}
            <div className={styles.orderHeader}>
              <h3 className={styles.orderId}>訂單 #{order.id}</h3>
              <p className={styles.orderStatus}>狀態: {order.status}</p>
            </div>

            {/* 商品區塊 */}
            {order.products.length > 0 && (
              <div className={styles.orderSection}>
                <div className={`${styles.orderType} ${styles.products}`}>
                  {getTypeLabel("products")}
                </div>
                <div className={styles.orderItems}>
                  {order.products.map((product) => (
                    <div key={product.id} className={styles.orderItem}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className={styles.orderImage}
                      />
                      <div className={styles.orderDetails}>
                        <h4 className={styles.orderTitle}>{product.title}</h4>
                        <p className={styles.orderDescription}>
                          {product.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 租借區塊 */}
            {order.rentals.length > 0 && (
              <div className={styles.orderSection}>
                <div className={`${styles.orderType} ${styles.rentals}`}>
                  {getTypeLabel("rentals")}
                </div>
                <div className={styles.orderItems}>
                  {order.rentals.map((rental) => (
                    <div key={rental.id} className={styles.orderItem}>
                      <img
                        src={rental.image}
                        alt={rental.title}
                        className={styles.orderImage}
                      />
                      <div className={styles.orderDetails}>
                        <h4 className={styles.orderTitle}>{rental.title}</h4>
                        <p className={styles.orderDescription}>
                          {rental.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 活動區塊 */}
            {order.events.length > 0 && (
              <div className={styles.orderSection}>
                <div className={`${styles.orderType} ${styles.events}`}>
                  {getTypeLabel("events")}
                </div>
                <div className={styles.orderItems}>
                  {order.events.map((event) => (
                    <div key={event.id} className={styles.orderItem}>
                      <img
                        src={event.image}
                        alt={event.title}
                        className={styles.orderImage}
                      />
                      <div className={styles.orderDetails}>
                        <h4 className={styles.orderTitle}>{event.title}</h4>
                        <p className={styles.orderDescription}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 下方按鈕 */}
            <div className={styles.buttonGroup}>
              <button className={styles.orderButton}>查看詳情</button>
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
        ))}
      </div>
    </div>
  );
}
