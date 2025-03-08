"use client";

import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Parallax, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/parallax";
import "swiper/css/pagination";
import styles from "./MainSection.module.css";
import axios from "axios";
import Link from "next/link";
import Header from "./Header/header"; // 假設路徑
import Breadcrumb from "./Breadcrumb/breadcrumb"; // 假設路徑
import Footer from "./Footer/footer"; // 假設路徑

const MainSection = () => {
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [rentProducts, setRentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [activityPositions, setActivityPositions] = useState([]);
  const [productPositions, setProductPositions] = useState([]);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);
  const headerRef = useRef(null);
  const breadcrumbRef = useRef(null);
  const footerRef = useRef(null);
  const bubbleContainerRef = useRef(null);

  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";
    const fetchData = async () => {
      try {
        const activityResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`
        );
        if (
          activityResponse.data.status === "success" &&
          Array.isArray(activityResponse.data.data)
        ) {
          setActivities(activityResponse.data.data.slice(0, 4));
          setActivityPositions(
            new Array(activityResponse.data.data.length).fill(null)
          );
        }

        const productResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=product`
        );
        if (
          productResponse.data.status === "success" &&
          Array.isArray(productResponse.data.data)
        ) {
          setProducts(productResponse.data.data.slice(0, 4));
          setVisibleProducts(
            new Array(productResponse.data.data.length).fill(false)
          );
          setProductPositions(
            new Array(productResponse.data.data.length).fill(null)
          );
        }

        const rentResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=rent`
        );
        if (
          rentResponse.data.status === "success" &&
          Array.isArray(rentResponse.data.data)
        ) {
          setRentProducts(rentResponse.data.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 隨機分散氣泡位置並限制在容器內，確保不重疊
  const setRandomPositionForItem = (
    index,
    existingPositions,
    itemSize = 200
  ) => {
    const container = bubbleContainerRef.current;
    if (!container) return { top: 0, left: 0 };

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const padding = 20;
    const minSpacing = itemSize + 60; // 增加間距以確保不重疊
    let attempts = 0;
    let validPosition = false;
    let top, left;

    while (!validPosition && attempts < 300) {
      top =
        padding + Math.random() * (containerHeight - itemSize - 2 * padding);
      left =
        padding + Math.random() * (containerWidth - itemSize - 2 * padding);

      if (top < padding) top = padding;
      if (left < padding) left = padding;
      if (top > containerHeight - itemSize - padding)
        top = containerHeight - itemSize - padding;
      if (left > containerWidth - itemSize - padding)
        left = containerWidth - itemSize - padding;

      validPosition = existingPositions.every((pos) => {
        if (!pos) return true;
        const distance = Math.sqrt(
          Math.pow(pos.top - top, 2) + Math.pow(pos.left - left, 2)
        );
        return distance >= minSpacing;
      });

      attempts++;
    }

    if (!validPosition) {
      console.log(
        "[Debug] Failed to find non-overlapping position after 300 attempts"
      );
      top = padding;
      left = padding;
    }

    return { top, left };
  };

  // 活動氣泡位置處理
  useEffect(() => {
    if (
      !loading &&
      activities.length > 0 &&
      swiperInstance?.activeIndex === 0
    ) {
      const newPositions = activityPositions.map((pos, index) => {
        if (index < visibleCards && !pos) {
          return setRandomPositionForItem(
            index,
            activityPositions.filter((p) => p)
          );
        }
        return pos;
      });
      setActivityPositions(newPositions);
    }
  }, [visibleCards, activities, loading, swiperInstance]);

  // 商品/租借氣泡位置處理
  useEffect(() => {
    if (!loading && products.length > 0 && swiperInstance?.activeIndex === 1) {
      const newPositions = productPositions.map((pos, index) => {
        const product = products[index];
        const rentProduct = expandedProducts[product?.id];

        if (visibleProducts[index] && !rentProduct && !pos) {
          return setRandomPositionForItem(
            index,
            productPositions.filter((p) => p)
          );
        } else if (rentProduct && !pos) {
          return setRandomPositionForItem(
            index,
            productPositions.filter((p) => p)
          );
        }
        return pos;
      });
      setProductPositions(newPositions);
    }
  }, [visibleProducts, products, expandedProducts, loading, swiperInstance]);

  const handleSwiperInit = (swiper) => {
    setSwiperInstance(swiper);
  };

  useEffect(() => {
    if (!swiperInstance) return;
  
    const handleWheel = (e) => {
      const activeIndex = swiperInstance.activeIndex;
      e.stopPropagation();
  
      if (activeIndex === 0 && (visibleCards > 0 || e.deltaY > 0)) {
        e.preventDefault();
      }
  
      if (activeIndex === 0) {
        if (e.deltaY > 0) {
          if (visibleCards < activities.length)
            setVisibleCards((prev) => prev + 1);
          else if (!swiperInstance.isEnd) swiperInstance.slideNext(); // 檢查是否到達邊界
        } else if (e.deltaY < 0 && visibleCards > 0) {
          setVisibleCards((prev) => prev - 1);
        } else if (e.deltaY < 0 && visibleCards === 0 && !swiperInstance.isBeginning) {
          swiperInstance.slidePrev(); // 檢查是否到達邊界
        }
      } else {
        if (e.deltaY > 0 && !swiperInstance.isEnd) swiperInstance.slideNext(); // 檢查是否到達邊界
        else if (e.deltaY < 0 && !swiperInstance.isBeginning) swiperInstance.slidePrev(); // 檢查是否到達邊界
      }
    };
  
    const swiperContainer = swiperRef.current;
    if (swiperContainer) {
      swiperContainer.addEventListener("wheel", handleWheel, { passive: false });
    }
  
    return () => {
      if (swiperContainer) {
        swiperContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, [swiperInstance, visibleCards, activities.length]);

  useEffect(() => {
    if (!swiperInstance) return;

    swiperInstance.on("slideChange", () => {
      const activeIndex = swiperInstance.activeIndex;

      if (activeIndex !== 2) {
        if (headerRef.current) {
          headerRef.current.style.display = "none";
          headerRef.current.classList.remove(styles.fadeInUp);
        }
        if (breadcrumbRef.current) {
          breadcrumbRef.current.style.display = "none";
          breadcrumbRef.current.classList.remove(styles.fadeInUp);
        }
        if (footerRef.current) {
          footerRef.current.style.display = "none";
          footerRef.current.classList.remove(styles.fadeInDown);
        }
      }

      if (activeIndex === 2) {
        if (headerRef.current) {
          headerRef.current.style.display = "block";
          headerRef.current.classList.add(styles.fadeInUp);
        }
        if (breadcrumbRef.current) {
          breadcrumbRef.current.style.display = "block";
          breadcrumbRef.current.classList.add(styles.fadeInUp);
        }
      }

      if (activeIndex !== 0) setVisibleCards(0);
      if (activeIndex === 1) {
        setVisibleProducts(products.map(() => true));
      } else {
        setVisibleProducts(products.map(() => false));
        setExpandedProducts({});
        setProductPositions(products.map(() => null));
      }

      if (activeIndex === 2) {
        const slide = document.querySelector(`.${styles.slide}:nth-child(3)`);
        if (slide) {
          slide.addEventListener(
            "scroll",
            () => {
              const scrollTop = slide.scrollTop;
              const clientHeight = slide.clientHeight;
              const scrollHeight = slide.scrollHeight;
              if (scrollTop + clientHeight >= scrollHeight - 10) {
                if (footerRef.current) {
                  footerRef.current.style.display = "block";
                  footerRef.current.classList.add(styles.fadeInDown);
                }
              }
            },
            { once: true }
          );
        }
      }
    });
  }, [swiperInstance, products]);

  const getImagePath = (item, category) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.id || !item.main_image) return defaultImage;
    if (category === "rent") return item.main_image;
    return `/image/${category}/${item.id}/${item.main_image}`;
  };

  const splitActivityName = (name) => {
    const parts = name.split("｜");
    return { location: parts[0], activityName: parts[1] };
  };

  const getRentPrice = (product) => {
    return product.price2 !== null && product.price2 !== undefined
      ? `NT$${product.price2}/天`
      : `NT$${product.price}/天`;
  };

  const handleBubbleClick = (product, index) => {
    const rentProduct = rentProducts.find((rent) => rent.name === product.name);
    if (rentProduct) {
      setExpandedProducts((prev) => ({
        ...prev,
        [product.id]: rentProduct,
      }));
      setProductPositions((prev) => {
        const updated = [...prev];
        updated[index] = null;
        return updated;
      });
    }
  };

  if (loading) return <div className={styles.loading}>資料加載中...</div>;

  return (
    <section className={styles.mainSection}>
      {swiperInstance?.activeIndex === 2 && (
        <>
          <Header
            ref={headerRef}
            className={`${styles.header} ${styles.fadeInUp}`}
          />
          <Breadcrumb
            ref={breadcrumbRef}
            className={`${styles.breadcrumb} ${styles.fadeInUp}`}
          />
        </>
      )}

      <Swiper
        ref={swiperRef}
        direction="vertical" // 確保滑動方向正確
        speed={1200} // 調整滑動速度
        slidesPerView={1} // 確保每次只顯示一個 slide
        parallax={true}
        pagination={{ clickable: true }}
        modules={[Parallax, Pagination]}
        className={styles.swiperContainer}
        style={{ height: "100vh" }}
        onSwiper={handleSwiperInit}
        onReachBeginning={() => console.log("Reached beginning")} // 檢查邊界
        onReachEnd={() => console.log("Reached end")} // 檢查邊界
      >
        <div
          slot="container-start"
          className={styles.parallaxBg}
          style={{ backgroundImage: "url(/image/activity.jpg)" }}
          data-swiper-parallax="-50%"
        ></div>

        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>必試潛水冒險，精彩不容錯過</h2>
            <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
              {activities.map((activity, index) => {
                const { activityName, location } = splitActivityName(
                  activity.name
                );
                const position = activityPositions[index];
                return (
                  <Link
                    href={`/activity/${activity.id}`}
                    key={index}
                    className={styles.link}
                  >
                    <div
                      className={`${styles.bubble} ${
                        index < visibleCards ? styles.visible : ""
                      }`}
                      style={{
                        backgroundImage: `url(${getImagePath(
                          activity,
                          "activity"
                        )})`,
                        animationDelay: `${index * 0.3}s`,
                        top: position ? `${position.top}px` : "0",
                        left: position ? `${position.left}px` : "0",
                      }}
                    >
                      <div className={styles.bubbleOverlay}></div>
                      <div className={styles.bubbleContent}>
                        <h3 className={styles.location}>{location}</h3>
                        <p className={styles.activityName}>{activityName}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>推薦商品</h2>
            <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
              {products.map((product, index) => {
                const rentProduct = expandedProducts[product?.id];
                const position = productPositions[index];
                return (
                  <div key={index} className={styles.productWrapper}>
                    {!rentProduct && (
                      <div
                        className={`${styles.productBubble} ${
                          visibleProducts[index] ? styles.visible : ""
                        }`}
                        style={{
                          backgroundImage: `url(${getImagePath(
                            product,
                            "product"
                          )})`,
                          animationDelay: `${index * 0.3}s`,
                          top: position ? `${position.top}px` : "0",
                          left: position ? `${position.left}px` : "0",
                        }}
                        onClick={() => handleBubbleClick(product, index)}
                      >
                        <div className={styles.bubbleOverlay}></div>
                        <div className={styles.bubbleContent}>
                          <h3 className={styles.productName}>{product.name}</h3>
                          <p className={styles.productTag}>可購買</p>
                        </div>
                      </div>
                    )}
                    {rentProduct && (
                      <Link
                        href={`/rent/${rentProduct.id}`}
                        className={styles.link}
                      >
                        <div
                          className={`${styles.productBubble} ${styles.visible}`}
                          style={{
                            backgroundImage: `url(${getImagePath(
                              rentProduct,
                              "rent"
                            )})`,
                            animationDelay: "0s",
                            top: position ? `${position.top}px` : "0",
                            left: position ? `${position.left}px` : "0",
                          }}
                        >
                          <div className={styles.bubbleOverlay}></div>
                          <div className={styles.bubbleContent}>
                            <h3 className={styles.productName}>
                              {rentProduct.name}
                            </h3>
                            <p className={styles.productTag}>可租借</p>
                            <p className={styles.productPrice}>
                              {getRentPrice(rentProduct)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SwiperSlide>

        <SwiperSlide className={styles.slide}>
          <div className={styles.welcomeContent} data-swiper-parallax="-200">
            <h2>歡迎來到我們的商城</h2>
            <p className={styles.welcomeDescription}>
              從海底冒險回到海面，現在是選購潛水裝備的最佳時機！探索我們的精選商品，開啟你的下一次旅程。
            </p>
          </div>
        </SwiperSlide>
      </Swiper>

      {swiperInstance?.activeIndex === 2 && (
        <Footer
          ref={footerRef}
          className={`${styles.footer} ${styles.fadeInDown}`}
        />
      )}
    </section>
  );
};

export default MainSection;
