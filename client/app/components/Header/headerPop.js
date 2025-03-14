"use client";
import { Transition } from "@headlessui/react";
import Link from "next/link";
import styles from "./headerPop.module.css";

export default function HeaderPop({ show, activeMenu }) {
  const renderContent = () => {
    switch (activeMenu) {
      case "products":
        return (
          <div className={styles["popup-section"]}>
            <div className={styles["popup-column"]}>
              <h3>探索商品</h3>
              <ul>
                <li>
                  <Link href="/products/mask">面鏡／呼吸管</Link>
                </li>
                <li>
                  <Link href="/products/fins">蛙鞋</Link>
                </li>
                <li>
                  <Link href="/products/accessories">潛水配件</Link>
                </li>
                <li>
                  <Link href="/products/equipment">電子裝備</Link>
                </li>
                <li>
                  <Link href="/products/wetsuit">防寒衣物</Link>
                </li>
              </ul>
            </div>
          </div>
        );
      case "events":
        return (
          <div className={styles["popup-section"]}>
            <div className={styles["popup-column"]}>
              <h3>熱門活動</h3>
              <ul>
                <li>
                  <a href="http://localhost:3000/activity?page=1&limit=24&sort=1&type=1">浮潛</a>
                </li>
                <li>
                  <a href="http://localhost:3000/activity?page=1&limit=24&sort=1&type=2">水肺潛水</a>
                </li>
                <li>
                  <a href="http://localhost:3000/activity?page=1&limit=24&sort=1&type=3">自由潛水</a>
                </li>
              </ul>
            </div>
          </div>
        );
      case "rental":
        return (
          <div className={styles["popup-section"]}>
            <div className={styles["popup-column"]}>
              <h3>租借服務</h3>
              <ul>
                <li>
                  <Link href="/rental/basic">基礎裝備租借</Link>
                </li>
                <li>
                  <Link href="/rental/pro">專業裝備租借</Link>
                </li>
                <li>
                  <Link href="/rental/camera">水下攝影設備</Link>
                </li>
              </ul>
            </div>
          </div>
        );
      case "group":
        return (
          <div className={styles["popup-section"]}>
            <div className={styles["popup-column"]}>
              <h3>揪團活動</h3>
              <ul>
                <li>
                  <Link href="/group/create">建立揪團</Link>
                </li>
                <li>
                  <Link href="/group/join">參加揪團</Link>
                </li>
                <li>
                  <Link href="/admin/group">我的揪團</Link>
                </li>
              </ul>
            </div>
            <div className={styles["popup-column"]}>
              <h3>熱門目的地</h3>
              <ul>
                <li>
                  <a href="http://localhost:3000/group/list?page=1&limit=24&sort=1&location=1">屏東</a>
                </li>
                <li>
                  <a href="http://localhost:3000/group/list?page=1&limit=24&sort=1&location=7">小琉球</a>
                </li>
                <li>
                  <a href="http://localhost:3000/group/list?page=1&limit=24&sort=1&location=14">宿霧</a>
                </li>
                <li>
                  <a href="http://localhost:3000/group/list?page=1&limit=24&sort=1&location=10">沖繩</a>
                </li>
              </ul>
            </div>
          </div>
        );
      case "forum":
        return (
          <div className={styles["popup-section"]}>
            <div className={styles["popup-column"]}>
              <h3>討論區</h3>
              <ul>
                <li>
                  <Link href="/forum/general">綜合討論</Link>
                </li>
                <li>
                  <Link href="/forum/experience">潛水心得</Link>
                </li>
                <li>
                  <Link href="/forum/equipment">裝備討論</Link>
                </li>
                <li>
                  <Link href="/forum/photography">水攝攝影</Link>
                </li>
              </ul>
            </div>
            <div className={styles["popup-column"]}>
              <h3>精選內容</h3>
              <ul>
                <li>
                  <Link href="/forum/featured">精選文章</Link>
                </li>
                <li>
                  <Link href="/forum/newbie">新手專區</Link>
                </li>
                <li>
                  <Link href="/forum/safety">安全知識</Link>
                </li>
                <li>
                  <Link href="/forum/spots">潛點介紹</Link>
                </li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    // 使用HeadlessUI
    <Transition
      show={show && activeMenu !== null}
      enter="transition duration-300 ease-out"
      enterFrom="transform -translate-y-2 opacity-0"
      enterTo="transform translate-y-0 opacity-100"
      leave="transition duration-200 ease-in"
      leaveFrom="transform translate-y-0 opacity-100"
      leaveTo="transform -translate-y-2 opacity-0"
    >
      <div className={styles["header-popup"]}>
        <div className={styles["popup-content"]}>{renderContent()}</div>
      </div>
    </Transition>
  );
}
