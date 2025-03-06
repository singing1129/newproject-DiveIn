"use client";

import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import dynamic from "next/dynamic";
import styles from "./ActivitySection.module.css";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const ActivitySection = ({ scrollToSection }) => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const explorePointsRef = useRef([]);
  const mapMarkersRef = useRef([]);
  const mapLinesRef = useRef([]);
  const [scrollCount, setScrollCount] = useState(0);
  const [displayedPoints, setDisplayedPoints] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bubbleAnimation, setBubbleAnimation] = useState(null);
  const [pointBubbles, setPointBubbles] = useState({});

  // 隨機選取 5 筆資料並分配地圖位置
  const getRandomActivities = (data, count) => {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((item, index) => ({
      ...item,
      location: {
        x: 20 + Math.random() * 60, // 地圖隨機分佈
        y: 20 + index * 15,
      },
      screenPosition: {
        x: 150 + index * 200, // 螢幕中分散位置
        y: 100 + index * 120,
      },
    }));
  };

  // 預載 bubble.json
  useEffect(() => {
    fetch("/json/bubble.json")
      .then((res) => res.json())
      .then((data) => setBubbleAnimation(data))
      .catch((error) => console.error("載入氣泡動畫失敗:", error));
  }, []);

  // 從後端獲取資料
  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";

    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`);
        if (response.data.status !== "success" || !Array.isArray(response.data.data)) {
          throw new Error("Invalid data format from backend");
        }
        const randomActivities = getRandomActivities(response.data.data, 5);
        setActivities(randomActivities);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setActivities([
          { id: 1, name: "日本・沖繩｜輕鬆坐船去青洞浮潛", price: 1420, main_image: "jpg (3).webp", location: { x: 30, y: 20 }, screenPosition: { x: 150, y: 100 } },
          { id: 2, name: "珊瑚探險 - 馬爾地夫", price: 3000, main_image: "coral.jpg", location: { x: 50, y: 35 }, screenPosition: { x: 350, y: 220 } },
          { id: 3, name: "海底派對 - 加勒比海", price: 2000, main_image: "party.jpg", location: { x: 40, y: 50 }, screenPosition: { x: 550, y: 340 } },
          { id: 4, name: "沉船探秘 - 百慕達", price: 2800, main_image: "wreck.jpg", location: { x: 60, y: 65 }, screenPosition: { x: 750, y: 460 } },
          { id: 5, name: "海底洞穴 - 沖繩", price: 2600, main_image: "cave.jpg", location: { x: 45, y: 80 }, screenPosition: { x: 950, y: 580 } },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // 圖片路徑處理
  const getImagePath = (item) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.id || !item.main_image) return defaultImage;
    return `/image/activity/${item.id}/${encodeURIComponent(item.main_image)}`;
  };

  // 顯示探索點動畫
  const triggerShowAnimation = (count) => {
    const index = count - 1;
    const tl = gsap.timeline();

    if (count === 1 && !displayedPoints.includes(0)) {
      tl.fromTo(
        titleRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );
    }

    if (index >= 0 && index < activities.length && !displayedPoints.includes(index)) {
      const point = explorePointsRef.current[index];
      tl.fromTo(
        mapMarkersRef.current[index],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "bounce.out" }
      )
        .fromTo(
          point.querySelector(`.${styles.image}`),
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
        )
        .fromTo(
          point.querySelector(`.${styles.label}`),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
          "-=0.5"
        )
        .fromTo(
          mapLinesRef.current[index],
          { strokeDashoffset: 100, opacity: 0 },
          { strokeDashoffset: 0, opacity: 1, duration: 1, ease: "power2.out" },
          "-=1"
        );

      setPointBubbles((prev) => ({
        ...prev,
        [index]: Array.from({ length: 8 }, () => ({
          id: `bubble-point-${index}-${Date.now()}-${Math.random()}`,
          x: Math.random() * 100,
          size: 20 + Math.random() * 100,
        })),
      }));

      setDisplayedPoints((prev) => [...prev, index]);
    }
  };

  // 收回探索點動畫
  const triggerHideAnimation = (count) => {
    const index = count;
    if (index >= 0 && index < activities.length && displayedPoints.includes(index)) {
      const point = explorePointsRef.current[index];
      const tl = gsap.timeline();
      tl.to(point.querySelector(`.${styles.label}`), { y: 50, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(point.querySelector(`.${styles.image}`), { scale: 0, opacity: 0, duration: 0.8, ease: "power2.in" }, "-=0.5")
        .to(mapMarkersRef.current[index], { scale: 0, opacity: 0, duration: 0.5, ease: "power2.in" }, "-=0.5")
        .to(mapLinesRef.current[index], { strokeDashoffset: 100, opacity: 0, duration: 0.5, ease: "power2.in" }, "-=0.5");

      setDisplayedPoints((prev) => prev.filter((i) => i !== index));
      setPointBubbles((prev) => {
        const newBubbles = { ...prev };
        delete newBubbles[index];
        return newBubbles;
      });
    }
  };

  // 懸停效果
  const handleMarkerHover = (index) => {
    const point = explorePointsRef.current[index];
    if (point) {
      gsap.to(point.querySelector(`.${styles.image}`), { scale: 1.1, boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)", duration: 0.3 });
      gsap.to(mapMarkersRef.current[index], { scale: 1.2, duration: 0.3 });
    }
  };

  const handleMarkerLeave = (index) => {
    const point = explorePointsRef.current[index];
    if (point) {
      gsap.to(point.querySelector(`.${styles.image}`), { scale: 1, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)", duration: 0.3 });
      gsap.to(mapMarkersRef.current[index], { scale: 1, duration: 0.3 });
    }
  };

  // 滾輪事件控制
  useEffect(() => {
    if (loading || !sectionRef.current) return;

    const handleWheel = (e) => {
      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      const rect = sectionRef.current.getBoundingClientRect();

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        e.preventDefault();
        e.stopPropagation();

        if (direction > 0) {
          if (scrollCount < activities.length) {
            setScrollCount((prev) => {
              const newCount = prev + 1;
              triggerShowAnimation(newCount);
              return newCount;
            });
          } else {
            scrollToSection();
          }
        } else if (direction < 0 && scrollCount > 0) {
          setScrollCount((prev) => {
            const newCount = prev - 1;
            triggerHideAnimation(newCount);
            return newCount;
          });
        }
      }
    };

    const section = sectionRef.current;
    section.addEventListener("wheel", handleWheel, { passive: false });
    return () => section.removeEventListener("wheel", handleWheel);
  }, [scrollCount, activities, loading, scrollToSection]);

  // 氣泡動畫
  useEffect(() => {
    if (!bubbleAnimation) return;

    Object.keys(pointBubbles).forEach((index) => {
      pointBubbles[index].forEach((bubble) => {
        const bubbleEl = document.getElementById(bubble.id);
        if (bubbleEl) {
          gsap.fromTo(
            bubbleEl,
            { y: 0, opacity: 0.8 },
            {
              y: -window.innerHeight,
              opacity: 0,
              duration: 4 + Math.random() * 4,
              ease: "power1.out",
              repeat: -1,
              delay: Math.random() * 3,
            }
          );
        }
      });
    });
  }, [pointBubbles, bubbleAnimation]);

  if (loading) return <div className={styles.loading}>加載中...</div>;
  if (error) return <div className={styles.error}>錯誤: {error}</div>;

  return (
    <section ref={sectionRef} className={styles.activitySection}>
      <svg className={styles.map} viewBox="0 0 100 100">
        <g className={styles.mapOutline}>
          <circle cx="10" cy="10" r="1" fill="white" />
          <circle cx="90" cy="10" r="1" fill="white" />
          <circle cx="90" cy="90" r="1" fill="white" />
          <circle cx="10" cy="90" r="1" fill="white" />
          <path d="M10 10 L90 10 L90 90 L10 90 Z" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
        </g>
        {activities.map((activity, index) => (
          <g key={index}>
            <circle
              ref={(el) => (mapMarkersRef.current[index] = el)}
              cx={activity.location.x}
              cy={activity.location.y}
              r="3"
              fill="#FFD700"
              opacity="0"
              onMouseEnter={() => handleMarkerHover(index)}
              onMouseLeave={() => handleMarkerLeave(index)}
            />
            {index > 0 && (
              <line
                ref={(el) => (mapLinesRef.current[index] = el)}
                x1={activities[index - 1].location.x}
                y1={activities[index - 1].location.y}
                x2={activity.location.x}
                y2={activity.location.y}
                stroke="#FFD700"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0"
                strokeDashoffset="100"
              />
            )}
          </g>
        ))}
      </svg>
      <h2 ref={titleRef} className={styles.title}>
        探索深海旅程
      </h2>
      <div className={styles.exploreContainer}>
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            ref={(el) => (explorePointsRef.current[index] = el)}
            className={styles.explorePoint}
            style={{ left: activity.screenPosition.x, top: activity.screenPosition.y }}
          >
            <div className={styles.imageContainer}>
              <img src={getImagePath(activity)} alt={activity.name} className={styles.image} />
              <div className={styles.hoverActions}>
                <button className={styles.hoverActionBtn}><FaRegHeart /></button>
                <button className={styles.hoverActionBtn}><FiShoppingCart /></button>
              </div>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (i < 4 ? <FaStar key={i} /> : <FaRegStar key={i} />))}
              </div>
            </div>
            <div className={styles.label}>
              <h3>{activity.name}</h3>
              <p>NT ${activity.price}</p>
            </div>
            {bubbleAnimation && pointBubbles[index] && (
              <div className={styles.bubbles}>
                {pointBubbles[index].map((bubble) => (
                  <div
                    key={bubble.id}
                    id={bubble.id}
                    className={styles.pointBubble}
                    style={{
                      left: `${bubble.x}%`,
                      width: `${bubble.size}px`,
                      height: `${bubble.size}px`,
                    }}
                  >
                    <Lottie animationData={bubbleAnimation} loop={true} autoplay={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.scrollArrow} onClick={scrollToSection}>
        <svg width="30" height="45" viewBox="0 0 40 60" fill="none" stroke="white" strokeWidth="2">
          <path d="M10 15 L20 25 L30 15" strokeWidth="3" />
          <path d="M12 30 L20 40 L28 30" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
};

export default ActivitySection;