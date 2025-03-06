"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "./ActivitySection.module.css";

const ActivitySection = () => {
  const cardsRef = useRef([]);

  useEffect(() => {
    gsap.from(cardsRef.current, {
      opacity: 0,
      y: 50,
      stagger: 0.2,
      duration: 1,
      scrollTrigger: {
        trigger: ".activitySection",
        start: "top 80%",
      },
    });
  }, []);

  return (
    <div className={`${styles.activitySection} activitySection`}>
      <h2>推薦活動</h2>
      <div className={styles.cards}>
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            ref={(el) => (cardsRef.current[index] = el)}
            className={styles.card}
          >
            <img src={`/image/activity${index + 1}.jpg`} alt={`Activity ${index + 1}`} />
            <h3>活動 {index + 1}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivitySection;