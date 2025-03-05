"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SocialToolbar() {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const thumbnailListRef = useRef(null);
  const itemHeight = 48; // 40px高度 + 8px間距

  // 瀏覽紀錄
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("browsingHistory")) || [];
    setHistoryItems(storedHistory);
  }, []);

  useEffect(() => {
    // 确保在historyItems变化时重新计算maxScroll
    const updateMaxScroll = () => {
      if (thumbnailListRef.current) {
        const containerHeight = 140; // thumbnails-container 的高度
        const totalHeight = thumbnailListRef.current.scrollHeight;
        setMaxScroll(Math.max(0, totalHeight - containerHeight));
      }
    };

    // 立即执行一次
    updateMaxScroll();

    // 添加一个延迟执行，确保图片加载后重新计算
    const timer = setTimeout(updateMaxScroll, 500);

    // 添加窗口大小变化监听
    window.addEventListener("resize", updateMaxScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateMaxScroll);
    };
  }, [historyItems]);

  const handleScroll = (direction) => {
    const step = itemHeight;
    let newPosition;

    if (direction === "up") {
      newPosition = Math.max(0, currentPosition - step);
    } else {
      newPosition = Math.min(maxScroll, currentPosition + step);
    }

    // 确保滚动位置不超出范围
    if (newPosition < 0) newPosition = 0;
    if (newPosition > maxScroll) newPosition = maxScroll;

    setCurrentPosition(newPosition);

    // 调试信息
    console.log({
      direction,
      newPosition,
      maxScroll,
      listHeight: thumbnailListRef.current?.scrollHeight,
      containerHeight: 140,
    });
  };

  //清除紀錄
  const handleClearHistory = () => {
    localStorage.removeItem("browsingHistory");
    setHistoryItems([]);
  };

  return (
    <div className="main-toolbar d-none d-lg-flex">
      {/* 社交按鈕組 */}
      <div className="social-group">
        <button className="social-btn">
          <i className="fab fa-facebook-f text-primary"></i>
        </button>
        <button className="social-btn">
          <i className="fab fa-instagram text-danger"></i>
        </button>
        <button className="social-btn">
          <i className="fas fa-store text-dark"></i>
        </button>
      </div>

      {/* 歷史記錄面板 */}
      <div className="history-panel d-flex flex-column justify-content-between">
        <button
          className="scroll-arrow up"
          onClick={() => handleScroll("up")}
          disabled={currentPosition <= 0}
          style={{
            opacity: currentPosition <= 0 ? 0.5 : 1,
            cursor: currentPosition <= 0 ? "not-allowed" : "pointer",
          }}
        >
          <i className="fas fa-chevron-up fa-lg"></i>
        </button>

        <div className="thumbnails-container">
          <ul
            className="thumbnail-list"
            ref={thumbnailListRef}
            style={{
              transform: `translateY(-${currentPosition}px)`,
              transition: "transform 0.3s ease",
            }}
          >
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <Link href={`/products/${item.id}`} key={index}>
                  <li className="thumbnail-item">
                    <img
                      src={`/img/product/${item.image}`}
                      alt={item.name}
                      onLoad={() => {
                        // 图片加载完成后重新计算高度
                        if (thumbnailListRef.current) {
                          const containerHeight = 140;
                          const totalHeight =
                            thumbnailListRef.current.scrollHeight;
                          setMaxScroll(
                            Math.max(0, totalHeight - containerHeight)
                          );
                        }
                      }}
                    />
                  </li>
                </Link>
              ))
            ) : (
              <li className="thumbnail-item empty-history">
                <span style={{ fontSize: "10px", textAlign: "center" }}>
                  无浏览记录
                </span>
              </li>
            )}
          </ul>
        </div>

        <button
          className="scroll-arrow down"
          onClick={() => handleScroll("down")}
          disabled={currentPosition >= maxScroll}
          style={{
            opacity: currentPosition >= maxScroll ? 0.5 : 1,
            cursor: currentPosition >= maxScroll ? "not-allowed" : "pointer",
          }}
        >
          <i className="fas fa-chevron-down fa-lg"></i>
        </button>
      </div>

      <div className="clear-btn" onClick={handleClearHistory}>
        清除記錄
      </div>
    </div>
  );
}
