"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./bundle.module.css";

export default function SelectBundle({ isOpen, onClose, bundle, onSelect }) {
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantities, setQuantities] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    // 初始化數量
    const initialQuantities = {};
    bundle?.items?.forEach((item) => {
      initialQuantities[item.id] = item.quantity || 1;
    });
    setQuantities(initialQuantities);
  }, [isOpen, bundle]);

  // 處理滾動導航
  const scrollToSection = (index) => {
    const element = sectionsRef.current[index];
    if (element) {
      const headerHeight = 60; // 頂部導航高度
      const overviewHeight = 120; // 商品區高度
      const offset = headerHeight + overviewHeight;

      const modalContent = document.querySelector(`.${styles.modalContent}`);
      if (modalContent) {
        modalContent.scrollTo({
          top: element.offsetTop - offset,
          behavior: "smooth",
        });
      }
    }
    setCurrentSection(index);
  };

  // 處理數量變更
  const handleQuantityChange = (itemId, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }));
  };

  // 獲取商品的所有可用顏色（添加預設值）
  const getUniqueColors = (variants) => {
    if (!variants || variants.length === 0) {
      // 如果沒有變體數據，返回預設顏色
      return [
        { color: "玫瑰金", code: "#B76E79" },
        { color: "太空灰", code: "#4A4A4A" },
        { color: "銀色", code: "#C0C0C0" },
      ];
    }

    const colors = new Set();
    variants.forEach((variant) => {
      if (variant.color && variant.color_code) {
        colors.add(
          JSON.stringify({ color: variant.color, code: variant.color_code })
        );
      }
    });
    return Array.from(colors).map((c) => JSON.parse(c));
  };

  // 獲取指定顏色的所有可用尺寸（添加預設值）
  const getAvailableSizes = (variants, selectedColor) => {
    if (!variants || variants.length === 0) {
      // 如果沒有變體數據，返回預設尺寸
      return ["XS", "S", "M", "L", "XL"];
    }

    // 如果沒有選擇顏色，返回所有可用尺寸
    if (!selectedColor) {
      const allSizes = new Set();
      variants.forEach((v) => {
        if (v.size) allSizes.add(v.size);
      });
      return Array.from(allSizes);
    }

    return variants.filter((v) => v.color === selectedColor).map((v) => v.size);
  };

  // 處理顏色選擇
  const handleColorSelect = (productId, color) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: color,
    }));
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: null,
    }));
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: null,
    }));
  };

  // 處理尺寸選擇
  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));

    // 創建模擬的變體數據
    const mockVariant = {
      id: `${productId}-${selectedColors[productId]?.color}-${size}`,
      price: "7500",
      original_price: "8000",
      stock: Math.floor(Math.random() * 20) + 1, // 1-20 的隨機庫存
      color: selectedColors[productId]?.color,
      color_code: selectedColors[productId]?.code,
      size: size,
    };

    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: mockVariant,
    }));

    // 找到當前商品在列表中的索引
    const currentIndex = bundle?.items?.findIndex(
      (item) => item.product_id === productId
    );

    // 如果還有下一個商品，自動滾動到下一個
    if (currentIndex < bundle?.items?.length - 1) {
      setTimeout(() => {
        scrollToSection(currentIndex + 1);
      }, 500);
    }
  };

  // 检查是否都選擇了
  const isAllSelected = () => {
    return bundle?.items?.every(
      (item) => !item.variant_required || selectedVariants[item.product_id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* top導航 */}
        <div className={styles.modalHeader}>
          <button className={styles.closeButton} onClick={onClose}>
            <span>×</span>
          </button>
          <h2 className={styles.modalTitle}>{bundle?.name}</h2>
        </div>

        {/* 商品區域 */}
        <div className={styles.bundleOverview}>
          <div className={styles.overviewHeader}>
            <h3>套組商品一覽</h3>
            <p className={styles.subtitle}>
              總共 {bundle?.items?.length} 件商品
            </p>
          </div>
          <div className={styles.itemsList}>
            {bundle?.items?.map((item, index) => (
              <div
                key={index}
                className={`${styles.itemCard} ${
                  currentSection === index ? styles.active : ""
                }`}
                onClick={() => scrollToSection(index)}
              >
                <div className={styles.itemImage}>
                  <Image
                    src={`/img/product/${item.main_image || "default.jpg"}`}
                    alt={item.product_name}
                    width={60}
                    height={60}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className={styles.itemInfo}>
                  <h4>{item.product_name}</h4>
                  <p>數量: {item.quantity}x</p>
                </div>
                <div className={styles.itemStatus}>
                  {item.variant_required ? (
                    selectedVariants[item.product_id] ? (
                      <span className={styles.selected}>已選擇</span>
                    ) : (
                      <span className={styles.required}>需選擇規格</span>
                    )
                  ) : (
                    <span className={styles.noVariant}>無需選擇</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 商品選擇區域 */}
        <div className={styles.sectionsContainer}>
          {bundle?.items?.map((item, index) => (
            <div
              key={item.product_id}
              ref={(el) => (sectionsRef.current[index] = el)}
              className={styles.section}
            >
              <div className={styles.sectionContent}>
                <div className={styles.productHeader}>
                  <h3>{item.product_name}</h3>
                  {item.variant_required && (
                    <p className={styles.subtitle}>
                      {selectedColors[item.product_id] &&
                      selectedSizes[item.product_id]
                        ? "已選擇完成"
                        : "請選擇規格"}
                    </p>
                  )}
                </div>

                <div className={styles.productDisplay}>
                  <div className={styles.mainImage}>
                    <Image
                      src={`/img/product/${item.main_image || "default.jpg"}`}
                      alt={item.product_name}
                      width={400}
                      height={400}
                      priority={index === 0}
                      style={{ objectFit: "contain" }}
                    />
                  </div>

                  <div className={styles.selectionArea}>
                    {item.variant_required && (
                      <div className={styles.variantSelection}>
                        {/* 顏色選擇區 */}
                        <div className={styles.colorSection}>
                          <h4 className={styles.sectionTitle}>
                            外觀 -{" "}
                            {selectedColors[item.product_id]?.color ||
                              "請選擇顏色"}
                          </h4>
                          <div className={styles.colorGrid}>
                            {getUniqueColors(item.variants).map(
                              (colorInfo, idx) => (
                                <button
                                  key={idx}
                                  className={`${styles.colorButton} ${
                                    selectedColors[item.product_id]?.color ===
                                    colorInfo.color
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleColorSelect(
                                      item.product_id,
                                      colorInfo
                                    )
                                  }
                                >
                                  <div
                                    className={styles.colorCircle}
                                    style={{
                                      backgroundColor: colorInfo.code,
                                    }}
                                  ></div>
                                  <span className={styles.colorName}>
                                    {colorInfo.color}
                                  </span>
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* 尺寸選擇區 - 始終顯示 */}
                        <div className={styles.sizeSection}>
                          <h4 className={styles.sectionTitle}>尺寸</h4>
                          <div className={styles.sizeGrid}>
                            {getAvailableSizes(
                              item.variants,
                              selectedColors[item.product_id]?.color
                            ).map((size, idx) => (
                              <button
                                key={idx}
                                className={`${styles.sizeButton} ${
                                  selectedSizes[item.product_id] === size
                                    ? styles.selected
                                    : ""
                                }`}
                                onClick={() =>
                                  handleSizeSelect(item.product_id, size)
                                }
                                disabled={!selectedColors[item.product_id]}
                                title={
                                  !selectedColors[item.product_id]
                                    ? "請先選擇顏色"
                                    : ""
                                }
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {!item.variant_required && (
                      <div className={styles.noVariantMessage}>
                        此商品無需選擇規格
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className={styles.modalFooter}>
          <div className={styles.summary}>
            <div className={styles.priceInfo}>
              <span className={styles.totalLabel}>總計</span>
              <span className={styles.totalPrice}>
                NT${bundle?.discount_price || 0}
              </span>
              {bundle?.original_total !== bundle?.discount_price && (
                <span className={styles.originalTotal}>
                  NT${bundle?.original_total}
                </span>
              )}
            </div>
            <button
              className={styles.addToCartButton}
              onClick={() => {
                // 格式化要發送的數據
                const bundleData = {
                  type: "bundle",
                  bundleId: bundle.id,
                  quantity: 1, // bundle 數量默認為1
                  variants: selectedVariants, // 包含用戶為每個產品選擇的變體
                  quantities: quantities, // 每個項目的數量
                };

                console.log("要發送的套組數據:", bundleData); // 方便調試
                onSelect(bundleData);
                onClose();
              }}
              disabled={!isAllSelected()}
            >
              {isAllSelected() ? "加入購物車" : "請選擇商品規格"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
