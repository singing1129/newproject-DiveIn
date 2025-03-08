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

const MainSection = () => {
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [rentProducts, setRentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [activityPositions, setActivityPositions] = useState([]);
  const [productPositions, setProductPositions] = useState([]);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";
    const fetchData = async () => {
      try {
        const activityResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`
        );
        if (activityResponse.data.status === "success" && Array.isArray(activityResponse.data.data)) {
          setActivities(activityResponse.data.data.slice(0, 4));
          setActivityPositions(new Array(activityResponse.data.data.length).fill(null));
        }

        const productResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=product`
        );
        if (productResponse.data.status === "success" && Array.isArray(productResponse.data.data)) {
          setProducts(productResponse.data.data.slice(0, 4));
          setVisibleProducts(new Array(productResponse.data.data.length).fill(false));
          setProductPositions(new Array(productResponse.data.data.length).fill(null));
        }

        const rentResponse = await axios.get(
          `${API_BASE_URL}/api/homeRecommendations?category=rent`
        );
        if (rentResponse.data.status === "success" && Array.isArray(rentResponse.data.data)) {
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

  // 隨機分散氣泡位置並限制在容器內
  const setRandomPositionForItem = (item, existingPositions, containerSelector, itemSize = 200) => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log(`[Debug] Container not found for selector: ${containerSelector}`);
      return { top: 0, left: 0 };
    }

    const slide = document.querySelector(`.${styles.slide}`);
    const content = document.querySelector(`.${styles.content}`);
    const slideWidth = slide.clientWidth;
    const slideHeight = slide.clientHeight;
    const contentPadding = parseInt(getComputedStyle(content).padding) || 20;
    const containerWidth = container.clientWidth - 2 * contentPadding;
    const containerHeight = container.clientHeight - 2 * contentPadding;

    console.log(`[Debug] Slide size - Width: ${slideWidth}px, Height: ${slideHeight}px`);
    console.log(`[Debug] Adjusted Container size - Width: ${containerWidth}px, Height: ${containerHeight}px`);

    const padding = 20;
    const minSpacing = 20;
    let attempts = 0;
    let validPosition = false;
    let top, left;

    while (!validPosition && attempts < 50) {
      top = padding + Math.random() * (containerHeight - itemSize - 2 * padding);
      left = padding + Math.random() * (containerWidth - itemSize - 2 * padding);

      if (top < padding) top = padding;
      if (left < padding) left = padding;
      if (top > containerHeight - itemSize - padding) top = containerHeight - itemSize - padding;
      if (left > containerWidth - itemSize - padding) left = containerWidth - itemSize - padding;

      validPosition = existingPositions.every((pos) => {
        if (!pos) return true;
        const distance = Math.sqrt(Math.pow(pos.top - top, 2) + Math.pow(pos.left - left, 2));
        return distance >= itemSize + minSpacing;
      });

      attempts++;
    }

    console.log(`[Debug] Bubble position - Top: ${top}px, Left: ${left}px, Attempts: ${attempts}`);
    item.style.top = `${top}px`;
    item.style.left = `${left}px`;
    return { top, left };
  };

  // 活動氣泡位置處理
  useEffect(() => {
    if (!loading && activities.length > 0 && swiperInstance?.activeIndex === 0) {
      setTimeout(() => {
        const bubbles = document.querySelectorAll(`.${styles.bubble}`);
        bubbles.forEach((bubble, index) => {
          if (index < visibleCards && !activityPositions[index]) {
            const newPosition = setRandomPositionForItem(
              bubble,
              activityPositions.filter((pos) => pos),
              `.${styles.slide}:nth-child(1) .${styles.bubbleContainer}`
            );
            setActivityPositions((prev) => {
              const updated = [...prev];
              updated[index] = newPosition;
              return updated;
            });
          } else if (activityPositions[index]) {
            bubble.style.top = `${activityPositions[index].top}px`;
            bubble.style.left = `${activityPositions[index].left}px`;
          }
        });
      }, 100);
    }
  }, [visibleCards, activities, loading, swiperInstance]);

  // 商品氣泡位置處理
  useEffect(() => {
    if (!loading && products.length > 0 && swiperInstance?.activeIndex === 1) {
      setTimeout(() => {
        const bubbles = document.querySelectorAll(`.${styles.productBubble}`);
        console.log(`[Debug] Number of product bubbles: ${bubbles.length}`);
        bubbles.forEach((bubble, index) => {
          const product = products[index];
          const rentProduct = expandedProducts[product?.id];

          if (visibleProducts[index] && !rentProduct && !productPositions[index]) {
            const newPosition = setRandomPositionForItem(
              bubble,
              productPositions.filter((pos) => pos),
              `.${styles.slide}:nth-child(2) .${styles.bubbleContainer}`
            );
            setProductPositions((prev) => {
              const updated = [...prev];
              updated[index] = newPosition;
              return updated;
            });
          } else if (rentProduct && productPositions[index]) {
            const newPosition = setRandomPositionForItem(
              bubble,
              productPositions.filter((pos) => pos && pos !== productPositions[index]),
              `.${styles.slide}:nth-child(2) .${styles.bubbleContainer}`
            );
            setProductPositions((prev) => {
              const updated = [...prev];
              updated[index] = newPosition;
              return updated;
            });
          } else if (productPositions[index]) {
            bubble.style.top = `${productPositions[index].top}px`;
            bubble.style.left = `${productPositions[index].left}px`;
          }
        });
      }, 100);
    }
  }, [visibleProducts, products, expandedProducts, loading, swiperInstance]);

  const handleSwiperInit = (swiper) => {
    setSwiperInstance(swiper);
  };

  useEffect(() => {
    if (!swiperInstance) return;

    const handleWheel = (e) => {
      const activeIndex = swiperInstance.activeIndex;
      if (activeIndex === 0 && (visibleCards > 0 || e.deltaY > 0)) {
        e.preventDefault();
      }

      if (activeIndex === 0) {
        if (e.deltaY > 0) {
          if (visibleCards < activities.length) setVisibleCards((prev) => prev + 1);
          else swiperInstance.slideNext();
        } else if (e.deltaY < 0 && visibleCards > 0) {
          setVisibleCards((prev) => prev - 1);
        } else if (e.deltaY < 0 && visibleCards === 0) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        if (e.deltaY > 0) swiperInstance.slideNext();
        else if (e.deltaY < 0) swiperInstance.slidePrev();
      }
    };

    const swiperContainer = document.querySelector(`.${styles.swiperContainer}`);
    if (swiperContainer) swiperContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      if (swiperContainer) swiperContainer.removeEventListener("wheel", handleWheel);
    };
  }, [swiperInstance, visibleCards, activities.length]);

  useEffect(() => {
    if (!swiperInstance) return;

    swiperInstance.on("slideChange", () => {
      const activeIndex = swiperInstance.activeIndex;
      setShowMoreButton(activeIndex === 2);
      if (activeIndex !== 0) setVisibleCards(0);
      if (activeIndex === 1) {
        setVisibleProducts(products.map(() => true));
      } else {
        setVisibleProducts(products.map(() => false));
        setExpandedProducts({});
        setProductPositions(products.map(() => null));
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
    const bubble = document.querySelectorAll(`.${styles.productBubble}`)[index];
    if (bubble) {
      bubble.classList.add(styles.burst);
      bubble.addEventListener("animationend", () => {
        const rentProduct = rentProducts.find((rent) => rent.name === product.name);
        if (rentProduct) {
          setExpandedProducts((prev) => ({
            ...prev,
            [product.id]: rentProduct,
          }));
        }
      }, { once: true });
    }
  };

  if (loading) return <div className={styles.loading}>資料加載中...</div>;

  return (
    <section className={styles.mainSection}>
      <Swiper
        ref={swiperRef}
        direction="vertical"
        speed={1200}
        slidesPerView={1}
        parallax={true}
        pagination={{ clickable: true }}
        modules={[Parallax, Pagination]}
        className={styles.swiperContainer}
        onSwiper={handleSwiperInit}
      >
        <div
          slot="container-start"
          className={styles.parallaxBg}
          style={{ backgroundImage: "url(/image/activity.jpg)" }}
          data-swiper-parallax="-50%"
        ></div>

        {/* 第一頁：活動 */}
        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>必試潛水冒險，精彩不容錯過</h2>
            <div className={styles.bubbleContainer}>
              {activities.map((activity, index) => {
                const { activityName, location } = splitActivityName(activity.name);
                return (
                  <Link href={`/activity/${activity.id}`} key={index} className={styles.link}>
                    <div
                      className={`${styles.bubble} ${index < visibleCards ? styles.visible : ""}`}
                      style={{
                        backgroundImage: `url(${getImagePath(activity, "activity")})`,
                        animationDelay: `${index * 0.3}s`,
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

        {/* 第二頁：商品/租借 */}
        <SwiperSlide className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>推薦商品</h2>
            <div className={styles.bubbleContainer}>
              {products.map((product, index) => {
                const rentProduct = expandedProducts[product.id];
                return (
                  <div key={index} className={styles.productWrapper}>
                    {!rentProduct && (
                      <div
                        className={`${styles.productBubble} ${visibleProducts[index] ? styles.visible : ""}`}
                        style={{
                          backgroundImage: `url(${getImagePath(product, "product")})`,
                          animationDelay: `${index * 0.3}s`,
                        }}
                        onClick={() => handleBubbleClick(product, index)}
                      >
                        <div className={styles.bubbleOverlay}></div>
                        <div className={styles.bubbleContent}>
                          <h3 className={styles.productName}>{product.name}</h3>
                        </div>
                      </div>
                    )}
                    {rentProduct && (
                      <Link href={`/rent/${rentProduct.id}`} className={styles.link}>
                        <div
                          className={`${styles.productBubble} ${styles.visible}`}
                          style={{
                            backgroundImage: `url(${getImagePath(rentProduct, "rent")})`,
                            animationDelay: "0s",
                          }}
                        >
                          <div className={styles.bubbleOverlay}></div>
                          <div className={styles.bubbleContent}>
                            <h3 className={styles.productName}>{rentProduct.name}</h3>
                            <p className={styles.productPrice}>{getRentPrice(rentProduct)}</p>
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

        {/* 第三頁 */}
        <SwiperSlide className={styles.slide}>
          <div className={styles.welcomeContent} data-swiper-parallax="-200">
            <h2>打開你的新視界</h2>
          </div>
        </SwiperSlide>

        {showMoreButton && (
          <Link
            href="/activity"
            className={`${styles.moreButton} ${showMoreButton ? styles.visible : ""}`}
          >
            查看更多
          </Link>
        )}
      </Swiper>
    </section>
  );
};

export default MainSection;