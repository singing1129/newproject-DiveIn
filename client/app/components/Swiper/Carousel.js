"use client"; // 讓 Next.js 確保這個元件只在 Client Side 執行

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css"; // 基本 Swiper 樣式
import "swiper/css/navigation"; // 上一頁/下一頁按鈕
import "swiper/css/pagination"; // 頁面指示點
import "swiper/css/effect-fade"; // 淡入淡出效果
import styles from "./swiper.module.css";

const Carousel = () => {
  const images = [
    "/swiper1.jpg",
    "/swiper2.jpg",
    "/swiper3.jpg",
    "/swiper4.jpg",
  ];

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay, EffectFade]}
      spaceBetween={0}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      loop={true}
      effect="fade" // 添加淡入淡出效果
      className={styles.swiperContainer}
    >
      {images.map((image, index) => (
        <SwiperSlide key={index}>
          <div
            className={styles.slide}
            style={{ backgroundImage: `url(${image})` }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default Carousel;