"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./bundle.module.css";

export default function SelectBundle({ isOpen, onClose, bundle, onSelect }) {
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef([]);

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

  // 獲取商品的所有可用顏色
  const getUniqueColors = (variants) => {
    if (!variants || variants.length === 0) {
      return [];
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

  // 獲取指定顏色的所有可用尺寸
  const getAvailableSizes = (variants, selectedColor) => {
    if (!variants || variants.length === 0) {
      return [];
    }

    // 如果沒有選擇顏色，返回所有可用尺寸
    if (!selectedColor) {
      const allSizes = new Set();
      variants.forEach((v) => {
        if (v.size) allSizes.add(v.size);
      });
      return Array.from(allSizes);
    }

    // 返回選定顏色的所有可用尺寸
    const sizes = new Set();
    variants
      .filter((v) => v.color === selectedColor)
      .forEach((v) => {
        if (v.size) sizes.add(v.size);
      });
    return Array.from(sizes);
  };

  // 處理顏色選擇
  const handleColorSelect = (productId, color) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: color,
    }));
    
    // 重置尺寸和變體選擇
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: null,
    }));
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: null,
    }));
    
    const item = bundle?.items?.find(item => item.product_id === productId);
    if (item && item.variants) {
      const sizesForThisColor = item.variants
        .filter(v => v.color === color.color)
        .map(v => v.size)
        .filter(Boolean);
      
      if (sizesForThisColor.length === 1 && sizesForThisColor[0]) {
        // 如果該顏色只有一個尺寸，自動選擇該尺寸
        handleSizeSelect(productId, sizesForThisColor[0]);
      } else if (sizesForThisColor.length === 0 || sizesForThisColor.every(s => !s)) {
        // 如果沒有尺寸選項，直接選擇此顏色的變體
        const variant = item.variants.find(v => v.color === color.color);
        if (variant) {
          setSelectedVariants((prev) => ({
            ...prev,
            [productId]: variant,
          }));
        }
      }
    }
  };

  // 處理尺寸選擇
  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));

    // 找到匹配的變體
    const item = bundle?.items?.find(item => item.product_id === productId);
    if (item && item.variants && item.variants.length > 0) {
      const selectedColor = selectedColors[productId]?.color;
      const variant = item.variants.find(
        v => v.color === selectedColor && v.size === size
      );

      if (variant) {
        setSelectedVariants((prev) => ({
          ...prev,
          [productId]: variant,
        }));
      }
    }

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

  // 檢查商品是否需要選擇變體
  const needsVariantSelection = (item) => {
    // variant_required 是 1 表示需要選擇變體
    return item.variant_required === 1;
  };

  // 檢查是否有顏色選項
  const hasColorOptions = (variants) => {
    if (!variants || variants.length === 0) return false;
    return variants.some(v => v.color && v.color_code);
  };

  // 檢查是否有尺寸選項
  const hasSizeOptions = (variants) => {
    if (!variants || variants.length === 0) return false;
    return variants.some(v => v.size);
  };

  // 檢查所有必選商品是否都已選擇完成
  const isAllSelected = () => {
    if (!bundle?.items) return false;
    
    return bundle.items.every(item => {
      // 如果不需要選擇變體 (variant_required !== 1)，返回 true
      if (item.variant_required !== 1) return true;
      
      // 檢查是否已選擇變體
      if (selectedVariants[item.product_id]) return true;
      
      // 特殊情況：當商品只需要選擇顏色，沒有尺寸選項時
      if (hasColorOptions(item.variants) && !hasSizeOptions(item.variants)) {
        if (selectedColors[item.product_id]) {
          // 自動選擇該顏色的變體
          const variant = item.variants.find(v => 
            v.color === selectedColors[item.product_id].color
          );
          
          if (variant) {
            setSelectedVariants(prev => ({
              ...prev,
              [item.product_id]: variant
            }));
            return true;
          }
        }
      }
      
      // 特殊情況：當商品只需要選擇尺寸，沒有顏色選項時
      if (hasSizeOptions(item.variants) && !hasColorOptions(item.variants)) {
        if (selectedSizes[item.product_id]) {
          // 自動選擇該尺寸的變體
          const variant = item.variants.find(v => 
            v.size === selectedSizes[item.product_id]
          );
          
          if (variant) {
            setSelectedVariants(prev => ({
              ...prev,
              [item.product_id]: variant
            }));
            return true;
          }
        }
      }
      
      return false;
    });
  };

  // 獲取商品選擇狀態文字
  const getSelectionStatus = (item) => {
    if (item.variant_required !== 1) {
      return { status: "noVariant", text: "無需選擇" };
    }
    
    if (selectedVariants[item.product_id]) {
      return { status: "selected", text: "已選擇" };
    }
    
    return { status: "required", text: "需選擇規格" };
  };

  // 在初始加載和商品變更時，嘗試自動選擇單一變體
  useEffect(() => {
    if (!isOpen || !bundle?.items) return;
    
    bundle.items.forEach(item => {
      // 如果不需要選擇變體，則跳過
      if (item.variant_required !== 1) return;
      
      // 如果只有一個變體，自動選擇
      if (item.variants && item.variants.length === 1) {
        setSelectedVariants(prev => ({
          ...prev,
          [item.product_id]: item.variants[0]
        }));
        
        // 如果變體有顏色，也設置顏色選擇
        if (item.variants[0].color && item.variants[0].color_code) {
          setSelectedColors(prev => ({
            ...prev,
            [item.product_id]: {
              color: item.variants[0].color,
              code: item.variants[0].color_code
            }
          }));
        }
        
        // 如果變體有尺寸，也設置尺寸選擇
        if (item.variants[0].size) {
          setSelectedSizes(prev => ({
            ...prev,
            [item.product_id]: item.variants[0].size
          }));
        }
      }
      
      // 如果只有一種顏色，自動選擇顏色
      const colors = getUniqueColors(item.variants);
      if (colors.length === 1 && !selectedColors[item.product_id]) {
        setSelectedColors(prev => ({
          ...prev,
          [item.product_id]: colors[0]
        }));
        
        // 如果該顏色只有一個尺寸，也自動選擇尺寸和變體
        const sizes = getAvailableSizes(item.variants, colors[0].color);
        if (sizes.length === 1) {
          setSelectedSizes(prev => ({
            ...prev,
            [item.product_id]: sizes[0]
          }));
          
          const variant = item.variants.find(v => 
            v.color === colors[0].color && v.size === sizes[0]
          );
          if (variant) {
            setSelectedVariants(prev => ({
              ...prev,
              [item.product_id]: variant
            }));
          }
        }
      }
    });
  }, [isOpen, bundle]);

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
            {bundle?.items?.map((item, index) => {
              const selectionStatus = getSelectionStatus(item);
              
              return (
                <div
                  key={index}
                  className={`${styles.itemCard} ${
                    currentSection === index ? styles.active : ""
                  }`}
                  onClick={() => scrollToSection(index)}
                >
                  <div className={styles.itemImage}>
                    <Image
                      src={
                        item.main_image
                          ? `/image/product/${item.main_image}`
                          : "/image/product/no-img.png"
                      }
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
                    <span className={styles[selectionStatus.status]}>
                      {selectionStatus.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 商品選擇區域 */}
        <div className={styles.sectionsContainer}>
          {bundle?.items?.map((item, index) => {
            // 檢查該商品是否有顏色和尺寸選項
            const hasColors = hasColorOptions(item.variants);
            const hasSizes = hasSizeOptions(item.variants);

            return (
              <div
                key={item.product_id}
                ref={(el) => (sectionsRef.current[index] = el)}
                className={styles.section}
              >
                <div className={styles.sectionContent}>
                  <div className={styles.productHeader}>
                    <h3>{item.product_name}</h3>
                    {item.variant_required === 1 && (
                      <p className={styles.subtitle}>
                        {selectedVariants[item.product_id]
                          ? "已選擇完成"
                          : "請選擇規格"}
                      </p>
                    )}
                    {item.variant_required !== 1 && (
                      <p className={styles.subtitle}>無需選擇規格</p>
                    )}
                  </div>

                  <div className={styles.productDisplay}>
                    <div className={styles.mainImage}>
                      <Image
                        src={
                          item.main_image
                            ? `/image/product/${item.main_image}`
                            : "/image/product/no-img.png"
                        }
                        alt={item.product_name}
                        width={400}
                        height={400}
                        priority={index === 0}
                        style={{ objectFit: "contain" }}
                      />
                    </div>

                    <div className={styles.selectionArea}>
                      {item.variant_required === 1 && (
                        <div className={styles.variantSelection}>
                          {/* 顏色選擇區 - 只在有顏色選項時顯示 */}
                          {hasColors && (
                            <div className={styles.colorSection}>
                              <h4 className={styles.sectionTitle}>
                                顏色 -{" "}
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
                          )}

                          {/* 尺寸選擇區 - 只在有尺寸選項時顯示 */}
                          {hasSizes && (
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
                                    disabled={hasColors && !selectedColors[item.product_id]}
                                    title={
                                      hasColors && !selectedColors[item.product_id]
                                        ? "請先選擇顏色"
                                        : ""
                                    }
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 沒有顏色和尺寸選項但需要選擇變體的情況 */}
                          {!hasColors && !hasSizes && !selectedVariants[item.product_id] && (
                            <div className={styles.defaultVariantSection}>
                              <p>此商品只有一種規格</p>
                              <button
                                className={styles.defaultVariantButton}
                                onClick={() => {
                                  if (item.variants?.length > 0) {
                                    setSelectedVariants(prev => ({
                                      ...prev,
                                      [item.product_id]: item.variants[0]
                                    }));
                                  } else {
                                    // 如果沒有變體數據，創建默認變體
                                    setSelectedVariants(prev => ({
                                      ...prev,
                                      [item.product_id]: {
                                        id: `${item.product_id}-default`,
                                        price: "0",
                                        product_id: item.product_id
                                      }
                                    }));
                                  }
                                }}
                              >
                                確認選擇默認規格
                              </button>
                            </div>
                          )}
                          
                          {/* 顯示已選擇的變體信息 */}
                          {selectedVariants[item.product_id] && (
                            <div className={styles.selectedVariantInfo}>
                              {selectedColors[item.product_id] && (
                                <p>已選顏色: {selectedColors[item.product_id].color}</p>
                              )}
                              {selectedSizes[item.product_id] && (
                                <p>已選尺寸: {selectedSizes[item.product_id]}</p>
                              )}
                              {!selectedColors[item.product_id] && !selectedSizes[item.product_id] && (
                                <p>已選擇默認規格</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {item.variant_required !== 1 && (
                        <div className={styles.noVariantMessage}>
                          此商品無需選擇規格
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
                };

                console.log("要發送的套組數據:", bundleData);
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