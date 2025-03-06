"use client";
import Link from "next/link";
import Image from "next/image";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import styles from "./products.module.css";
import useFavorite from "@/hooks/useFavorite";
import { useCart } from "@/hooks/cartContext";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";

export default function ProductCard({ product }) {
 
  const API_BASE_URL = "http://localhost:3005/api";
  const type = product.item_type === "bundle" ? "bundle" : "product";
  const {
    isFavorite,
    toggleFavorite,
    loading: favoriteLoading,
  } = useFavorite(product.id, type);
  // console.log("product", product);
  // console.log("product.id", product.id);
  useEffect(() => {
    console.log(`商品 ${product.id} 的收藏狀態: ${isFavorite}`);
  }, [isFavorite, product.id]);

  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();

  const handleCartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 檢查用戶是否已登入
    if (!user || user === -1) {
      alert("請先登入再將商品加入購物車");
      return;
    }

    try {
      // 判斷是否為套組商品
      const isBundle = product.item_type === "bundle";

      // 獲取正確的變體ID (這是關鍵修正)
      let cartData;
      if (isBundle) {
        cartData = {
          type: "bundle",
          bundleId: product.id,
          quantity: 1,
        };
        console.log("cartData", cartData);
      } else {
        console.log("準備獲取產品詳情:", product.id);
        const response = await axios.get(`${API_BASE_URL}/products/${product.id}`);
        console.log("獲取產品詳情成功:", response.data);
  
        const variants = response.data.data.variants || [];
        if (variants.length === 0) {
          alert("此產品沒有可用的變體");
          return;
        }
  
        // 尋找合適的變體 - 優先取第一個非刪除的變體
        const validVariant = variants.find(v => v.isDeleted === 0);
        if (!validVariant) {
          alert("此產品沒有可用的變體");
          return;
        }
  
        console.log("使用的變體:", validVariant.id);
        cartData = {
          type: "product",
          variantId: validVariant.id,
          quantity: 1,
        };
      }
  
      console.log("發送的購物車數據:", cartData);
      const success = await addToCart(cartData);
      if (!success) {
        alert("加入購物車失敗，請稍後再試");
      }
    } catch (error) {
      console.error("加入購物車失敗:", error);
      alert(`加入購物車失敗: ${error.message || "請稍後再試"}`);
    }
  };
  

  // 顯示價格範圍的函數
  const renderPriceRange = () => {
    // 使用 min_price 和 max_price 顯示價格範圍
    const minPrice = product.min_price || product.price;
    const maxPrice = product.max_price;

    // 如果最低價格和最高價格相同，只顯示一個價格
    if (!maxPrice || minPrice === maxPrice) {
      return `NT$${minPrice}`;
    }

    // 否則顯示價格範圍
    return `NT$${minPrice}~NT$${maxPrice}`;
  };

  return (
    <div
      className={`${styles.productItem} ${imageLoaded ? styles.fadeIn : ""}`}
    >
      <Link href={`/products/${product.id}`} className={styles.productLink}>
        <div className={styles.productImg}>
          <Image
            src={
              product.main_image
                ? `/image/product/${product.main_image}`
                : "/image/product/no-img.png"
            }
            alt={product.name || "商品圖片"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: "cover",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in",
            }}
            onLoadingComplete={() => setImageLoaded(true)}
            priority={false}
          />
          <div className={styles.productOverlay}>
            <button
              className={styles.iconButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!favoriteLoading) {
                  toggleFavorite();
                }
              }}
              style={{ border: "none", background: "none" }}
              disabled={favoriteLoading}
            >
              {isFavorite ? (
                <AiFillHeart color="red" size={36} />
              ) : (
                <AiOutlineHeart color="white" size={36} />
              )}
            </button>
            <button
              className="btn btn-primary w-75 mt-2"
              onClick={handleCartClick}
            >
              加入購物車
            </button>
          </div>
        </div>
        <div className={`d-flex justify-content-center ${styles.brandName}`}>
          {product.brand_name || "自由品牌"}
        </div>
        {/* <div className={`d-flex justify-content-center gap-1 my-2`}>
          {product.color && product.color.length > 0 ? (
            product.color.map((color, index) => (
              <div
                key={color.color_id}
                className={styles.saleCircle}
                style={{
                  backgroundColor: color.color_code,
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                }}
                title={color.color_name}
              />
            ))
          ) : (
            <div className={styles.saleCircle} style={{ opacity: 0.3 }} />
          )}
        </div> */}
        <div className={styles.productInfo}>
          {/* <div className={styles.brandName}>
            {product.brand_name || "自由品牌"}
          </div> */}
          <div className={styles.productName}>
            {product.name || "時尚高級派對"}
          </div>
          <div className={styles.salePrice}>{renderPriceRange()}</div>
          <div className={styles.originalPrice}>
            NT${product.original_price}
          </div>
          {/* 如果數量超過六個讓他顯示六個＋... */}
          <div className={`d-flex justify-content-center gap-1 my-2`}>
            {product.color && product.color.length > 0 ? (
              product.color.slice(0, 6).map((color, index) => (
                <div
                  key={color.color_id}
                  className={styles.saleCircle}
                  style={{
                    backgroundColor: color.color_code,
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                  }}
                  title={color.color_name}
                />
              ))
            ) : (
              <div className={styles.saleCircle} style={{ opacity: 0.3 }} />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
