"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "@/hooks/cartContext";
import "./SpecModal.css";
import { useAuth } from "@/hooks/useAuth";

const SpecModal = ({ children, item, onVariantChange }) => {
  const { user } = useAuth();
  const { updateQuantity, fetchCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取商品詳情
  useEffect(() => {
    const getProductDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3005/api/products/${item.product_id}`
        );
        setProductDetails(response.data.data);
        console.log("response.data.data", response.data.data);

        // 找到當前選中的 variant
        const currentVariant = response.data.data.variants.find(
          (v) => v.id === item.variant_id
        );
        if (currentVariant) {
          setSelectedColor(currentVariant.color_id);
          setSelectedSize(currentVariant.size_id);
          setSelectedVariant(currentVariant);
        }
      } catch (err) {
        setError("獲取商品詳情失敗");
        console.error(err);
      }
    };

    if (item.product_id) {
      getProductDetails();
    }
  }, [item]);

  // 根據選擇的顏色和尺寸更新 variant
  useEffect(() => {
    if (productDetails && selectedColor && selectedSize) {
      const variant = productDetails.variants.find(
        (v) => v.color_id === selectedColor && v.size_id === selectedSize
      );
      setSelectedVariant(variant);
    }
  }, [selectedColor, selectedSize, productDetails]);

  // 處理規格更新
  const handleUpdate = async (closeModal) => {
    if (!selectedVariant) return;

    setLoading(true);
    try {
      // 確保變體 ID 已更改再進行更新
      if (selectedVariant.id === item.variant_id) {
        console.log("選擇了同一個變體，不需更新");
        if (typeof closeModal === "function") {
          closeModal();
        }
        return;
      }

      console.log("更新變體，請求數據:", {
        userId: user.id,
        type: "product",
        itemId: item.id,
        variantId: selectedVariant.id,
        quantity: item.quantity,
      });

      // 直接發送更新請求
      const response = await axios.put(
        "http://localhost:3005/api/cart/update",
        {
          userId: user.id,
          type: "product",
          itemId: item.id,
          variantId: selectedVariant.id,
          quantity: item.quantity,
        }
      );

      console.log("更新響應:", response.data);

      if (response.data.success) {
        // 更新成功後重新獲取購物車數據
        await fetchCart();
        console.log("成功更新變體並重新獲取購物車數據");

        // 關閉模態框
        if (typeof closeModal === "function") {
          closeModal();
        }
      } else {
        throw new Error(response.data.message || "更新失敗");
      }
    } catch (err) {
      console.error("更新失敗:", err);
      setError(err.response?.data?.message || err.message || "更新規格失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!productDetails) return children;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="spec-modal-overlay" />
        <Dialog.Content className="spec-modal-container">
          <div className="spec-modal-header">
            <Dialog.Title className="spec-modal-title">規格選擇</Dialog.Title>
            <Dialog.Close asChild>
              <button className="spec-close-button" aria-label="Close">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </div>

          <div className="spec-modal-content">
            {/* 商品預覽 */}
            <div className="product-preview">
              <img
                src={
                  selectedVariant?.images?.[0] || "/article-5ae9687eec0d4.jpg"
                }
                alt={productDetails.name}
                className="preview-image"
              />
              <div className="preview-info">
                <h3 className="preview-name">{productDetails.name}</h3>
                <div className="preview-price">
                  <span className="current-price">
                    NT$ {selectedVariant?.price || item.price}
                  </span>
                  {selectedVariant?.original_price && (
                    <span className="original-price">
                      NT$ {selectedVariant.original_price}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 顏色選擇 */}
            {productDetails.colors?.length > 0 && (
              <div className="spec-section">
                <h4 className="spec-title">顏色</h4>
                <div className="color-options">
                  {productDetails.colors.map((color) => (
                    <button
                      key={color.id}
                      className={`color-option ${
                        selectedColor === color.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedColor(color.id)}
                      style={{
                        backgroundColor: color.code,
                        border:
                          color.code === "#FFFFFF" ? "1px solid #ddd" : "none",
                      }}
                    >
                      <span className="color-name">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 尺寸選擇 */}
            {productDetails.sizes?.length > 0 && (
              <div className="spec-section">
                <h4 className="spec-title">尺寸</h4>
                <div className="size-options">
                  {productDetails.sizes.map((size) => (
                    <button
                      key={size.id}
                      className={`size-option ${
                        selectedSize === size.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedSize(size.id)}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="spec-modal-footer">
            <Dialog.Close asChild>
              <button className="spec-btn-secondary" disabled={loading}>
                取消
              </button>
            </Dialog.Close>
            <button
              className="spec-btn-primary"
              onClick={(e) => {
                e.preventDefault();
                handleUpdate(() => {
                  const closeButton =
                    document.querySelector(".spec-close-button");
                  if (closeButton) {
                    closeButton.click();
                  }
                });
              }}
              disabled={loading || !selectedVariant}
            >
              {loading ? "更新中..." : "確定"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SpecModal;
