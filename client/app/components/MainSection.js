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
import Header from "./Header/header";
import Footer from "./Footer/footer";

const MainSection = ({ scrollToSection }) => {
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [rentProducts, setRentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [burstStates, setBurstStates] = useState({});
  const [activityPositions, setActivityPositions] = useState([]);
  const [productPositions, setProductPositions] = useState([]);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const bubbleContainerRef = useRef(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    const API_BASE_URL = "http://localhost:3005";
    const fetchData = async () => {
      try {
        const activityResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`);
        if (activityResponse.data.status === "success" && Array.isArray(activityResponse.data.data)) {
          setActivities(activityResponse.data.data.slice(0, 4));
          setActivityPositions(new Array(activityResponse.data.data.length).fill(null));
          console.log("[Debug] Fetched activities:", activityResponse.data.data, "Length:", activityResponse.data.data.length);
        }
        const productResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=product`);
        if (productResponse.data.status === "success" && Array.isArray(productResponse.data.data)) {
          console.log("[Debug] Fetched products:", productResponse.data.data, "Length:", productResponse.data.data.length);
          setProducts(productResponse.data.data);
          setVisibleProducts(new Array(productResponse.data.data.length).fill(false));
          setProductPositions(new Array(productResponse.data.data.length).fill(null));
        }
        const rentResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=rent`);
        if (rentResponse.data.status === "success" && Array.isArray(rentResponse.data.data)) {
          console.log("[Debug] Fetched rent products:", rentResponse.data.data, "Length:", rentResponse.data.data.length);
          setRentProducts(rentResponse.data.data);
        }
      } catch (err) {
        console.error("[Debug] Fetch error:", err);
      } finally {
        console.log("[Debug] Data loading completed, loading:", loading);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const setRandomPositionForItem = (index, existingPositions, allPositions, itemSize = 200) => {
    const container = bubbleContainerRef.current;
    if (!container || !container.clientWidth || !container.clientHeight) {
      console.warn("[Debug] bubbleContainerRef is not ready:", container, "Index:", index);
      return { top: 20 + Math.random() * 50, left: 20 + Math.random() * 50 };
    }
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const padding = 20;
    const minSpacing = itemSize + 80;
    let attempts = 0;
    let validPosition = false;
    let top, left;

    console.log("[Debug] Setting position for index:", index, "Container size:", { width: containerWidth, height: containerHeight });

    while (!validPosition && attempts < 500) {
      top = padding + Math.random() * (containerHeight - itemSize - 2 * padding) * (0.3 + Math.random() * 0.7);
      left = padding + Math.random() * (containerWidth - itemSize - 2 * padding) * (0.3 + Math.random() * 0.7);
      if (top < padding) top = padding;
      if (left < padding) left = padding;
      if (top > containerHeight - itemSize - padding) top = containerHeight - itemSize - padding;
      if (left > containerWidth - itemSize - padding) left = containerWidth - itemSize - padding;

      validPosition = allPositions.every((pos) => {
        if (!pos) return true;
        const distance = Math.sqrt(Math.pow(pos.top - top, 2) + Math.pow(pos.left - left, 2));
        return distance >= minSpacing;
      });

      attempts++;
    }

    if (!validPosition) {
      console.warn("[Debug] Failed to find valid position after", attempts, "attempts. Using random fallback.");
      top = padding + Math.random() * (containerHeight - itemSize - 2 * padding);
      left = padding + Math.random() * (containerWidth - itemSize - 2 * padding);
    }

    console.log("[Debug] Final position for index", index, ":", { top, left });
    return { top, left };
  };

  const calculateProductPositions = () => {
    if (!loading && products.length > 0) {
      console.log("[Debug] Calculating product positions, products length:", products.length);
      const allPositions = [
        ...activityPositions.filter((p) => p),
        ...productPositions.filter((p) => p),
      ];
      const newPositions = products.map((_, index) => {
        const product = products[index];
        const rentProduct = expandedProducts[product?.id];
        if ((visibleProducts[index] || rentProduct || swiperInstance?.activeIndex === 1) && !burstStates[index]) {
          if (!productPositions[index] || (rentProduct && !visibleProducts[index])) {
            return setRandomPositionForItem(index, productPositions.filter((p) => p), allPositions);
          }
        }
        return productPositions[index] || { top: 0, left: 0 };
      });
      setProductPositions(newPositions);
      console.log("[Debug] Product positions set, length:", newPositions.length, "Positions:", newPositions);
    }
  };

  useEffect(() => {
    if (!loading && activities.length > 0 && swiperInstance?.activeIndex === 0) {
      console.log("[Debug] Updating activity positions, activities length:", activities.length, "visibleCards:", visibleCards);
      const newPositions = Array(activities.length).fill(null).map((pos, index) => {
        if (index < visibleCards && !activityPositions[index]) {
          return setRandomPositionForItem(index, activityPositions.filter((p) => p), [
            ...activityPositions.filter((p) => p),
            ...productPositions.filter((p) => p),
          ]);
        }
        return activityPositions[index] || pos;
      });
      setActivityPositions(newPositions);
    }
  }, [visibleCards, activities, loading, swiperInstance]);

  useEffect(() => {
    if (!loading && products.length > 0 && swiperInstance?.activeIndex === 1) {
      console.log("[Debug] Triggering calculateProductPositions, products length:", products.length);
      calculateProductPositions();
    }
  }, [visibleProducts, products, expandedProducts, burstStates, loading, swiperInstance]);

  const handleSwiperInit = (swiper) => {
    console.log("[Debug] Swiper initialized, swiper instance:", swiper);
    setSwiperInstance(swiper);
  };

  useEffect(() => {
    if (!swiperInstance) return;

    const handleWheel = (e) => {
      console.log("[Debug] Wheel event - deltaY:", e.deltaY, "activeIndex:", swiperInstance.activeIndex, "visibleCards:", visibleCards);
      const activeIndex = swiperInstance.activeIndex;

      if (activeIndex === 0) {
        if (e.deltaY > 0) {
          if (visibleCards < activities.length) {
            e.preventDefault();
            setVisibleCards((prev) => {
              const newValue = prev + 1;
              console.log("[Debug] Increasing visibleCards to:", newValue);
              return newValue;
            });
          } else if (!swiperInstance.isEnd) {
            console.log("[Debug] Sliding to next slide");
            swiperInstance.slideNext();
          }
        } else if (e.deltaY < 0) {
          if (visibleCards > 0) {
            e.preventDefault();
            setVisibleCards((prev) => {
              const newValue = prev - 1;
              console.log("[Debug] Decreasing visibleCards to:", newValue);
              return newValue;
            });
          } else {
            console.log("[Debug] Triggering scroll to HeroSection");
            swiperInstance.params.speed = 0;
            scrollToSection();
            swiperInstance.params.speed = 1200;
          }
        }
      } else {
        if (e.deltaY > 0 && !swiperInstance.isEnd) {
          e.preventDefault();
          console.log("[Debug] Sliding to next slide");
          swiperInstance.slideNext();
        } else if (e.deltaY < 0 && !swiperInstance.isBeginning) {
          e.preventDefault();
          console.log("[Debug] Sliding to previous slide");
          swiperInstance.slidePrev();
        }
      }
    };

    swiperInstance.on("transitionStart", () => {
      console.log("[Debug] Transition started, activeIndex:", swiperInstance.activeIndex);
      document.body.style.overflow = "hidden";
    });

    swiperInstance.on("transitionEnd", () => {
      console.log("[Debug] Transition ended, activeIndex:", swiperInstance.activeIndex);
      const activeIndex = swiperInstance.activeIndex;
      document.body.style.overflow = activeIndex === 2 ? "auto" : "hidden";
    });

    swiperInstance.on("slideChange", () => {
      const activeIndex = swiperInstance.activeIndex;
      console.log("[Debug] Slide changed to:", activeIndex, "headerRef:", headerRef.current, "footerRef:", footerRef.current);

      slideRefs.current.forEach((slide, index) => {
        if (slide) {
          slide.style.overflowY = index === 2 && activeIndex === 2 ? "auto" : "hidden";
        }
      });

      if (activeIndex !== 2) {
        if (headerRef.current) {
          headerRef.current.style.display = "none";
          headerRef.current.classList.remove(styles.fadeInUp);
        }
        if (footerRef.current) {
          footerRef.current.style.display = "none";
          footerRef.current.classList.remove(styles.fadeInDown);
        }
      } else if (activeIndex === 2) {
        console.log("[Debug] Attempting to show Header and Footer");
        if (headerRef.current) {
          headerRef.current.style.display = "block";
          headerRef.current.classList.remove(styles.fadeInUp);
          setTimeout(() => {
            headerRef.current.classList.add(styles.fadeInUp);
            console.log("[Debug] Header fadeInUp added");
          }, 10);
        } else {
          console.warn("[Debug] headerRef is null");
        }
        if (footerRef.current) {
          footerRef.current.style.display = "block";
          footerRef.current.classList.remove(styles.fadeInDown);
          setTimeout(() => {
            footerRef.current.classList.add(styles.fadeInDown);
            console.log("[Debug] Footer fadeInDown added");
          }, 10);
        } else {
          console.warn("[Debug] footerRef is null");
        }
      }

      if (activeIndex === 0) {
        setVisibleCards(activities.length > 0 ? 1 : 0);
        console.log("[Debug] Set visibleCards to:", activities.length > 0 ? 1 : 0, "for activity slide");
      } else {
        setVisibleCards(0);
        console.log("[Debug] Set visibleCards to 0 for non-activity slide");
      }

      if (activeIndex === 1) {
        console.log("[Debug] Entering product slide, products length:", products.length);
        calculateProductPositions();
        setVisibleProducts(products.map(() => false));
        let index = 0;
        const interval = setInterval(() => {
          setVisibleProducts((prev) => {
            const newVisible = [...prev];
            if (index < products.length) {
              newVisible[index] = true;
              console.log("[Debug] Activating bubble at index:", index, "Product:", products[index], "Visible products:", newVisible);
              index++;
            }
            if (index === products.length) {
              clearInterval(interval);
              console.log("[Debug] All bubbles activated, total:", products.length, "Visible products state:", newVisible);
            }
            return newVisible;
          });
        }, 300);
      } else {
        console.log("[Debug] Leaving product slide, resetting states");
        setVisibleProducts(products.map(() => false));
        setExpandedProducts({});
        setBurstStates({});
        setProductPositions(products.map(() => null));
      }
    });

    const swiperContainer = swiperRef.current;
    if (swiperContainer) {
      swiperContainer.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (swiperContainer) {
        swiperContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, [swiperInstance, visibleCards, activities.length, products, scrollToSection]);

  const getImagePath = (item, category) => {
    const defaultImage = "/image/rent/no-img.png";
    if (!item || !item.main_image) {
      console.warn("[Debug] Missing item data for image path:", { item, category });
      return defaultImage;
    }  
    if (category === "rent") {
      return item.main_image || defaultImage;
    } else if (category === "activity") {
      if (!item.id) {
        console.warn("[Debug] Missing item.id for activity image path:", { item });
        return defaultImage;
      }
      return `/image/activity/${item.id}/${item.main_image}` || defaultImage;
    } else if (category === "product") {
      return `/image/product/${item.main_image}` || defaultImage;
    }

    console.warn("[Debug] Unknown category for image path:", category);
    return defaultImage;
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
    console.log("[Debug] Bubble clicked, product:", product, "index:", index, "Current expandedProducts:", expandedProducts);
    setBurstStates((prev) => ({
      ...prev,
      [index]: true,
    }));

    setTimeout(() => {
      console.log("[Debug] Searching for rent product, product name:", product.name, "rentProducts:", rentProducts);
      const rentProduct = rentProducts.find((rent) => rent.name === product.name);
      if (rentProduct) {
        console.log("[Debug] Found matching rent product:", rentProduct);
        setExpandedProducts((prev) => ({
          ...prev,
          [product.id]: rentProduct,
        }));
        setProductPositions((prev) => {
          const updated = [...prev];
          updated[index] = null;
          console.log("[Debug] Updated product position at index:", index, "New position:", updated[index]);
          return updated;
        });
        setVisibleProducts((prev) => {
          const newVisible = [...prev];
          newVisible[index] = true;
          console.log("[Debug] Updated visible products at index:", index, "New visible state:", newVisible);
          return newVisible;
        });
      } else {
        console.warn("[Debug] No matching rent product found for:", product.name, "rentProducts:", rentProducts);
      }
      setBurstStates((prev) => ({
        ...prev,
        [index]: false,
      }));
      console.log("[Debug] Burst state reset for index:", index, "New burstStates:", burstStates);
    }, 300);
  };

  if (loading) return <div className={styles.loading}>資料加載中...</div>;

  return (
    <section className={styles.mainSection}>
      <Header ref={headerRef} className={`${styles.header} ${swiperInstance?.activeIndex === 2 ? styles.visible : styles.hidden} ${styles.debug}`} />

      <Swiper
        ref={swiperRef}
        direction="vertical"
        speed={1200}
        slidesPerView={1}
        parallax={true}
        pagination={{ clickable: true }}
        modules={[Parallax, Pagination]}
        className={styles.swiperContainer}
        style={{ height: "100vh" }}
        onSwiper={handleSwiperInit}
      >
        <div
          slot="container-start"
          className={styles.parallaxBg}
          style={{ backgroundImage: "url(/image/activity.jpg)" }}
          data-swiper-parallax="-50%"
        ></div>

        <SwiperSlide ref={(el) => (slideRefs.current[0] = el)} className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>必試潛水冒險，精彩不容錯過</h2>
            <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
              {activities.map((activity, index) => {
                const { activityName, location } = splitActivityName(activity.name);
                const position = activityPositions[index];
                return (
                  <Link href={`/activity/${activity.id}`} key={index} className={styles.link}>
                    <div
                      className={`${styles.bubble} ${index < visibleCards ? styles.visible : ""}`}
                      style={{
                        backgroundImage: `url(${getImagePath(activity, "activity")})`,
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

        <SwiperSlide ref={(el) => (slideRefs.current[1] = el)} className={styles.slide}>
          <div className={styles.content} data-swiper-parallax="-200">
            <h2>精選潛水好物，打造極致潛水體驗</h2>
            <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
              {products.map((product, index) => {
                const rentProduct = expandedProducts[product?.id];
                const position = productPositions[index];
                const isBursting = burstStates[index];
                return (
                  <div key={index} className={styles.productWrapper}>
                    {!rentProduct && (
                      <div
                        className={`${styles.productBubble} ${visibleProducts[index] ? styles.visible : ""} ${isBursting ? styles.burst : ""}`}
                        style={{
                          backgroundImage: `url(${getImagePath(product, "product")})`,
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
                      <Link href={`/rent/${rentProduct.id}`} className={styles.link}>
                        <div
                          className={`${styles.productBubble} ${styles.visible}`}
                          style={{
                            backgroundImage: `url(${getImagePath(rentProduct, "rent")})`,
                            animationDelay: "0s",
                            top: position ? `${position.top}px` : "0",
                            left: position ? `${position.left}px` : "0",
                          }}
                        >
                          <div className={styles.bubbleOverlay}></div>
                          <div className={styles.bubbleContent}>
                            <h3 className={styles.productName}>{rentProduct.name}</h3>
                            <p className={styles.productTag}>可租借</p>
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

        <SwiperSlide ref={(el) => (slideRefs.current[2] = el)} className={styles.slide}>
          <div className={styles.welcomeContent} data-swiper-parallax="-200">
            <h2>專業、品質、透明，與 DiveIn 共潛海洋之美</h2>
            <p className={styles.welcomeDescription}>
              我們承諾陪您探索深海的靜謐，以精選專業潛水裝備，讓您的每一次旅程更加安心與美好。
            </p>
          </div>
        </SwiperSlide>
      </Swiper>

      <Footer
        ref={footerRef}
        className={`${styles.footer} ${swiperInstance?.activeIndex === 2 ? styles.visible : styles.hidden} ${styles.debug}`}
      />
    </section>
  );
};

export default MainSection;