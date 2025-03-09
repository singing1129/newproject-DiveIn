"use client";

import React, { useEffect, useRef, useState } from "react";
import HeroSection from "../components/HeroSection";
import MainSection from "../components/MainSection";
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

  const scrollToSection = (index) => {
    if (index >= 0 && index < sectionsRef.current.length && !isScrolling) {
      console.log("[Debug] scrollToSection called with index:", index, "currentSection:", currentSection);
      setIsScrolling(true);
      const target = sectionsRef.current[index];

      // 強制隱藏 MainSection 以避免中間狀態
      if (index === 0 && sectionsRef.current[1]) {
        sectionsRef.current[1].style.opacity = "0"; // 隱藏 Swiper
      }

      if (index === 0) {
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }

      // 重置 Swiper 的顯示狀態
      setTimeout(() => {
        if (sectionsRef.current[1]) {
          sectionsRef.current[1].style.opacity = "1";
        }
        setIsScrolling(false);
      }, index === 0 ? 0 : 1000); // 即時切換時立即重置，平滑滾動時延遲

      setCurrentSection(index);
    }
  };

  useEffect(() => {
    const handleWheel = (event) => {
      if (event.defaultPrevented) return;
      if (isScrolling) return;

      const delta = event.deltaY;
      let nextSection = currentSection;

      if (delta > 0) {
        nextSection = Math.min(currentSection + 1, sectionsRef.current.length - 1);
      } else if (delta < 0) {
        nextSection = Math.max(currentSection - 1, 0);
      }

      console.log("[Debug] Home Wheel - currentSection:", currentSection, "nextSection:", nextSection, "deltaY:", delta);
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

  useEffect(() => {
    fetch("/json/bubble.json")
      .then((res) => res.json())
      .then((data) => setBubbleAnimation(data))
      .catch((error) => console.error("載入氣泡動畫失敗:", error));
  }, []);

  useEffect(() => {
    if (!bubbleAnimation) return;
    const generateBubble = () => {
      const size = 50 + Math.random() * 150;
      const x = Math.max(size / 2, Math.min(Math.random() * window.innerWidth, window.innerWidth - size / 2));
      const bubbleId = `bubble-global-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newBubble = { id: bubbleId, x, y: window.innerHeight, size };
      setBubbles((prev) => (prev.length > 20 ? prev : [...prev, newBubble]));
      setTimeout(() => {
        const bubbleEl = document.getElementById(bubbleId);
        if (bubbleEl) {
          gsap.fromTo(
            bubbleEl,
            { opacity: 1 },
            {
              y: -window.innerHeight,
              opacity: 0,
              duration: 5 + Math.random() * 3,
              ease: "power1.out",
              onComplete: () => setBubbles((prev) => prev.filter((b) => b.id !== bubbleId)),
            }
          );
        }
      }, 50);
    };
    const interval = setInterval(() => generateBubble(), 1000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [bubbleAnimation]);

  return (
    <div ref={homePageRef} className={styles.homePage}>
      {bubbleAnimation &&
        bubbles.map((bubble) => (
          <div
            key={bubble.id}
            id={bubble.id}
            className={styles.globalBubble}
            style={{ left: `${bubble.x}px`, top: `${bubble.y}px`, width: `${bubble.size}px`, height: `${bubble.size}px` }}
          >
            <Lottie animationData={bubbleAnimation} loop={true} autoplay={true} />
          </div>
        ))}

      <div ref={(el) => (sectionsRef.current[0] = el)} className={styles.section}>
        <HeroSection scrollToSection={() => scrollToSection(1)} />
      </div>

      <div ref={(el) => (sectionsRef.current[1] = el)} className={styles.section}>
        <MainSection scrollToSection={() => scrollToSection(0)} />
      </div>
    </div>
  );
};

export default HomePage;