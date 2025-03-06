"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "./ProductSection.module.css";

const ProductSection = () => {
  const productsRef = useRef([]);

  useEffect(() => {
    gsap.from(productsRef.current, {
      x: 100,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
      scrollTrigger: {
        trigger: ".productSection",
        start: "top 80%",
      },
    });
  }, []);

  return (
    <div className={`${styles.productSection} productSection`}>
      <h2>推薦商品</h2>
      <div className={styles.products}>
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            ref={(el) => (productsRef.current[index] = el)}
            className={styles.product}
          >
            <img src={`/image/product${index + 1}.jpg`} alt={`Product ${index + 1}`} />
            <h3>商品 {index + 1}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSection;