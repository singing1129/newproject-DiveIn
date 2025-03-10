"use client";
import { FaMapMarkerAlt, FaPhoneAlt, FaRegEnvelope, FaAngleDown } from "react-icons/fa";
import React, { forwardRef } from "react";
import styles from "./Footer.module.css";

const Footer = forwardRef((props, ref) => {
  return (
    <footer ref={ref} className={`${styles.footer} ${props.className || ""}`}>
      <div className={`${styles.footerContent} container`}>
        <div className={styles.footerTop}>
          {/* Logo 區塊 */}
          <div className={styles.footerLogo}>
            <img src="/image/DiveIn-logo-light-final.png" alt="DiveIn Logo" />
          </div>

          {/* 電腦版網站地圖與資訊 */}
          <div className={styles.footerColumns}>
            <div className={styles.footerColumn}>
              <h6 className={styles.columnTitle}>網站地圖</h6>
              <ul className={styles.footerList}>
                <li><a href="#" className={styles.footerLink}>活動列表</a></li>
                <li><a href="#" className={styles.footerLink}>課程列表</a></li>
                <li><a href="#" className={styles.footerLink}>商品列表</a></li>
                <li><a href="#" className={styles.footerLink}>租賃列表</a></li>
                <li><a href="#" className={styles.footerLink}>文章列表</a></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h6 className={styles.columnTitle}>關於我們</h6>
              <ul className={styles.footerList}>
                <li><a href="#" className={styles.footerLink}>品牌故事</a></li>
                <li><a href="#" className={styles.footerLink}>我們的使命</a></li>
                <li><a href="#" className={styles.footerLink}>聯絡我們</a></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h6 className={styles.columnTitle}>聯絡資訊</h6>
              <ul className={styles.footerList}>
                <li className={styles.contactItem}>
                  <FaMapMarkerAlt className={styles.contactIcon} />
                  <span>桃園市中壢區新生路二段421號</span>
                </li>
                <li className={styles.contactItem}>
                  <FaPhoneAlt className={styles.contactIcon} />
                  <span><a href="http://divein.com.tw/" className={styles.footerLink}>http://divein.com.tw/</a></span>
                </li>
                <li className={styles.contactItem}>
                  <FaRegEnvelope className={styles.contactIcon} />
                  <span>DiveIn@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 手機版摺疊選單 */}
          <div className={styles.mobileSitemap}>
            <div className={styles.accordion}>
              <button
                className={styles.accordionButton}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#about-me"
              >
                關於我們 <FaAngleDown />
              </button>
              <div className={`${styles.collapseContent} collapse`} id="about-me">
                歡迎來到 DiveIn，您的專業潛水夥伴！我們專注於提供高品質的潛水裝備與課程，無論您是新手還是資深潛水員，都能在這裡找到適合的裝備與專業指導。
              </div>

              <button
                className={styles.accordionButton}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#our-story"
              >
                品牌故事 <FaAngleDown />
              </button>
              <div className={`${styles.collapseContent} collapse`} id="our-story">
                DiveIn 源於對海洋的熱愛與對潛水的無限熱情。我們希望透過專業知識與社群交流，讓更多人愛上海洋、尊重大自然。
              </div>

              <button
                className={styles.accordionButton}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#contact-info"
              >
                聯絡資訊 <FaAngleDown />
              </button>
              <div className={`${styles.collapseContent} collapse`} id="contact-info">
                <ul className={styles.footerList}>
                  <li className={styles.contactItem}>
                    <FaMapMarkerAlt className={styles.contactIcon} />
                    <span>桃園市中壢區新生路二段421號</span>
                  </li>
                  <li className={styles.contactItem}>
                    <FaPhoneAlt className={styles.contactIcon} />
                    <span><a href="http://divein.com.tw/" className={styles.footerLink}>http://divein.com.tw/</a></span>
                  </li>
                  <li className={styles.contactItem}>
                    <FaRegEnvelope className={styles.contactIcon} />
                    <span>DiveIn@gmail.com</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        Copyright © 2025 DiveIn
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;