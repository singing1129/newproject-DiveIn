import React, { useState } from "react";
import styles from "./Orders.module.css";

export default function OrdersContent() {
  // 頁簽狀態
  const [activeTab, setActiveTab] = useState("products");

  // 假設從後端獲取的訂單資料
  const orders = {
    products: [
      {
        id: 1,
        image: "/image/product1.jpg",
        title: "商品 1",
        description: "這是商品 1 的描述",
        status: "已出貨",
      },
      {
        id: 2,
        image: "/image/product2.jpg",
        title: "商品 2",
        description: "這是商品 2 的描述",
        status: "處理中",
      },
    ],
    rentals: [
      {
        id: 1,
        image: "/image/rental1.jpg",
        title: "租借商品 1",
        description: "這是租借商品 1 的描述",
        status: "已完成",
      },
    ],
    events: [
      {
        id: 1,
        image: "/image/event1.jpg",
        title: "活動 1",
        description: "這是活動 1 的描述",
        status: "已報名",
      },
    ],
  };

  return (
    <div className={styles.ordersContent}>
      {/* 頁簽按鈕 */}
      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabButton} ${activeTab === "products" ? styles.active : ""}`}
          onClick={() => setActiveTab("products")}
        >
          商品
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "rentals" ? styles.active : ""}`}
          onClick={() => setActiveTab("rentals")}
        >
          租借
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "events" ? styles.active : ""}`}
          onClick={() => setActiveTab("events")}
        >
          活動
        </button>
      </div>

      {/* 頁簽內容 */}
      <div className={styles.tabContent}>
        {activeTab === "products" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {orders.products.map((item) => (
                <div key={item.id} className={styles.card}>
                  <img src={item.image} alt={item.title} className={styles.cardImage} />
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <p className={styles.cardStatus}>狀態: {item.status}</p>
                    <button className={styles.cardButton}>查看詳情</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "rentals" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {orders.rentals.map((item) => (
                <div key={item.id} className={styles.card}>
                  <img src={item.image} alt={item.title} className={styles.cardImage} />
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <p className={styles.cardStatus}>狀態: {item.status}</p>
                    <button className={styles.cardButton}>查看詳情</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "events" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {orders.events.map((item) => (
                <div key={item.id} className={styles.card}>
                  <img src={item.image} alt={item.title} className={styles.cardImage} />
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <p className={styles.cardStatus}>狀態: {item.status}</p>
                    <button className={styles.cardButton}>查看詳情</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}