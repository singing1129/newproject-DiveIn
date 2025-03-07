import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./WelcomeSection.module.css";

const WelcomeSection = () => {
  const floatingHeaderRef = useRef(null);
  const sinkingHeaderRef = useRef(null);

  useEffect(() => {
    // 浮起的 Header 動畫
    gsap.fromTo(
      floatingHeaderRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
    );

    // 沉下的 Header 動畫
    gsap.fromTo(
      sinkingHeaderRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
    );
  }, []);

  return (
    <div className={styles.welcomeSection}>
      <h1 ref={floatingHeaderRef} className={styles.floatingHeader}>
        歡迎來到潛水商城
      </h1>
      <h2 ref={sinkingHeaderRef} className={styles.sinkingHeader}>
        探索海底世界
      </h2>
    </div>
  );
};

export default WelcomeSection;