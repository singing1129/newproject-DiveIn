"use client";

import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Parallax, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/parallax";
import "swiper/css/pagination";
import styles from "./MainSection.module.css";
import axios from "axios";
import Link from "next/link";

const MainSection = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);

  // 獲取活動數據
  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";
    const fetchActivities = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`
        );
        if (response.data.status === "success" && Array.isArray(response.data.data)) {
          setActivities(response.data.data.slice(0, 4));
          console.log("Activities loaded:", response.data.data.slice(0, 4));
        } else {
          throw new Error("Invalid data format from backend");
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // 隨機設置卡片位置
  useEffect(() => {
    if (!loading && activities.length > 0) {
      const bubbles = document.querySelectorAll(`.${styles.bubble}`);
      const container = document.querySelector(`.${styles.bubbleContainer}`);
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      console.log("Bubble container size:", containerWidth, "x", containerHeight);

      bubbles.forEach((bubble, index) => {
        const bubbleSize = 220;
        const randomTop = Math.random() * (containerHeight - bubbleSize);
        const randomLeft = Math.random() * (containerWidth - bubbleSize);
        bubble.style.top = `${randomTop}px`;
        bubble.style.left = `${randomLeft}px`;
        console.log(`Bubble ${index}: top=${randomTop}px, left=${randomLeft}px`);
      });
    }
  }, [activities, loading]);

  // 初始化 Swiper 並綁定事件
  const handleSwiperInit = (swiper) => {
    console.log("Swiper initialized:", swiper);
    setSwiperInstance(swiper);
  };

  // 自定義滾輪事件處理
  useEffect(() => {
    if (!swiperInstance) {
      console.log("Swiper instance not ready yet");
      return;
    }

    console.log("Swiper instance ready, binding wheel event");

    const handleWheel = (e) => {
      const activeIndex = swiperInstance.activeIndex;
      console.log("Wheel event triggered - activeIndex:", activeIndex, "deltaY:", e.deltaY, "visibleCards:", visibleCards);

      // 在 Swiper 內部處理時阻止默認滾動
      if (activeIndex > 0 || (activeIndex === 0 && visibleCards > 0)) {
        e.preventDefault();
      }

      if (activeIndex === 0) {
        if (e.deltaY > 0) {
          // 向下滾動
          if (visibleCards < activities.length) {
            setVisibleCards((prev) => {
              console.log("Visible cards increased to:", prev + 1);
              return prev + 1;
            });
          } else {
            console.log("All cards visible, sliding to next");
            swiperInstance.slideNext();
          }
        } else if (e.deltaY < 0 && visibleCards > 0) {
          // 向上滾動，減少可見卡片
          setVisibleCards((prev) => {
            console.log("Visible cards decreased to:", prev - 1);
            return prev - 1;
          });
        } else if (e.deltaY < 0 && visibleCards === 0) {
          // 第一頁頂部，允許滾動到影片首頁
          console.log("Attempting to scroll to top of page");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        // 其他頁面
        if (e.deltaY > 0) {
          // 向下滾動
          console.log("Sliding to next page");
          swiperInstance.slideNext();
        } else if (e.deltaY < 0) {
          // 向上滾動，回到上一頁
          console.log("Sliding to previous page");
          swiperInstance.slidePrev();
        }
      }
    };

    const swiperContainer = document.querySelector(`.${styles.swiperContainer}`);
    if (swiperContainer) {
      console.log("Adding wheel event listener to swiper container");
      swiperContainer.addEventListener("wheel", handleWheel, { passive: false });
    } else {
      console.log("Swiper container not found");
    }

    return () => {
      if (swiperContainer) {
        console.log("Removing wheel event listener");
        swiperContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, [swiperInstance, visibleCards, activities.length]);

  // Swiper 切換時重置卡片和更新 showMoreButton
  useEffect(() => {
    if (!swiperInstance) return;

    swiperInstance.on("slideChange", () => {
      const activeIndex = swiperInstance.activeIndex;
      console.log("Slide changed to:", activeIndex);
      setShowMoreButton(activeIndex === 2);
      if (activeIndex !== 0) {
        setVisibleCards(0); // 離開第一頁時重置卡片
      }
    });
  }, [swiperInstance]);

  // 圖片路徑處理
  const getImagePath = (item) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.id || !item.main_image) return defaultImage;
    return `/image/activity/${item.id}/${item.main_image}`;
  };

  // 分割活動名稱和地點
  const splitActivityName = (name) => {
    const parts = name.split("｜");
    return { location: parts[0], activityName: parts[1] };
  };

  if (loading) {
    return <div className={styles.loading}>資料加載中...</div>;
  }

  return (
    <section className={styles.mainSection}>
      <Swiper
        ref={swiperRef}
        direction="vertical"
        speed={1200}
        slidesPerView={1}
        parallax={true}
        pagination={{ clickable: true }}
        modules={[Parallax, Pagination]}
        className={styles.swiperContainer}
        onSwiper={handleSwiperInit}
      >
        <div
          slot="container-start"
          className={styles.parallaxBg}
          style={{ backgroundImage: "url(/image/activity.jpg)" }}
          data-swiper-parallax="-50%"
        ></div>

        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>必試潛水冒險，精彩不容錯過</h2>
            <div className={styles.bubbleContainer}>
              {activities.map((activity, index) => {
                const { activityName, location } = splitActivityName(activity.name);
                return (
                  <Link href={`/activity/${activity.id}`} key={index} className={styles.link}>
                    <div
                      className={`${styles.bubble} ${index < visibleCards ? styles.visible : ''}`}
                      style={{
                        backgroundImage: `url(${getImagePath(activity)})`,
                        animationDelay: `${index * 0.3}s`,
                      }}
                    >
                      <div className={styles.bubbleOverlay}></div>
                      <div className={styles.bubbleContent}>
                        <h3 className={styles.location}>{location}</h3>
                        <p className={styles.activityName}>{activityName}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>推薦商品</h2>
          </div>
        </SwiperSlide>

        <SwiperSlide className={styles.slide}>
          <div className={styles.welcomeContent} data-swiper-parallax="-200">
            <h2>打開你的新視界</h2>
          </div>
        </SwiperSlide>

        {showMoreButton && (
          <Link
            href="/activity"
            className={`${styles.moreButton} ${showMoreButton ? styles.visible : ""}`}
          >
            查看更多
          </Link>
        )}
      </Swiper>
    </section>
  );
};

export default MainSection;