"use client";

import React from "react";
import { useParams } from "next/navigation";

import styles from "./Card.module.css";
import { FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";

const Card = ({ item }) => {
  if (!item) {
    return <div>沒有資料</div>; // 處理 item 為空的情況
  }

  // 根據商品、活動、租借類別動態生成圖片路徑
  const getImagePath = (item) => {
    // 如果沒有圖片，使用預設圖片
    const defaultImage = "/image/rent/no-img.png";

    if (item.category === "activity") {
      return item.main_image
        ? `/image/activity/${item.id}/${encodeURIComponent(item.main_image)}`
        : defaultImage;
    } else if (item.category === "product") {
      return item.image_url
        ? `/image/product/${item.id}/${item.image_url}`
        : defaultImage;
    } else if (item.category === "rent") {
      return item.image_url
        ? `/image/rent/${item.id}/${item.image_url}`
        : defaultImage;
    }
    return defaultImage; 
  };

  console.log("Item:", item);
  console.log("Image Path:", getImagePath(item));

  return (
    <div className={styles.card}>
      <div className={styles.imgContainer}>
        {/* 愛心和購物車按鈕 */}
        <div className={styles.circleIcons}>
          <button className={styles.circleIcon}>
            <FaRegHeart />
          </button>
          <button className={styles.circleIcon}>
            <FiShoppingCart />
          </button>
        </div>
        {/* 星級評分 */}
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) =>
            i < 4 ? <FaStar key={i} /> : <FaRegStar key={i} />
          )}
        </div>
        {/* 商品圖片 */}
        <img
          className={styles.img}
          src={getImagePath(item)} // 使用動態生成的圖片路徑
          alt={item.name}
        />
      </div>
      {/* 商品名稱和價格 */}
      <div className={`text-center ${styles.title}`}>
        <p className="m-0">{item.name}</p>
        <h6 className="m-0">NT ${item.price}</h6>
      </div>
    </div>
  );
};

export default Card;
