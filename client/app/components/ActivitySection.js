"use client";

import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Parallax, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/parallax";
import "swiper/css/pagination";
import styles from "./ActivitySection.module.css";
import axios from "axios";
import Link from "next/link";

const ActivitySection = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const swiperRef = useRef(null);

  // 從後端獲取活動資料
  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";

    const fetchActivities = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`
        );
        if (response.data.status === "success" && Array.isArray(response.data.data)) {
          setActivities(response.data.data.slice(0, 3)); // 只取前3個活動
        } else {
          throw new Error("Invalid data format from backend");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setActivities([
          {
            id: 1,
            name: "日本・沖繩｜青洞浮潛",
            price: 1420,
            main_image: "activity1.jpg",
            description: "探索神秘的青洞，與魚群共游。",
          },
          {
            id: 2,
            name: "日本・沖繩｜海底洞穴",
            price: 2600,
            main_image: "activity2.jpg",
            description: "潛入海底洞穴，發現隱藏的美景。",
          },
          {
            id: 3,
            name: "台灣小琉球｜海底派對",
            price: 2000,
            main_image: "activity3.jpg",
            description: "參加海底派對，與海洋生物共舞。",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // 滑鼠滾輪控制
  useEffect(() => {
    const handleWheel = (e) => {
      if (swiperRef.current && swiperRef.current.swiper) {
        e.preventDefault();
        const swiper = swiperRef.current.swiper;

        // 如果在第一頁且往上滾動，則回到上一個 section
        if (swiper.activeIndex === 0 && e.deltaY < 0) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // 如果在最後一頁且往下滾動，則進入下一個 section
        if (swiper.activeIndex === activities.length - 1 && e.deltaY > 0 && showMoreButton) {
          window.location.href = "/activity";
          return;
        }

        // 正常滾動
        if (e.deltaY > 0) {
          swiper.slideNext();
        } else if (e.deltaY < 0) {
          swiper.slidePrev();
        }
      }
    };

    const swiperContainer = swiperRef.current?.el;
    if (swiperContainer) {
      swiperContainer.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (swiperContainer) {
        swiperContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, [showMoreButton, activities.length]);

  // 監聽 Swiper 索引變化
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.on("slideChange", () => {
        const activeIndex = swiperRef.current.swiper.activeIndex;
        if (activeIndex === activities.length - 1) {
          setShowMoreButton(true); // 顯示氣泡按鈕
        } else {
          setShowMoreButton(false);
        }
      });
    }
  }, [activities.length]);

  // 圖片路徑處理
  const getImagePath = (item) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.id || !item.main_image) return defaultImage;
    return `/image/activity/${item.id}/${encodeURIComponent(item.main_image)}`;
  };

  if (loading) {
    return <div className={styles.loading}>加載中...</div>;
  }

  return (
    <section className={styles.activitySection}>
      <Swiper
        ref={swiperRef}
        direction="vertical"
        speed={1200}
        slidesPerView={1}
        parallax={true}
        mousewheel={{
          releaseOnEdges: false,
          forceToAxis: true,
          sensitivity: 1,
        }}
        pagination={{ clickable: true }}
        modules={[Mousewheel, Parallax, Pagination]}
        className={styles.swiperContainer}
      >
        {/* 背景圖片 */}
        <div
          slot="container-start"
          className={styles.parallaxBg}
          style={{ backgroundImage: "url(/image/activity.jpg)" }}
          data-swiper-parallax="-50%"
        ></div>

        {/* 活動資訊 */}
        {activities.map((activity, index) => (
          <SwiperSlide key={index} className={styles.slide}>
            <div className={styles.content} data-swiper-parallax="-200">
              <img src={getImagePath(activity)} alt={activity.name} className={styles.activityImage} />
              <h2>{activity.name}</h2>
              <p className={styles.price}>價格: NT${activity.price}</p>
            </div>
          </SwiperSlide>
        ))}

        {/* 氣泡按鈕 */}
        {showMoreButton && (
          <Link href="/activity" className={`${styles.moreButton} ${showMoreButton ? "visible" : ""}`}>
            查看更多
          </Link>
        )}
      </Swiper>
    </section>
  );
};

export default ActivitySection;