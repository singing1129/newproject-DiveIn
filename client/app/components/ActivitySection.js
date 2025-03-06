"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ActivitySection.module.css";

gsap.registerPlugin(ScrollTrigger);

const ActivitySection = ({ scrollToSection }) => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const svgRef = useRef(null);
  const cardRefs = useRef([]);
  const [scrollCount, setScrollCount] = useState(0);
  const [displayedMarkers, setDisplayedMarkers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projection, setProjection] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);

  // 設定活動地點與經緯度
  const getActivitiesWithLocations = (data, count) => {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const locations = [
      [26.2124, 127.6792], // 日本沖繩1
      [26.3350, 127.8010], // 日本沖繩2
      [22.0000, 120.2000], // 台灣小琉球
      [14.5995, 120.9842], // 菲律賓 (馬尼拉附近)
    ];
    return shuffled.slice(0, count).map((item, index) => ({
      ...item,
      location: locations[index],
    }));
  };

  // 從後端獲取資料
  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";

    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`);
        if (response.data.status !== "success" || !Array.isArray(response.data.data)) {
          throw new Error("Invalid data format from backend");
        }
        const randomActivities = getActivitiesWithLocations(response.data.data, 4);
        setActivities(randomActivities);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setActivities([
          { id: 1, name: "日本・沖繩｜青洞浮潛", price: 1420, main_image: "jpg (3).webp", location: [26.2124, 127.6792] },
          { id: 2, name: "日本・沖繩｜海底洞穴", price: 2600, main_image: "cave.jpg", location: [26.3350, 127.8010] },
          { id: 3, name: "台灣小琉球｜海底派對", price: 2000, main_image: "party.jpg", location: [22.0000, 120.2000] },
          { id: 4, name: "菲律賓｜珊瑚探險", price: 3000, main_image: "coral.jpg", location: [14.5995, 120.9842] },
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

  // 渲染地圖
  useEffect(() => {
    if (loading || !svgRef.current || !activities.length) return;

    const width = 1200;
    const height = 900;
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("position", "absolute")
      .style("top", "50%")
      .style("left", "50%")
      .style("transform", "translate(-50%, -50%)")
      .style("z-index", 1)
      .style("opacity", 0);

    const loadGeojson = async () => {
      try {
        const geoData = await d3.json("/ne_10m_admin_0_countries.geojson");
        console.log("GeoJSON loaded, features count:", geoData.features.length);

        // 過濾亞洲地區
        const asianCountries = geoData.features.filter(feature => {
          const region = feature.properties.SUBREGION;
          return region === "Eastern Asia" || region === "South-Eastern Asia";
        });

        const proj = d3.geoMercator()
          .center([130, 20]) // 擴展範圍，填滿左側
          .scale(2000)       // 增大比例
          .translate([width / 2, height / 2]);

        setProjection(() => proj);

        const path = d3.geoPath().projection(proj);

        // 繪製地圖（淡化背景）
        svg.selectAll("path")
          .data(asianCountries.length ? asianCountries : geoData.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "rgba(30, 144, 255, 0.05)") // 更淡的背景
          .attr("stroke", "rgba(135, 206, 250, 0.3)") // 更淡的邊界
          .attr("stroke-width", 0.8)
          .attr("shape-rendering", "crispEdges");

        // 定義水波紋濾鏡
        const defs = svg.append("defs");
        const rippleFilter = defs.append("filter")
          .attr("id", "ripple")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");
        rippleFilter.append("feTurbulence")
          .attr("type", "fractalNoise")
          .attr("baseFrequency", "0.03")
          .attr("numOctaves", "2")
          .attr("result", "noise");
        rippleFilter.append("feDisplacementMap")
          .attr("in", "SourceGraphic")
          .attr("in2", "noise")
          .attr("scale", "8")
          .attr("xChannelSelector", "R")
          .attr("yChannelSelector", "G");

        // 藍色足跡線
        const line = d3.line()
          .x(d => proj([d[1], d[0]])[0])
          .y(d => proj([d[1], d[0]])[1])
          .curve(d3.curveNatural);

        svg.append("path")
          .datum(activities.map(a => a.location))
          .attr("class", "route")
          .attr("fill", "none")
          .attr("stroke", "#1E90FF")
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "6, 6")
          .attr("stroke-dashoffset", 120)
          .style("z-index", 2);

        // 活動地點標記（基於經緯度）
        svg.selectAll(".marker")
          .data(activities)
          .enter()
          .append("circle")
          .attr("class", "marker")
          .attr("cx", d => proj(d.location)[0])
          .attr("cy", d => proj(d.location)[1])
          .attr("r", 8)
          .attr("fill", "#1E90FF")
          .attr("opacity", 0)
          .style("filter", "url(#ripple) drop-shadow(0 0 5px rgba(30, 144, 255, 0.7))")
          .style("z-index", 2);
      } catch (geoErr) {
        console.error("GeoJSON 載入失敗:", geoErr);
        setError(`GeoJSON 載入失敗: ${geoErr.message}. 請確保 /ne_10m_admin_0_countries.geojson 存在於 /public 資料夾。`);
      }
    };

    loadGeojson();
  }, [loading, activities]);

  // 顯示地圖與標題
  const showMapAndTitle = () => {
    if (!mapVisible) {
      const tl = gsap.timeline();
      tl.to(svgRef.current, {
        opacity: 1,
        duration: 1,
        ease: "power3.out",
      })
        .to(titleRef.current, {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }, "-=0.5");
      setMapVisible(true);
    }
  };

  // 顯示地點動畫
  const triggerShowAnimation = (count) => {
    const index = count - 1;

    if (index >= 0 && index < activities.length && !displayedMarkers.includes(index)) {
      const card = cardRefs.current[index];
      const svg = d3.select(svgRef.current);
      const route = svg.select(".route").node();
      const marker = svg.selectAll(".marker").nodes()[index];

      if (!card || !marker || !route) {
        console.error(`Missing elements at index ${index}: card=${card}, marker=${marker}, route=${route}`);
        return;
      }

      const totalLength = route.getTotalLength();
      const segmentLength = totalLength / (activities.length - 1);
      const targetOffset = totalLength - segmentLength * index;

      const tl = gsap.timeline();
      tl.to(route, {
        strokeDashoffset: targetOffset,
        duration: 1.2,
        ease: "power2.inOut",
      })
        .to(marker, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          onStart: () => {
            gsap.to(marker, {
              scale: 1.3,
              repeat: -1,
              yoyo: true,
              duration: 1.2,
              ease: "sine.inOut",
            });
          },
        }, "-=0.5")
        .to(card, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.5");

      setDisplayedMarkers((prev) => [...prev, index]);
    }
  };

  // 收回地點動畫
  const triggerHideAnimation = (count) => {
    const index = count;
    if (index >= 0 && index < activities.length && displayedMarkers.includes(index)) {
      const card = cardRefs.current[index];
      const svg = d3.select(svgRef.current);
      const marker = svg.selectAll(".marker").nodes()[index];

      if (!card || !marker) {
        console.error(`Missing elements at index ${index}: card=${card}, marker=${marker}`);
        return;
      }

      const tl = gsap.timeline();
      tl.to(card, { opacity: 0, scale: 0, duration: 0.5, ease: "power2.in" })
        .to(marker, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        }, "-=0.5");

      setDisplayedMarkers((prev) => prev.filter((i) => i !== index));
    }
  };

  // 滑鼠互動效果
  const handleCardHover = (index) => {
    const card = cardRefs.current[index];
    if (card && displayedMarkers.includes(index)) {
      gsap.to(card, {
        scale: 1.2,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (index) => {
    const card = cardRefs.current[index];
    if (card && displayedMarkers.includes(index)) {
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleCardClick = (index) => {
    const card = cardRefs.current[index];
    if (card && displayedMarkers.includes(index)) {
      gsap.to(card, { scale: 1.5, duration: 0.3, ease: "power2.out" });
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
          if (!mapVisible) {
            showMapAndTitle();
            setScrollCount(1);
          } else if (scrollCount < activities.length) {
            setScrollCount((prev) => {
              const newCount = prev + 1;
              triggerShowAnimation(newCount);
              return newCount;
            });
          } else {
            scrollToSection();
          }
        } else if (direction < 0 && scrollCount > 1) {
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
  }, [scrollCount, activities, loading, scrollToSection, mapVisible]);

  // 卡片位置調整（圍繞地圖，弧形氣泡）
  useEffect(() => {
    if (!projection || !svgRef.current) return;

    displayedMarkers.forEach((index) => {
      const card = cardRefs.current[index];
      if (!card) return;

      const pos = projection(activities[index].location);
      const svgRect = svgRef.current.getBoundingClientRect();
      const cardWidth = 250;
      const cardHeight = 180;

      // 計算圍繞地圖的弧形位置
      const mapCenterX = svgRect.left + svgRect.width / 2;
      const mapCenterY = svgRect.top + svgRect.height / 2;
      const angle = (index * 90 + 45) * (Math.PI / 180); // 偏移 45 度，避免重疊
      const radius = Math.min(svgRect.width, svgRect.height) / 2 + 100; // 弧度半徑
      let cardX = mapCenterX + radius * Math.cos(angle) - cardWidth / 2;
      let cardY = mapCenterY + radius * Math.sin(angle) - cardHeight / 2;

      // 確保卡片不超出畫布
      cardX = Math.max(0, Math.min(cardX, window.innerWidth - cardWidth));
      cardY = Math.max(0, Math.min(cardY, window.innerHeight - cardHeight));

      gsap.set(card, {
        x: cardX,
        y: cardY,
        position: "absolute",
        zIndex: 10,
      });

      // 氣泡漂浮動畫
      gsap.to(card, {
        y: cardY + Math.sin(Date.now() * 0.001 + index) * 15,
        scale: 1 + Math.sin(Date.now() * 0.001 + index) * 0.05,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }, [displayedMarkers, projection]);

  if (loading) return <div className={styles.loading}>加載中...</div>;
  if (error) return <div className={styles.error}>錯誤: {error}</div>;

  return (
    <section ref={sectionRef} className={styles.activitySection}>
      <svg ref={svgRef} className={styles.map}></svg>
      <div className={styles.cardContainer}>
        {activities.map((activity, index) => (
          <div
            key={index}
            ref={(el) => (cardRefs.current[index] = el)}
            className={styles.activityCard}
            style={{ opacity: 0, scale: 0 }}
            onMouseEnter={() => handleCardHover(index)}
            onMouseLeave={() => handleCardLeave(index)}
            onClick={() => handleCardClick(index)}
          >
            <img src={getImagePath(activity)} alt={activity.name} style={{ width: "100%", borderRadius: "15px", marginBottom: "5px" }} />
            <div className={styles.cardLabel}>
              <h3 style={{ color: "white", fontSize: "18px", margin: "0 0 5px 0" }}>{activity.name.split("｜")[1]}</h3>
              <p style={{ color: "white", fontSize: "14px", margin: 0 }}>
                地點: {activity.name.split("｜")[0]}
              </p>
            </div>
          </div>
        ))}
      </div>
      <h2 ref={titleRef} className={styles.title}>
        亞洲深海潛航
      </h2>
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