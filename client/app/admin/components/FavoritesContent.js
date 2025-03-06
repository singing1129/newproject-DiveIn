"use client";
import { useState, useEffect } from "react";
import styles from "./Favorites.module.css";
import axios from "axios";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import useFavorite from "@/hooks/useFavorite";
import Link from "next/link";
import useToast from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

// 創建一個獨立的商品卡片組件
const FavoriteCard = ({ item, itemType, onRemove }) => {
  // 根據不同類型獲取正確的 ID
  const getItemId = () => {
    switch (itemType) {
      case "product":
        return item.product_id;
      case "bundle":
        return item.bundle_id;
      case "rental":
        return item.rental_id;
      case "activity":
        return item.activity_id;
      default:
        return null;
    }
  };

  const itemId = getItemId();
  const { showToast } = useToast();
  const [removed, setRemoved] = useState(false);

  // 直接使用 axios 來處理收藏移除，而不是使用 useFavorite
  const handleRemoveFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = localStorage.getItem("loginWithToken");
      if (!token) return;

      const response = await axios.post(
        "http://localhost:3005/api/favorites/remove",
        {
          type: itemType === "bundle" ? "bundle" : itemType.replace(/s$/, ""), // 移除複數形式的 s
          itemIds: [itemId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setRemoved(true);
        showToast("已從收藏移除", { style: { backgroundColor: "red" } });
        onRemove(itemType, item.id);
      }
    } catch (error) {
      console.error("移除收藏失敗:", error);
      showToast("移除收藏失敗，請稍後再試", {
        style: { backgroundColor: "red" },
      });
    }
  };

  if (removed) {
    return null;
  }

  // 根據不同類型獲取正確的圖片路徑
  const getImageUrl = () => {
    if (!item.image_url) return "/default-image.jpg";

    switch (itemType) {
      case "product":
        return item.image_url.startsWith("/")
          ? `/image/product${item.image_url}`
          : `/image/product/${item.image_url}`;
      case "activity":
        return item.image_url.startsWith("/")
          ? item.image_url
          : `/image/activity/${item.activity_id}/${item.image_url}`;
      case "rental":
      case "bundle":
        return item.image_url;
      default:
        return "/default-image.jpg";
    }
  };

  // 根據不同類型獲取正確的連結路徑
  const getLinkUrl = () => {
    switch (itemType) {
      case "product":
        return `/products/${item.product_id}`;
      case "bundle":
        return `/products/bundle/${item.bundle_id}`;
      case "rental":
        return `/rental/${item.rental_id}`;
      case "activity":
        return `/activity/${item.activity_id}`;
      default:
        return "#";
    }
  };

  return (
    <div className={styles.card}>
      <Link href={getLinkUrl()}>
        <div className={styles.productImg}>
          <img
            src={getImageUrl()}
            alt={item.name}
            className={styles.cardImage}
          />
        </div>
        <div className={styles.cardContent}>
          {itemType === "bundle" && (
            <div className={styles.bundleTag}>套裝商品</div>
          )}
          <h3 className={styles.cardTitle}>{item.name}</h3>
          <p className={styles.cardDescription}>NT$ {item.price}</p>
        </div>
      </Link>
      <button className={styles.favoriteButton} onClick={handleRemoveFavorite}>
        <AiFillHeart color="red" size={24} />
      </button>
    </div>
  );
};

export default function FavoritesContent() {
  const [activeTab, setActiveTab] = useState("products");
  const [favorites, setFavorites] = useState({
    product: [],
    activity: [],
    rental: [],
    bundle: [],
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user && user !== -1) {
      fetchFavorites();
    }
  }, [user]);

  const token = localStorage.getItem("loginWithToken");

  const fetchFavorites = async () => {
    try {
      const response = await axios.get("http://localhost:3005/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (error) {
      console.error("取得收藏資料失敗:", error);
    }
  };

  // 處理移除收藏項目
  const handleRemoveFavorite = (type, id) => {
    setFavorites((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  return (
    <div className={styles.favoritesContent}>
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
            activeTab === "activities" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("activities")}
        >
          活動
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "products" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {favorites.product?.map((item) => (
                <FavoriteCard
                  key={`product-${item.id}`}
                  item={item}
                  itemType="product"
                  onRemove={handleRemoveFavorite}
                />
              ))}
              {favorites.bundle?.map((item) => (
                <FavoriteCard
                  key={`bundle-${item.id}`}
                  item={item}
                  itemType="bundle"
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "rentals" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {favorites.rental?.map((item) => (
                <FavoriteCard
                  key={`rental-${item.id}`}
                  item={item}
                  itemType="rental"
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "activities" && (
          <section className={styles.section}>
            <div className={styles.cardContainer}>
              {favorites.activity?.map((item) => (
                <FavoriteCard
                  key={`activity-${item.id}`}
                  item={item}
                  itemType="activity"
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
