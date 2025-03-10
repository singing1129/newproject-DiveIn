"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import styles from "./HeroSection.module.css";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const HeroSection = ({ scrollToSection }) => { // 恢復 scrollToSection 參數
  const textRef = useRef(null);
  const arrowRef = useRef(null);
  const jellyfishRef = useRef(null);
  const bottomTextRef = useRef(null);
  const videoRef = useRef(null); // 添加 videoRef
  const [bubbles, setBubbles] = useState([]);
  const [bubbleAnimation, setBubbleAnimation] = useState(null);
  const [jellyfishAnimation, setJellyfishAnimation] = useState(null);
  const [jellyfishInfo, setJellyfishInfo] = useState(
    "歡迎來到DiveIn，深海旅程的第一站"
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [isInfoActive, setIsInfoActive] = useState(false);

  const diveFacts = [
    "潛水時耳朵壓力變化是因為水壓增加，每下潛10公尺壓力增加1大氣壓。",
    "潛水時，你可以聽到自己的呼吸聲，這是與海洋親密對話的時刻。",
    "深海中的熱液噴口能噴出高達400°C的熱水，卻孕育了獨特的生命形式。",
    "浮潛和深潛的區別在於深度，但都能讓你感受到海洋的多樣魅力。",
    "潛水裝備中的調節器是你的生命線，將壓縮空氣轉化為可呼吸的氣流。",
    "海底的沉船不僅是歷史的遺跡，還成為了魚類和珊瑚的新家園。",
    "潛入水下時，色彩會隨著深度逐漸消失，紅色最先被海水吸收。",
    "章魚能瞬間改變顏色，潛水時有機會目睹這場自然界的偽裝秀。",
    "潛水前的減壓訓練至關重要，避免因壓力變化引發潛水病。",
    "海流可能成為潛水者的挑戰，但熟練者能利用它輕鬆探索海底。",
    "世界上最深的潛水紀錄超過300公尺，挑戰了人類的生理極限。",
    "海水中的浮力讓你感覺無重力，這是潛水獨特的魅力。",
    "珊瑚礁是海洋的熱帶雨林，孕育了25%的海洋生物。",
    "潛水時需注意氮醉，深度超過30公尺可能導致意識模糊。",
    "海洋佔地球表面的71%，但人類僅探索了不到5%。",
    "海龜可以潛入水中長達5小時而不需要呼吸。",
    "鯊魚的嗅覺非常靈敏，可以偵測到1公里外的血液。",
    "水母已經存在超過5億年，比恐龍還古老。",
    "海豚可以潛入水下300公尺深處。",
    "藍鯨是地球上最大的動物，體重可達200噸。",
  ];

  // 預載動畫數據
  useEffect(() => {
    fetch("/json/bubble.json")
      .then((res) => res.json())
      .then((data) => setBubbleAnimation(data))
      .catch((error) => console.error("載入氣泡動畫失敗:", error));

    fetch("/json/jellyfish.json")
      .then((res) => res.json())
      .then((data) => setJellyfishAnimation(data))
      .catch((error) => console.error("載入水母動畫失敗:", error));
  }, []);

  // 初始顯示水母資訊
  useEffect(() => {
    gsap.set(`.${styles.jellyfishInfo}`, { opacity: 1 });
  }, []);

  // 影片自動播放
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch((error) => console.error("影片自動播放失敗:", error));
      video.addEventListener("error", (e) => console.error("影片載入錯誤:", e));
    }
  }, []);

  // 每10秒自動更換水母資訊（啟動後）
  useEffect(() => {
    if (!isInfoActive) return;

    const interval = setInterval(() => {
      const randomFact = diveFacts[Math.floor(Math.random() * diveFacts.length)];
      setJellyfishInfo(randomFact);
      gsap.fromTo(
        `.${styles.jellyfishInfo}`,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }, 10000);
    return () => clearInterval(interval);
  }, [isInfoActive]);

  // 滑鼠移動文字
  useEffect(() => {
    const text = textRef.current;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 50;
      const y = (e.clientY / window.innerHeight - 0.5) * 50;
      gsap.to(text, { x, y, duration: 0.5 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 水母跟隨滑鼠與路徑氣泡
  useEffect(() => {
    if (!jellyfishRef.current || !jellyfishAnimation) return;

    const jellyfishEl = jellyfishRef.current;
    const rect = jellyfishEl.getBoundingClientRect();
    const offsetX = 50;
    const offsetY = 50;

    const initX = window.innerWidth - rect.width - offsetX;
    const initY = window.innerHeight - rect.height - offsetY;
    gsap.set(jellyfishEl, { x: initX, y: initY });

    if (!isFollowing) return;

    const handleMouseMove = (e) => {
      const targetX = e.clientX + offsetX;
      const targetY = e.clientY + offsetY;
      const constrainedX = Math.max(0, Math.min(targetX, window.innerWidth - rect.width));
      const constrainedY = Math.max(0, Math.min(targetY, window.innerHeight - rect.height));

      gsap.to(jellyfishEl, {
        x: constrainedX,
        y: constrainedY,
        duration: 0.3,
        ease: "power1.out",
      });

      if (bubbleAnimation && Math.random() > 0.7) {
        const bubbleId = `bubble-path-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newBubble = {
          id: bubbleId,
          x: e.clientX + offsetX,
          y: e.clientY + offsetY,
          scale: Math.random() * 0.8 + 0.8,
        };
        setBubbles((prev) => [...prev, newBubble]);
        setTimeout(() => { // 延遲確保 DOM 更新
          const bubbleEl = document.getElementById(bubbleId);
          if (bubbleEl) {
            gsap.to(bubbleEl, {
              y: -window.innerHeight,
              duration: 5,
              ease: "power1.out",
              onComplete: () => setBubbles((prev) => prev.filter((b) => b.id !== bubbleId)),
            });
          }
        }, 50);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [jellyfishAnimation, bubbleAnimation, isFollowing]);

  // 點擊螢幕手動切換水母資訊
  useEffect(() => {
    const handleClick = (e) => {
      if (!isInfoActive) return; // 僅在啟動後生效
      const randomFact = diveFacts[Math.floor(Math.random() * diveFacts.length)];
      setJellyfishInfo(randomFact);
      gsap.fromTo(
        `.${styles.jellyfishInfo}`,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    };

    const heroSection = document.querySelector(`.${styles.heroSection}`);
    if (heroSection) {
      heroSection.addEventListener("click", handleClick);
    }

    return () => {
      if (heroSection) {
        heroSection.removeEventListener("click", handleClick);
      }
    };
  }, [isInfoActive]);

  // 箭頭與底部文字動畫
  useEffect(() => {
    const arrow = arrowRef.current;
    const bottomText = bottomTextRef.current;
    gsap.to([arrow, bottomText], {
      y: 20,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "power1.inOut",
    });
  }, []);

  // 點擊水母啟動跟隨和資訊播放
  const handleJellyfishClick = (e) => {
    e.stopPropagation();
    setIsFollowing(true);
    setIsInfoActive(true);
    gsap.to(`.${styles.jellyfishInfo}`, {
      y: -5,
      repeat: -1,
      yoyo: true,
      duration: 1,
      ease: "sine.inOut",
    });
  };

  return (
    <div className={styles.heroSection}>
      <div className={styles.videoBackground}>
        <video ref={videoRef} autoPlay loop muted playsInline>
          <source src="/mp4/home-sec1.mp4" type="video/mp4" />
          您的瀏覽器不支援影片播放。
        </video>
      </div>

      <div className={styles.overlay} />

      {jellyfishAnimation && (
        <div
          ref={jellyfishRef}
          className={styles.jellyfish}
          onClick={handleJellyfishClick}
        >
          <Lottie animationData={jellyfishAnimation} loop={true} autoplay={true} />
          <div className={styles.jellyfishInfo}>{jellyfishInfo}</div>
        </div>
      )}

      {bubbleAnimation &&
        bubbles.map((bubble) => (
          <div
            key={bubble.id}
            id={bubble.id}
            className={styles.localBubble} // 更新為 localBubble 以匹配最新 CSS
            style={{
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              transform: `scale(${bubble.scale})`,
            }}
          >
            <Lottie animationData={bubbleAnimation} loop={true} autoplay={true} />
          </div>
        ))}

      <div ref={textRef} className={styles.heroText}>
        <h1>探索無重力的寧靜與神秘</h1>
        <p>“It's not just diving; it's a new way of life.”</p>
      </div>

      <div ref={bottomTextRef} className={styles.bottomText}>
        即刻啟程
      </div>

      <div
        ref={arrowRef}
        className={styles.scrollArrow}
        onClick={scrollToSection} // 恢復點擊箭頭滾動功能
      >
        <svg width="30" height="45" viewBox="0 0 40 60" fill="none" stroke="white" strokeWidth="2">
          <path d="M10 15 L20 25 L30 15" strokeWidth="3" />
          <path d="M12 30 L20 40 L28 30" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;