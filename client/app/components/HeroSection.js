"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import styles from "./HeroSection.module.css";

// 動態導入 Lottie，並禁用 SSR
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const textRef = useRef(null);
  const arrowRef = useRef(null);
  const [bubbles, setBubbles] = useState([]);
  const [bubbleAnimation, setBubbleAnimation] = useState(null);

  // 潛水資訊
  const diveFacts = [
    "潛水時耳朵壓力變化是因為水壓增加，每下潛10公尺壓力增加1大氣壓。",
    "海水中的浮力讓你感覺無重力，這是潛水獨特的魅力。",
    "珊瑚礁是海洋的熱帶雨林，孕育了25%的海洋生物。",
  ];

  // 預載氣泡動畫數據
  useEffect(() => {
    fetch("https://lottie.host/79ba4ba7-37eb-42ef-8e19-f08753a8e66c/7Vo8VvOqqP.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("氣泡動畫載入成功:", data);
        setBubbleAnimation(data);
      })
      .catch((error) => console.error("載入氣泡動畫失敗:", error));
  }, []);

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

  // 由下而上的氣泡
  useEffect(() => {
    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const newBubble = {
        id: Date.now(),
        x,
        y: window.innerHeight, // 從底部開始
        info: diveFacts[Math.floor(Math.random() * diveFacts.length)], // 隨機資訊
        isHovered: false,
      };
      setBubbles((prev) => [...prev, newBubble]);
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
      }, 10000); // 氣泡存在10秒
    }, 2000); // 每2秒生成一個
    return () => clearInterval(interval);
  }, []);

  // 箭頭動畫
  useEffect(() => {
    const arrow = arrowRef.current;
    gsap.to(arrow, {
      opacity: 0.5,
      y: 20,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "power1.inOut",
    });
  }, []);

  // 滑鼠滑過氣泡時放大並顯示資訊
  const handleBubbleHover = (id, isHovered) => {
    setBubbles((prev) =>
      prev.map((bubble) =>
        bubble.id === id ? { ...bubble, isHovered } : bubble
      )
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

      <div className={styles.overlay} />

      {bubbleAnimation &&
        bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`${styles.bubble} ${bubble.isHovered ? styles.hovered : ""}`}
            style={{ left: bubble.x, top: bubble.y }}
            onMouseEnter={() => handleBubbleHover(bubble.id, true)}
            onMouseLeave={() => handleBubbleHover(bubble.id, false)}
          >
            <Lottie animationData={bubbleAnimation} loop={true} autoplay={true} />
            {bubble.isHovered && (
              <div className={styles.bubbleInfo}>{bubble.info}</div>
            )}
          </div>
        ))}

      <div ref={textRef} className={styles.heroText}>
        <h1>探索無重力的寧靜與神秘</h1>
        <p>“It's not just diving; it's a new way of life.”</p>
      </div>

      <div ref={arrowRef} className={styles.scrollArrow}>
        <svg
          width="40"
          height="60"
          viewBox="0 0 40 60"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <path d="M10 15 L20 25 L30 15" strokeWidth="3" /> {/* 大箭頭 */}
          <path d="M12 30 L20 40 L28 30" strokeWidth="2" /> {/* 中箭頭 */}
          <path d="M14 45 L20 55 L26 45" strokeWidth="1" /> {/* 小箭頭 */}
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;