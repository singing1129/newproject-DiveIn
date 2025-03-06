"use client";

import React, { useEffect, useRef } from "react";
import HeroSection from "../components/HeroSection";
import ActivitySection from "../components/ActivitySection";
import ProductSection from "../components/ProductSection";
import FooterSection from "../components/FooterSection";
import styles from "./page.module.css";

const HomePage = () => {
  const sectionsRef = useRef([]);

  // 滾動到指定區塊
  const scrollToSection = (index) => {
    sectionsRef.current[index].scrollIntoView({ behavior: "smooth" });
  };

  // 監聽滾動事件
  useEffect(() => {
    const handleScroll = () => {
      const currentSection = sectionsRef.current.findIndex(
        (section) => section.getBoundingClientRect().top >= 0
      );
      console.log("Current Section:", currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.homePage}>
      {/* 主視覺區 */}
      <div ref={(el) => (sectionsRef.current[0] = el)}>
        <HeroSection scrollToSection={() => scrollToSection(1)} />
      </div>

      {/* 活動推薦區 */}
      <div ref={(el) => (sectionsRef.current[1] = el)}>
        <ActivitySection scrollToSection={() => scrollToSection(2)} />
      </div>

      {/* 商品推薦區 */}
      <div ref={(el) => (sectionsRef.current[2] = el)}>
        <ProductSection scrollToSection={() => scrollToSection(3)} />
      </div>

      {/* 底部區塊 */}
      <div ref={(el) => (sectionsRef.current[3] = el)}>
        <FooterSection />
      </div>
    </div>
  );
};

export default HomePage;