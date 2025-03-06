"use client";

import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import styles from "./ActivitySection.module.css";

gsap.registerPlugin(ScrollTrigger);

const ActivitySection = () => {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const mapMarkersRef = useRef([]);
  const linesRef = useRef([]);
  const [scrollCount, setScrollCount] = useState(0);
  const [displayedCards, setDisplayedCards] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 隨機選取 5 筆資料
  const getRandomActivities = (data, count) => {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // 從後端獲取資料
  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";

    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`);
        console.log("Raw response:", response.data);
        if (response.data.status !== "success" || !Array.isArray(response.data.data)) {
          throw new Error("Invalid data format from backend");
        }
        const allActivities = response.data.data;
        const randomActivities = getRandomActivities(allActivities, 5).map((item, index) => ({
          ...item,
          location: { x: 50, y: 10 + index * 20 }, // 添加地圖位置
        }));
        setActivities(randomActivities);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        // 靜態備用資料
        setActivities([
          {
            id: 1,
            name: "日本・沖繩｜輕鬆坐船去青洞浮潛・體驗潛水｜全中文服務｜當天無追加費用",
            price: 1420,
            main_image: "jpg (3).webp",
            location: { x: 50, y: 10 },
          },
          {
            id: 2,
            name: "珊瑚探險 - 馬爾地夫",
            price: 3000,
            main_image: "coral.jpg",
            location: { x: 50, y: 30 },
          },
          {
            id: 3,
            name: "海底派對 - 加勒比海",
            price: 2000,
            main_image: "party.jpg",
            location: { x: 50, y: 50 },
          },
          {
            id: 4,
            name: "沉船探秘 - 百慕達",
            price: 2800,
            main_image: "wreck.jpg",
            location: { x: 50, y: 70 },
          },
          {
            id: 5,
            name: "海底洞穴 - 沖繩",
            price: 2600,
            main_image: "cave.jpg",
            location: { x: 50, y: 90 },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getImagePath = (item) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.id || !item.main_image) return defaultImage;
    return `/image/activity/${item.id}/${encodeURIComponent(item.main_image)}`;
  };

  const triggerAnimations = (count) => {
    const index = count - 1;
    const tl = gsap.timeline();

    if (count === 1 && !displayedCards.includes(0)) {
      tl.fromTo(
        titleRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );
    }

    if (index >= 0 && index < activities.length && !displayedCards.includes(index)) {
      tl.fromTo(
        mapMarkersRef.current[index],
        { scale: 0, opacity: 0 },
        { scale: 1.5, opacity: 1, duration: 0.5, ease: "bounce.out" }
      )
        .fromTo(
          cardsRef.current[index],
          {
            x: 700,
            opacity: 0,
            scale: 0.8,
            rotation: (index % 2 === 0 ? -10 : 10) + Math.random() * 10,
          },
          {
            x: Math.random() * 300 - 150,
            y: Math.random() * 300 - 150,
            opacity: 1,
            scale: 1,
            rotation: Math.random() * 5 - 2.5,
            duration: 1.2,
            ease: "power2.out",
          }
        )
        .fromTo(
          linesRef.current[index],
          { strokeDashoffset: 100, opacity: 0 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.5 }
        );

      setDisplayedCards((prev) => [...prev, index]);
    }
  };

  const handleMarkerHover = (index) => {
    if (cardsRef.current[index]) {
      gsap.to(cardsRef.current[index], {
        scale: 1.05,
        boxShadow: "0 15px 40px rgba(0, 0, 0, 0.5)",
        duration: 0.3,
      });
      gsap.to(mapMarkersRef.current[index], { scale: 2, duration: 0.3 });
    }
  };

  const handleMarkerLeave = (index) => {
    if (cardsRef.current[index]) {
      gsap.to(cardsRef.current[index], {
        scale: 1,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        duration: 0.3,
      });
      gsap.to(mapMarkersRef.current[index], { scale: 1.5, duration: 0.3 });
    }
  };

  useEffect(() => {
    if (!bgRef.current) return;

    gsap.to(bgRef.current, {
      background: `linear-gradient(to bottom, var(--primary-deep-color) 0%, var(--primary-deep-color) 60%, var(--primary-light-color) 100%)`,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        scrub: true,
        onUpdate: (self) => {
          if (bgRef.current) {
            const progress = self.progress;
            const deepEnd = 60 - progress * 50;
            bgRef.current.style.background = `linear-gradient(to bottom, var(--primary-deep-color) 0%, var(--primary-deep-color) ${deepEnd}%, var(--primary-light-color) 100%)`;
          }
        },
      },
    });

    const handleMouseMove = (e) => {
      if (!bgRef.current) return;
      const { clientY } = e;
      const { top, height } = sectionRef.current.getBoundingClientRect();
      const y = (clientY - top) / height;
      const deepEnd = 60 - y * 40;
      gsap.to(bgRef.current, {
        background: `linear-gradient(to bottom, var(--primary-deep-color) 0%, var(--primary-deep-color) ${deepEnd}%, var(--primary-light-color) 100%)`,
        duration: 0.5,
      });
    };
    sectionRef.current.addEventListener("mousemove", handleMouseMove);

    const handleWheel = (e) => {
      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      const rect = sectionRef.current.getBoundingClientRect();

      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        if (direction > 0 && scrollCount < activities.length) {
          e.preventDefault();
          setScrollCount((prev) => {
            const newCount = prev + 1;
            triggerAnimations(newCount);
            return newCount;
          });
        } else if (scrollCount >= activities.length) {
          const nextSection = sectionRef.current.nextElementSibling;
          if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      sectionRef.current.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [scrollCount, activities]);

  if (loading) return <div>加載中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <section ref={sectionRef} className={styles.activitySection}>
      <div ref={bgRef} className={styles.background} />
      <svg className={styles.map} viewBox="0 0 100 100">
        {activities.map((activity, index) => (
          <g key={index}>
            <circle
              ref={(el) => (mapMarkersRef.current[index] = el)}
              cx={activity.location.x}
              cy={activity.location.y}
              r="5"
              fill="var(--primary-light-color)"
              opacity="0"
              onMouseEnter={() => handleMarkerHover(index)}
              onMouseLeave={() => handleMarkerLeave(index)}
            />
            <line
              ref={(el) => (linesRef.current[index] = el)}
              x1={activity.location.x}
              y1={activity.location.y}
              x2="80"
              y2="50"
              stroke="var(--primary-light-color)"
              strokeWidth="1"
              strokeDasharray="100"
              strokeDashoffset="100"
              opacity="0"
            />
          </g>
        ))}
      </svg>
      <h2 ref={titleRef} className={styles.title}>
        推薦深海活動
      </h2>
      <div className={styles.cardContainer}>
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            ref={(el) => (cardsRef.current[index] = el)}
            className={styles.card}
            style={{ zIndex: index }}
          >
            <div className={styles.imgContainer}>
              <img
                src={getImagePath(activity)}
                alt={activity.name}
                className={styles.img}
              />
              <div className={styles.hoverActionContainer}>
                <div className={styles.iconGroup}>
                  <button className={styles.hoverActionBtn}>
                    <FaRegHeart />
                  </button>
                  <button className={styles.hoverActionBtn}>
                    <FiShoppingCart />
                  </button>
                </div>
              </div>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) =>
                  i < 4 ? <FaStar key={i} /> : <FaRegStar key={i} />
                )}
              </div>
            </div>
            <div className={styles.cardOverlay}>
              <h3>{activity.name}</h3>
              <p>NT ${activity.price}</p>
            </div>
            <svg className={styles.bubbles} viewBox="0 0 100 100">
              <circle cx="20" cy="80" r="5" fill="rgba(255, 255, 255, 0.3)" />
              <circle cx="30" cy="70" r="3" fill="rgba(255, 255, 255, 0.3)" />
              <circle cx="40" cy="60" r="4" fill="rgba(255, 255, 255, 0.3)" />
            </svg>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivitySection;