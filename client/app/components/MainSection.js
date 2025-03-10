// "use client";

// import React, { useRef, useEffect, useState } from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Parallax, Pagination } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/parallax";
// import "swiper/css/pagination";
// import styles from "./MainSection.module.css";
// import axios from "axios";
// import Link from "next/link";
// import Header from "./Header"; // 假設這是新的 Header 組件路徑
// // import Footer from "./footer"; // 假設這是新的 Footer 組件路徑

// const MainSection = ({ scrollToSection }) => {
//   const [activities, setActivities] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [rentProducts, setRentProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [visibleCards, setVisibleCards] = useState(0);
//   const [visibleProducts, setVisibleProducts] = useState([]);
//   const [expandedProducts, setExpandedProducts] = useState({});
//   const [burstStates, setBurstStates] = useState({});
//   const [activityPositions, setActivityPositions] = useState([]);
//   const [productPositions, setProductPositions] = useState([]);
//   const [swiperInstance, setSwiperInstance] = useState(null);
//   const swiperRef = useRef(null);
//   const bubbleContainerRef = useRef(null);
//   const slideRefs = useRef([]);

//   useEffect(() => {
//     const API_BASE_URL = "http://localhost:3005";
//     const fetchData = async () => {
//       try {
//         const activityResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=activity&type=all`);
//         if (activityResponse.data.status === "success" && Array.isArray(activityResponse.data.data)) {
//           setActivities(activityResponse.data.data.slice(0, 4));
//           setActivityPositions(new Array(activityResponse.data.data.length).fill(null));
//         }
//         const productResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=product`);
//         if (productResponse.data.status === "success" && Array.isArray(productResponse.data.data)) {
//           setProducts(productResponse.data.data);
//           setVisibleProducts(new Array(productResponse.data.data.length).fill(false));
//           setProductPositions(new Array(productResponse.data.data.length).fill(null));
//         }
//         const rentResponse = await axios.get(`${API_BASE_URL}/api/homeRecommendations?category=rent`);
//         if (rentResponse.data.status === "success" && Array.isArray(rentResponse.data.data)) {
//           setRentProducts(rentResponse.data.data);
//         }
//       } catch (err) {
//         console.error("[Debug] Fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const setRandomPositionForItem = (index, existingPositions, allPositions, itemSize = 200) => {
//     const container = bubbleContainerRef.current;
//     if (!container || !container.clientWidth || !container.clientHeight) {
//       return { top: 20 + Math.random() * 50, left: 20 + Math.random() * 50 };
//     }
//     const containerWidth = container.clientWidth;
//     const containerHeight = container.clientHeight;
//     const padding = 20;
//     const minSpacing = itemSize + 80;
//     let attempts = 0;
//     let validPosition = false;
//     let top, left;

//     while (!validPosition && attempts < 500) {
//       top = padding + Math.random() * (containerHeight - itemSize - 2 * padding) * (0.3 + Math.random() * 0.7);
//       left = padding + Math.random() * (containerWidth - itemSize - 2 * padding) * (0.3 + Math.random() * 0.7);
//       if (top < padding) top = padding;
//       if (left < padding) left = padding;
//       if (top > containerHeight - itemSize - padding) top = containerHeight - itemSize - padding;
//       if (left > containerWidth - itemSize - padding) left = containerWidth - itemSize - padding;

//       validPosition = allPositions.every((pos) => {
//         if (!pos) return true;
//         const distance = Math.sqrt(Math.pow(pos.top - top, 2) + Math.pow(pos.left - left, 2));
//         return distance >= minSpacing;
//       });

//       attempts++;
//     }

//     if (!validPosition) {
//       top = padding + Math.random() * (containerHeight - itemSize - 2 * padding);
//       left = padding + Math.random() * (containerWidth - itemSize - 2 * padding);
//     }

//     return { top, left };
//   };

//   const calculateProductPositions = () => {
//     if (!loading && products.length > 0) {
//       const allPositions = [
//         ...activityPositions.filter((p) => p),
//         ...productPositions.filter((p) => p),
//       ];
//       const newPositions = products.map((_, index) => {
//         const product = products[index];
//         const rentProduct = expandedProducts[product?.id];
//         if ((visibleProducts[index] || rentProduct || swiperInstance?.activeIndex === 1) && !burstStates[index]) {
//           if (!productPositions[index] || (rentProduct && !visibleProducts[index])) {
//             return setRandomPositionForItem(index, productPositions.filter((p) => p), allPositions);
//           }
//         }
//         return productPositions[index] || { top: 0, left: 0 };
//       });
//       setProductPositions(newPositions);
//     }
//   };

//   useEffect(() => {
//     if (!loading && activities.length > 0 && swiperInstance?.activeIndex === 0) {
//       const newPositions = Array(activities.length)
//         .fill(null)
//         .map((pos, index) => {
//           if (index < visibleCards && !activityPositions[index]) {
//             return setRandomPositionForItem(index, activityPositions.filter((p) => p), [
//               ...activityPositions.filter((p) => p),
//               ...productPositions.filter((p) => p),
//             ]);
//           }
//           return activityPositions[index] || pos;
//         });
//       setActivityPositions(newPositions);
//     }
//   }, [visibleCards, activities, loading, swiperInstance]);

//   useEffect(() => {
//     if (!loading && products.length > 0 && swiperInstance?.activeIndex === 1) {
//       calculateProductPositions();
//     }
//   }, [visibleProducts, products, expandedProducts, burstStates, loading, swiperInstance]);

//   const handleSwiperInit = (swiper) => {
//     setSwiperInstance(swiper);
//   };

//   useEffect(() => {
//     if (!swiperInstance) return;

//     const handleWheel = (e) => {
//       const activeIndex = swiperInstance.activeIndex;

//       if (activeIndex === 0) {
//         if (e.deltaY > 0) {
//           if (visibleCards < activities.length) {
//             e.preventDefault();
//             setVisibleCards((prev) => prev + 1);
//           } else if (!swiperInstance.isEnd) {
//             swiperInstance.slideNext();
//           }
//         } else if (e.deltaY < 0) {
//           if (visibleCards > 0) {
//             e.preventDefault();
//             setVisibleCards((prev) => prev - 1);
//           } else {
//             swiperInstance.params.speed = 0;
//             scrollToSection();
//             swiperInstance.params.speed = 1200;
//           }
//         }
//       } else {
//         if (e.deltaY > 0 && !swiperInstance.isEnd) {
//           e.preventDefault();
//           swiperInstance.slideNext();
//         } else if (e.deltaY < 0 && !swiperInstance.isBeginning) {
//           e.preventDefault();
//           swiperInstance.slidePrev();
//         }
//       }
//     };

//     swiperInstance.on("transitionStart", () => {
//       document.body.style.overflow = "hidden";
//     });

//     swiperInstance.on("transitionEnd", () => {
//       const activeIndex = swiperInstance.activeIndex;
//       document.body.style.overflow = activeIndex === 2 ? "auto" : "hidden";
//     });

//     swiperInstance.on("slideChange", () => {
//       const activeIndex = swiperInstance.activeIndex;

//       slideRefs.current.forEach((slide, index) => {
//         if (slide) {
//           slide.style.overflowY = index === 2 && activeIndex === 2 ? "auto" : "hidden";
//         }
//       });

//       if (activeIndex === 0) {
//         setVisibleCards(activities.length > 0 ? 1 : 0);
//       } else {
//         setVisibleCards(0);
//       }

//       if (activeIndex === 1) {
//         calculateProductPositions();
//         setVisibleProducts(products.map(() => false));
//         let index = 0;
//         const interval = setInterval(() => {
//           setVisibleProducts((prev) => {
//             const newVisible = [...prev];
//             if (index < products.length) {
//               newVisible[index] = true;
//               index++;
//             }
//             if (index === products.length) {
//               clearInterval(interval);
//             }
//             return newVisible;
//           });
//         }, 300);
//       } else {
//         setVisibleProducts(products.map(() => false));
//         setExpandedProducts({});
//         setBurstStates({});
//         setProductPositions(products.map(() => null));
//       }
//     });

//     const swiperContainer = swiperRef.current;
//     if (swiperContainer) {
//       swiperContainer.addEventListener("wheel", handleWheel, { passive: false });
//     }

//     return () => {
//       if (swiperContainer) {
//         swiperContainer.removeEventListener("wheel", handleWheel);
//       }
//     };
//   }, [swiperInstance, visibleCards, activities.length, products, scrollToSection]);

//   const getImagePath = (item, category) => {
//     const defaultImage = "/image/rent/no-img.png";
//     if (!item || !item.main_image) return defaultImage;

//     const cleanImageName = item.main_image.replace(/\s+/g, "").replace(/[()]/g, "");

//     switch (category) {
//       case "rent":
//         return item.main_image || defaultImage;
//       case "activity":
//         return `/image/activity/${item.id}/${cleanImageName}` || defaultImage;
//       case "product":
//         return `/image/product/${cleanImageName}` || defaultImage;
//       default:
//         return defaultImage;
//     }
//   };

//   const splitActivityName = (name) => {
//     const parts = name.split("｜");
//     return { location: parts[0], activityName: parts[1] };
//   };

//   const getRentPrice = (product) => {
//     return product.price2 !== null && product.price2 !== undefined
//       ? `NT$${product.price2}/天`
//       : `NT$${product.price}/天`;
//   };

//   const handleBubbleClick = (product, index) => {
//     setBurstStates((prev) => ({ ...prev, [index]: true }));

//     setTimeout(() => {
//       const rentProduct = rentProducts.find((rent) => rent.name === product.name);
//       if (rentProduct) {
//         setExpandedProducts((prev) => ({ ...prev, [product.id]: rentProduct }));
//         setProductPositions((prev) => {
//           const updated = [...prev];
//           updated[index] = null;
//           return updated;
//         });
//         setVisibleProducts((prev) => {
//           const newVisible = [...prev];
//           newVisible[index] = true;
//           return newVisible;
//         });
//       }
//       setBurstStates((prev) => ({ ...prev, [index]: false }));
//     }, 300);
//   };

//   if (loading) return <div className={styles.loading}>資料加載中...</div>;

//   return (
//     <section className={styles.mainSection}>
//       {/* 條件渲染 Header，僅在最後一頁顯示 */}
//       {swiperInstance?.activeIndex === 2 && (
//         <Header className={`${styles.header} ${styles.fadeIn}`} />
//       )}

//       <Swiper
//         ref={swiperRef}
//         direction="vertical"
//         speed={1200}
//         slidesPerView={1}
//         parallax={true}
//         pagination={{ clickable: true }}
//         modules={[Parallax, Pagination]}
//         className={styles.swiperContainer}
//         style={{ height: "100vh" }}
//         onSwiper={handleSwiperInit}
//       >
//         <div
//           slot="container-start"
//           className={styles.parallaxBg}
//           style={{ backgroundImage: "url(/image/activity.jpg)" }}
//           data-swiper-parallax="-50%"
//         ></div>

//         <SwiperSlide ref={(el) => (slideRefs.current[0] = el)} className={styles.slide}>
//           <div className={styles.content} data-swiper-parallax="-200">
//             <h2>必試潛水冒險，精彩不容錯過</h2>
//             <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
//               {activities.map((activity, index) => {
//                 const { activityName, location } = splitActivityName(activity.name);
//                 const position = activityPositions[index];
//                 return (
//                   <Link href={`/activity/${activity.id}`} key={index} className={styles.link}>
//                     <div
//                       className={`${styles.bubble} ${index < visibleCards ? styles.visible : ""}`}
//                       style={{
//                         backgroundImage: `url(${getImagePath(activity, "activity")})`,
//                         animationDelay: `${index * 0.3}s`,
//                         top: position ? `${position.top}px` : "0",
//                         left: position ? `${position.left}px` : "0",
//                       }}
//                     >
//                       <div className={styles.bubbleOverlay}></div>
//                       <div className={styles.bubbleContent}>
//                         <h3 className={styles.location}>{location}</h3>
//                         <p className={styles.activityName}>{activityName}</p>
//                       </div>
//                     </div>
//                   </Link>
//                 );
//               })}
//             </div>
//           </div>
//         </SwiperSlide>

//         <SwiperSlide ref={(el) => (slideRefs.current[1] = el)} className={styles.slide}>
//           <div className={styles.content} data-swiper-parallax="-200">
//             <h2>精選潛水好物，打造極致潛水體驗</h2>
//             <div className={styles.bubbleContainer} ref={bubbleContainerRef}>
//               {products.map((product, index) => {
//                 const rentProduct = expandedProducts[product?.id];
//                 const position = productPositions[index];
//                 const isBursting = burstStates[index];
//                 return (
//                   <div key={index} className={styles.productWrapper}>
//                     {!rentProduct && (
//                       <div
//                         className={`${styles.productBubble} ${visibleProducts[index] ? styles.visible : ""} ${isBursting ? styles.burst : ""}`}
//                         style={{
//                           backgroundImage: `url(${getImagePath(product, "product")})`,
//                           animationDelay: `${index * 0.3}s`,
//                           top: position ? `${position.top}px` : "0",
//                           left: position ? `${position.left}px` : "0",
//                         }}
//                         onClick={() => handleBubbleClick(product, index)}
//                       >
//                         <div className={styles.bubbleOverlay}></div>
//                         <div className={styles.bubbleContent}>
//                           <h3 className={styles.productName}>{product.name}</h3>
//                           <p className={styles.productTag}>可購買</p>
//                         </div>
//                       </div>
//                     )}
//                     {rentProduct && (
//                       <Link href={`/rent/${rentProduct.id}`} className={styles.link}>
//                         <div
//                           className={`${styles.productBubble} ${styles.visible}`}
//                           style={{
//                             backgroundImage: `url(${getImagePath(rentProduct, "rent")})`,
//                             animationDelay: "0s",
//                             top: position ? `${position.top}px` : "0",
//                             left: position ? `${position.left}px` : "0",
//                           }}
//                         >
//                           <div className={styles.bubbleOverlay}></div>
//                           <div className={styles.bubbleContent}>
//                             <h3 className={styles.productName}>{rentProduct.name}</h3>
//                             <p className={styles.productTag}>可租借</p>
//                             <p className={styles.productPrice}>{getRentPrice(rentProduct)}</p>
//                           </div>
//                         </div>
//                       </Link>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </SwiperSlide>

//         <SwiperSlide ref={(el) => (slideRefs.current[2] = el)} className={styles.slide}>
//           <div className={styles.welcomeContent} data-swiper-parallax="-200">
//             <h2>專業、品質、透明，與 DiveIn 共潛海洋之美</h2>
//             <p className={styles.welcomeDescription}>
//               我們承諾陪您探索深海的靜謐，以精選專業潛水裝備，讓您的每一次旅程更加安心與美好。
//             </p>
//           </div>
//         </SwiperSlide>
//       </Swiper>

//       {/* 條件渲染 Footer，僅在最後一頁顯示 */}
//       {/* {swiperInstance?.activeIndex === 2 && (
//         <Footer className={`${styles.footer} ${styles.fadeIn}`} />
//       )} */}
//     </section>
//   );
// };

// export default MainSection;