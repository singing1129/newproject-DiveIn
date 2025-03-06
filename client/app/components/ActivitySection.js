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

  // 渲染地圖（使用 Shapefile 或 GeoJSON）
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
      .style("z-index", 0)
      .style("opacity", 0);

    const loadShapefile = async () => {
      try {
        const [shpResponse, shxResponse, prjResponse, dbfResponse] = await Promise.all([
          fetch("/asia.shp").then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.arrayBuffer();
          }),
          fetch("/asia.shx").then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.arrayBuffer();
          }),
          fetch("/asia.prj").then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.text();
          }),
          fetch("/asia.dbf").then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.arrayBuffer();
          }),
        ]);

        console.log("Shp length:", shpResponse.byteLength, "Shx length:", shxResponse.byteLength, "Dbf length:", dbfResponse.byteLength);
        if (shpResponse.byteLength === 0 || shxResponse.byteLength === 0 || dbfResponse.byteLength === 0) {
          throw new Error("Shapefile 文件數據為空");
        }

        const shapefile = require("shapefile");
        const source = await shapefile.open(shpResponse, shxResponse, { encoding: "latin1" }); // 嘗試 latin1
        const features = [];
        for (const feature of source) {
          features.push(feature);
        }

        const proj = d3.geoMercator()
          .center([100, 30])
          .scale(500)
          .translate([width / 2, height / 2]);

        setProjection(() => proj);

        const path = d3.geoPath().projection(proj);

        svg.selectAll("path")
          .data(features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "rgba(255, 255, 255, 0.1)")
          .attr("stroke", "rgba(255, 255, 255, 0.8)")
          .attr("stroke-width", 0.5)
          .attr("shape-rendering", "geometricPrecision")
          .attr("filter", "url(#glow)");

        svg.append("defs")
          .append("filter")
          .attr("id", "glow")
          .append("feGaussianBlur")
          .attr("stdDeviation", 1.5)
          .append("feMerge")
          .selectAll("feMergeNode")
          .data([0, 1])
          .enter()
          .append("feMergeNode")
          .attr("in", (d, i) => (i ? "SourceGraphic" : undefined));

        const line = d3.line()
          .x(d => proj([d[1], d[0]])[0])
          .y(d => proj([d[1], d[0]])[1])
          .curve(d3.curveNatural);

        svg.append("path")
          .datum(activities.map(a => a.location))
          .attr("class", "route")
          .attr("fill", "none")
          .attr("stroke", "#1E90FF")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "8, 8")
          .attr("stroke-dashoffset", 160);

        svg.selectAll(".marker")
          .data(activities)
          .enter()
          .append("image")
          .attr("class", "marker")
          .attr("xlink:href", "/image/diving.png")
          .attr("width", 36)
          .attr("height", 36)
          .attr("x", d => proj(d.location)[0] - 18)
          .attr("y", d => proj(d.location)[1] - 36)
          .attr("opacity", 0)
          .style("filter", "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))");
      } catch (err) {
        console.error("Shapefile 載入失敗:", err);
        setError(`Shapefile 載入失敗: ${err.message}. 請檢查 /public 資料夾中的 asia.shp, asia.shx, asia.prj, asia.dbf 檔案，或使用 /ne_10m_admin_0_countries.geojson。`);
        loadGeojsonFallback();
      }
    };

    const loadGeojsonFallback = async () => {
      try {
        const geoData = await d3.json("/ne_10m_admin_0_countries.geojson");
        const proj = d3.geoMercator()
          .center([100, 30])
          .scale(500)
          .translate([width / 2, height / 2]);
        setProjection(() => proj);

        const path = d3.geoPath().projection(proj);

        svg.selectAll("path")
          .data(geoData.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "rgba(255, 255, 255, 0.1)")
          .attr("stroke", "rgba(255, 255, 255, 0.8)")
          .attr("stroke-width", 0.5)
          .attr("shape-rendering", "geometricPrecision")
          .attr("filter", "url(#glow)");

        const line = d3.line()
          .x(d => proj([d[1], d[0]])[0])
          .y(d => proj([d[1], d[0]])[1])
          .curve(d3.curveNatural);

        svg.append("path")
          .datum(activities.map(a => a.location))
          .attr("class", "route")
          .attr("fill", "none")
          .attr("stroke", "#1E90FF")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "8, 8")
          .attr("stroke-dashoffset", 160);

        svg.selectAll(".marker")
          .data(activities)
          .enter()
          .append("image")
          .attr("class", "marker")
          .attr("xlink:href", "/image/diving.png")
          .attr("width", 36)
          .attr("height", 36)
          .attr("x", d => proj(d.location)[0] - 18)
          .attr("y", d => proj(d.location)[1] - 36)
          .attr("opacity", 0)
          .style("filter", "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))");
      } catch (geoErr) {
        console.error("GeoJSON 載入失敗:", geoErr);
        setError(`無法載入 /ne_10m_admin_0_countries.geojson: ${geoErr.message}. 請下載並放入 /public 資料夾。`);
      }
    };

    loadShapefile();
  }, [loading, activities]);

  // 顯示地圖與標題
  const showMapAndTitle = () => {
    if (!mapVisible) {
      const tl = gsap.timeline();
      tl.to(svgRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      })
        .to(titleRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.8,
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

      const tl = gsap.timeline();
      const totalLength = route.getTotalLength();
      const segmentLength = totalLength / (activities.length - 1);
      const targetOffset = totalLength - segmentLength * index;

      tl.to(route, {
        strokeDashoffset: targetOffset,
        duration: 1.2,
        ease: "power2.inOut",
      })
        .to(marker, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
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

  // 懸停與點擊效果
  const handleCardHover = (index) => {
    const card = cardRefs.current[index];
    if (card && displayedMarkers.includes(index)) {
      gsap.to(card, { scale: 1.2, duration: 0.3, ease: "power2.out" });
    }
  };

  const handleCardLeave = (index) => {
    const card = cardRefs.current[index];
    if (card && displayedMarkers.includes(index)) {
      gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
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

  // 漂浮動畫與卡片環繞地圖
  useEffect(() => {
    displayedMarkers.forEach((index) => {
      const svg = d3.select(svgRef.current);
      const marker = svg.selectAll(".marker").nodes()[index];
      const card = cardRefs.current[index];

      const mapRect = svgRef.current.getBoundingClientRect();
      const mapCenterX = mapRect.left + mapRect.width / 2;
      const mapCenterY = mapRect.top + mapRect.height / 2;

      const radius = mapRect.width / 2 + 120;
      const angle = (index * 90) * (Math.PI / 180);
      const cardX = mapCenterX + radius * Math.cos(angle) - 96;
      const cardY = mapCenterY + radius * Math.sin(angle) - 120;

      gsap.set(card, {
        x: cardX,
        y: cardY,
        position: "absolute",
      });

      gsap.to(marker, {
        y: Math.sin(Date.now() * 0.001 + index) * 2,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(card, {
        y: cardY + Math.sin(Date.now() * 0.001 + index + 1) * 2,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }, [displayedMarkers]);

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
            onMouseEnter={() => handleCardHover(index)}
            onMouseLeave={() => handleCardLeave(index)}
            onClick={() => handleCardClick(index)}
          >
            <img src={getImagePath(activity)} alt={activity.name} />
            <div className={styles.cardLabel}>
              <h3>{activity.name.split("｜")[1]}</h3>
              {displayedMarkers.includes(index) && (
                <p className={styles.price}>NT ${activity.price}</p>
              )}
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