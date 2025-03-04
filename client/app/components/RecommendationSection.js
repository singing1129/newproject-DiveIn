"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card.js"; // 引入 Card 組件
import styles from "./RecommendationSection.module.css";
import { FaRegHeart, FaShoppingCart, FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";

const RecommendationSection = ({ category, title, buttons }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeButton, setActiveButton] = useState("all");

  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=${category}&type=${activeButton}`
        );
        console.log("Response from backend:", response.data);
        setData(response.data.data); // 設置資料
        setLoading(false); // 停止加載
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false); // 停止加載
      }
    };

    fetchData();
  }, [category, activeButton]);

  if (loading) {
    return <div>加載中...</div>; // 加載中的提示
  }

  return (
    <div className={`container ${styles.section}`}>
      {/* 網站功能大標題 */}
      <h3 className={styles.h3}>{title}</h3>
      <div>
        {/* 功能分類按鈕 */}
        <div className={`d-flex justify-content-center ${styles.btns}`}>
          {buttons.map((button) => (
            <button
              key={button.value}
              className={`${styles.chooseBtn} ${
                activeButton === button.value ? styles.active : ""
              }`}
              onClick={() => setActiveButton(button.value)}
            >
              {button.label}
            </button>
          ))}
        </div>
        {/* 商品卡片列表 */}
        <div className={`d-flex justify-content-between ${styles.cards}`}>
          {data.map((item) => (
            <Card key={item.id} item={item} /> // 使用 Card 組件
          ))}
        </div>
        {/* 查看更多按鈕 */}
        <div className="text-center">
          <a href={category}>
            <button className={styles.scondaryBtn}>查看更多</button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RecommendationSection;