"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "./FooterSection.module.css";

const FooterSection = () => {
  const bubblesRef = useRef([]);

  useEffect(() => {
    bubblesRef.current.forEach((bubble, index) => {
      gsap.to(bubble, {
        y: "-100vh",
        opacity: 0,
        duration: Math.random() * 5 + 5,
        repeat: -1,
        delay: Math.random() * 5,
        ease: "power1.inOut",
      });
    });
  }, []);

  return (
    <div className={styles.footerSection}>
      {/* 氣泡容器 */}
      <div className={styles.bubbles}>
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            ref={(el) => (bubblesRef.current[index] = el)}
            className={styles.bubble}
          />
        ))}
      </div>
      <p>© 2024 DiveIn. All rights reserved.</p>
    </div>
  );
};

export default FooterSection;