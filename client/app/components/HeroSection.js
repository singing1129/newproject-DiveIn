"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import styles from "./HeroSection.module.css";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const textRef = useRef(null);
  const [fishes, setFishes] = useState([]);
  const [fishAnimation, setFishAnimation] = useState(null);
  const [info, setInfo] = useState(null);

  // 擴展潛水科普小知識和對應動畫
  const diveFacts = [
    {
      text: "潛水時耳朵壓力變化是因為水壓增加，每下潛10公尺壓力增加1大氣壓。",
      animationUrl: "https://lottie.host/d0f66538-d157-4b39-82cc-1543fb0f80a1/3iHMFvUDBs.json", // 魚
    },
    {
      text: "海水中的浮力讓你感覺無重力，這是潛水獨特的魅力。",
      animationUrl: "https://assets10.lottiefiles.com/packages/lf20_9kP2mN5X.json", // 氣泡
    },
    {
      text: "珊瑚礁是海洋的熱帶雨林，孕育了25%的海洋生物。",
      animationUrl: "https://lottie.host/30f64bab-5eaf-4919-9f03-bcf6d5ccf3f0/Vt5CB5bCcV.json", // 水花
    },
    {
      text: "章魚能改變顏色來融入環境，是潛水時的驚喜發現。",
      animationUrl: "https://lottie.host/79ba4ba7-37eb-42ef-8e19-f08753a8e66c/7Vo8VvOqqP.json", // 氣泡（可替換為章魚動畫）
    },
    {
      text: "潛水員使用的手勢語言可以在水下無聲交流。",
      animationUrl: "https://assets1.lottiefiles.com/packages/lf20_3jM8vK9P.json", // Underwater Bubbles
    },
    {
      text: "海龜可以在水下憋氣長達數小時，潛水時常能遇見。",
      animationUrl: "https://lottie.host/d0f66538-d157-4b39-82cc-1543fb0f80a1/3iHMFvUDBs.json", // 魚（可替換為海龜動畫）
    },
  ];

  useEffect(() => {
    fetch("https://lottie.host/d0f66538-d157-4b39-82cc-1543fb0f80a1/3iHMFvUDBs.json")
      .then((res) => res.json())
      .then((data) => setFishAnimation(data));
  }, []);

  useEffect(() => {
    const text = textRef.current;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 50;
      const y = (e.clientY / window.innerHeight) * 50;
      gsap.to(text, { x, y, duration: 0.5 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 背景點擊生成魚
  const handleBackgroundClick = (e) => {
    // 檢查點擊目標是否為圖標，若是則不生成魚
    if (e.target.closest(`.${styles.diveIcon}`)) return;

    const maxX = window.innerWidth - 150;
    const maxY = window.innerHeight - 150;
    const x = Math.min(Math.max(e.clientX, 75), maxX);
    const y = Math.min(Math.max(e.clientY, 75), maxY);
    const newFish = { id: Date.now(), x, y };
    setFishes((prev) => [...prev, newFish]);
    setTimeout(() => {
      setFishes((prev) => prev.filter((fish) => fish.id !== newFish.id));
    }, 3000);
  };

  useEffect(() => {
    window.addEventListener("click", handleBackgroundClick);
    return () => window.removeEventListener("click", handleBackgroundClick);
  }, []);

  // 點擊圖標顯示資訊
  const handleIconClick = async (e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免觸發背景點擊
    const randomFact = diveFacts[Math.floor(Math.random() * diveFacts.length)];
    const animationData = await fetch(randomFact.animationUrl)
      .then((res) => res.json())
      .catch((error) => console.error("載入動畫失敗:", error));
    setInfo({ text: randomFact.text, animation: animationData });

    // 5秒後隱藏資訊
    setTimeout(() => setInfo(null), 5000);

    // 可愛的動畫效果
    gsap.fromTo(
      `.${styles.infoBubble}`,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  };

  return (
    <div className={styles.heroSection}>
      <div className={styles.videoBackground}>
        <video autoPlay loop muted>
          <source src="/mp4/home-sec1.mp4" type="video/mp4" />
          您的瀏覽器不支援影片播放。
        </video>
      </div>

      <div ref={textRef} className={styles.heroText}>
        <h1>探索無重力的寧靜與神秘</h1>
        <p>“It's not just diving; it's a new way of life.”</p>
      </div>

      {fishes.map((fish) => (
        <div key={fish.id} className={styles.fish} style={{ left: fish.x, top: fish.y }}>
          {fishAnimation && <Lottie animationData={fishAnimation} loop={true} autoplay={true} />}
        </div>
      ))}

      {/* 潛水資訊圖標 */}
      <div className={styles.diveIcon} onClick={handleIconClick}>
        <img src="/image/diving-info.svg" alt="Diving Info" />
      </div>

      {/* 資訊氣泡 */}
      {info && (
        <div className={styles.infoBubble}>
          {info.animation && <Lottie animationData={info.animation} loop={true} autoplay={true} />}
          <p>{info.text}</p>
        </div>
      )}
    </div>
  );
};

export default HeroSection;