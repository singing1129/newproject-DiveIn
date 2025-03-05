"use client";
import { useState, useEffect } from "react";
import styles from "./Favorites.module.css";
import axios from "axios";

export default function FavoritesContent() {
  const [activeTab, setActiveTab] = useState("products");
  const [favorites, setFavorites] = useState();
  // 假設從後端獲取的收藏資料

  useEffect(() => {
    fetchFavorites();
  }, []);
  const token = localStorage.getItem("loginWithToken");
  const fetchFavorites = async () => {
    try {
      const response = await axios.get("http://localhost:3005/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFavorites(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error("取得收藏資料失敗:", error);
    }
  };

  return (
    <div className={styles.favoritesContent}>
      {/* 頁簽按鈕 */}
      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "products" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("products")}
        >
          商品
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "rentals" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("rentals")}
        >
          租借
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "activit" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("activities")}
        >
          活動
        </button>
      </div>

      {/* 頁簽內容 */}
      <div className={styles.tabContent}>
        {activeTab === "products" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {product &&
                product.map((item) => (
                  <div key={item.id} className={styles.card}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      <p className={styles.cardDescription}>{item.price}</p>
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
              {rental &&
                rental.map((item) => (
                  <div key={item.id} className={styles.card}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      <p className={styles.cardDescription}>{item.price}</p>
                      <button className={styles.cardButton}>查看詳情</button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeTab === "activity" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {activity &&
                activity.map((item) => (
                  <div key={item.id} className={styles.card}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      <p className={styles.cardDescription}>{item.price}</p>
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
