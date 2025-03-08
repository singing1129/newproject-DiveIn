"use client";

import React, { useEffect, useRef, useState } from "react";
import HeroSection from "../components/HeroSection";
import MainSection from "../components/MainSection"; // 改名為 MainSection
// import WelcomeSection from "../components/WelcomeSection"; // 新增 WelcomeSection
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const sectionsRef = useRef([]);
  const homePageRef = useRef(null);
  const [bubbles, setBubbles] = useState([]);
  const [bubbleAnimation, setBubbleAnimation] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // 滾動到指定區塊
  const scrollToSection = (index) => {
    if (index >= 0 && index < sectionsRef.current.length && !isScrolling) {
      setIsScrolling(true);
      sectionsRef.current[index].scrollIntoView({ behavior: "smooth" });
      setCurrentSection(index);
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  // 動畫工具函數
  const animateFromBottom = (element, delay = 0) => {
    gsap.fromTo(
      element,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out", delay }
    );
  };

  // 預載 bubble.json
  useEffect(() => {
    fetch("/json/bubble.json")
      .then((res) => res.json())
      .then((data) => setBubbleAnimation(data))
      .catch((error) => console.error("載入氣泡動畫失敗:", error));
  }, []);

  // 全局氣泡動態生成
  useEffect(() => {
    if (!bubbleAnimation) return;

    const generateBubble = () => {
      const size = 50 + Math.random() * 150; // 更大範圍 50-200px
      const x = Math.max(
        size / 2,
        Math.min(Math.random() * window.innerWidth, window.innerWidth - size / 2)
      );
      const bubbleId = `bubble-global-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newBubble = {
        id: bubbleId,
        x,
        y: window.innerHeight, // 從底部開始
        size,
      };

      setBubbles((prev) => (prev.length > 20 ? prev : [...prev, newBubble])); // 限制最多 20 個

      setTimeout(() => {
        const bubbleEl = document.getElementById(bubbleId);
        if (bubbleEl) {
          gsap.fromTo(
            bubbleEl,
            { opacity: 1 }, // 更明顯的初始透明度
            {
              y: -window.innerHeight,
              opacity: 0,
              duration: 5 + Math.random() * 3, // 減慢漂浮速度 5-8 秒
              ease: "power1.out",
              onComplete: () => setBubbles((prev) => prev.filter((b) => b.id !== bubbleId)),
            }
          );
        }
      }, 50); // 延遲確保 DOM 更新
    };

    const interval = setInterval(() => {
      generateBubble();
    }, 1000 + Math.random() * 2000); // 隨機間隔 1-3 秒

    return () => clearInterval(interval);
  }, [bubbleAnimation]);

  // 處理滾輪事件（確保子層優先）
  useEffect(() => {
    const handleWheel = (event) => {
      if (event.defaultPrevented) return; // 如果子層已阻止，則不處理
      if (isScrolling) return;

      const delta = event.deltaY;
      let nextSection = currentSection;

      if (delta > 0) {
        nextSection = currentSection + 1;
      } else if (delta < 0) {
        nextSection = currentSection - 1;
      }

      scrollToSection(nextSection);
    };

    const homePage = homePageRef.current;
    if (homePage) {
      homePage.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (homePage) {
        homePage.removeEventListener("wheel", handleWheel);
      }
    };
  }, [currentSection, isScrolling]);

  // 初始化區塊動畫
  useEffect(() => {
    sectionsRef.current.forEach((section, index) => {
      if (index > 0) {
        ScrollTrigger.create({
          trigger: section,
          start: "top 80%",
          onEnter: () => animateFromBottom(section.querySelector("section"), index * 0.2),
        });
      }
    });
  }, []);

  return (
    <div ref={homePageRef} className={styles.homePage}>
      {/* 全局氣泡 */}
      {bubbleAnimation &&
        bubbles.map((bubble) => (
          <div
            key={bubble.id}
            id={bubble.id}
            className={styles.globalBubble}
            style={{
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              width: `${bubble.size}px`, // 統一寬高
              height: `${bubble.size}px`,
            }}
          >
            <Lottie animationData={bubbleAnimation} loop={true} autoplay={true} />
          </div>
        ))}

      {/* 主視覺區 */}
      <div ref={(el) => (sectionsRef.current[0] = el)} className={styles.section}>
        <HeroSection scrollToSection={() => scrollToSection(1)} />
      </div>

      {/* 主要內容區 */}
      <div ref={(el) => (sectionsRef.current[1] = el)} className={styles.section}>
        <MainSection scrollToSection={() => scrollToSection(2)} />
      </div>

      {/* 歡迎區 */}
      {/* <div ref={(el) => (sectionsRef.current[2] = el)} className={styles.section}>
        <WelcomeSection />
      </div> */}
    </div>
  );
};

export default HomePage;