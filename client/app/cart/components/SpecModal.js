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
  const { fetchCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("等待選擇...");

  // 獲取商品詳情
  useEffect(() => {
    const getProductDetails = async () => {
      try {
        console.log("正在獲取商品詳情, 商品ID:", item.product_id);
        const response = await axios.get(
          `http://localhost:3005/api/products/${item.product_id}`
        );
        const productData = response.data.data;
        setProductDetails(productData);
        console.log("商品詳情獲取成功:", productData);
        
        // 初始化顏色選擇為當前變體的顏色
        const currentVariant = productData.variants.find(
          v => parseInt(v.id) === parseInt(item.variant_id)
        );
        
        if (currentVariant) {
          console.log("找到當前變體:", currentVariant);
          setSelectedColor(parseInt(currentVariant.color_id));
          setSelectedVariant(currentVariant);
          setDebugInfo(`當前變體: ID=${currentVariant.id}, 顏色=${currentVariant.color_name || "無"}`);
        } else {
          console.log("找不到當前變體:", item.variant_id);
          setDebugInfo(`找不到當前變體: ID=${item.variant_id}`);
        }
      } catch (err) {
        console.error("獲取商品詳情失敗:", err);
        setError("獲取商品詳情失敗: " + (err.response?.data?.message || err.message));
      }
    };

    if (item.product_id) {
      getProductDetails();
    }
  }, [item]);

  // 當顏色改變時，查找對應的變體
  useEffect(() => {
    if (!productDetails || selectedColor === null) return;
    
    console.log("顏色改變, 查找變體. 選擇的顏色ID:", selectedColor);
    
    // 查找匹配所選顏色的變體
    const matchingVariant = productDetails.variants.find(
      v => parseInt(v.color_id) === parseInt(selectedColor)
    );
    
    if (matchingVariant) {
      console.log("找到匹配變體:", matchingVariant);
      setSelectedVariant(matchingVariant);
      
      // 檢查是否與原始變體不同
      if (parseInt(matchingVariant.id) !== parseInt(item.variant_id)) {
        setDebugInfo(`已選擇新變體: ID=${matchingVariant.id}, 顏色=${matchingVariant.color_name || "無"}\n(原變體ID: ${item.variant_id})`);
      } else {
        setDebugInfo(`當前選擇的是原變體: ID=${matchingVariant.id}, 顏色=${matchingVariant.color_name || "無"}`);
      }
    } else {
      console.log("未找到匹配變體, 顏色ID:", selectedColor);
      setSelectedVariant(null);
      setDebugInfo(`未找到匹配的變體 (顏色ID: ${selectedColor})`);
    }
  }, [selectedColor, productDetails, item.variant_id]);

  // 處理規格更新
  const handleUpdate = async () => {
    console.log("點擊了確定按鈕");
    
    if (!selectedVariant) {
      setError("請選擇一個規格");
      return;
    }

    // 確保當前選擇的變體與原始變體不同
    if (parseInt(selectedVariant.id) === parseInt(item.variant_id)) {
      console.log("選擇了相同的變體，不需更新");
      setDebugInfo(`選擇了相同的變體 (ID: ${selectedVariant.id})，不需要更新`);
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        userId: user.id,
        type: "product",
        itemId: item.id,
        variantId: selectedVariant.id,
        quantity: item.quantity
      };
      
      console.log("更新變體，請求數據:", requestData);
      setDebugInfo(`正在發送更新請求...\n${JSON.stringify(requestData)}`);

      // 發送更新請求
      const response = await axios.put(
        "http://localhost:3005/api/cart/update",
        requestData
      );

      console.log("更新響應:", response.data);
      
      if (response.data.success) {
        setDebugInfo(`更新成功! 新變體ID: ${selectedVariant.id}`);
        // 更新購物車數據
        await fetchCart();
        
        // 延遲關閉對話框，讓用户看到成功消息
        setTimeout(() => {
          const closeButton = document.querySelector(".spec-close-button");
          if (closeButton) closeButton.click();
        }, 1000);
      } else {
        throw new Error(response.data.message || "更新失敗");
      }
    } catch (err) {
      console.error("更新失敗:", err);
      setError(err.response?.data?.message || err.message || "更新規格失敗");
      setDebugInfo(`更新失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 如果商品詳情未加載完成，顯示原始內容
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
            {/* 調試信息 */}
            <div className="debug-info" style={{ 
              background: "#f0f8ff", 
              padding: "10px", 
              borderRadius: "4px", 
              marginBottom: "10px",
              fontSize: "12px",
              wordBreak: "break-word",
              whiteSpace: "pre-line"
            }}>
              <strong>調試信息:</strong> {debugInfo}
            </div>

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
                  {selectedVariant?.original_price && 
                   selectedVariant.original_price !== selectedVariant.price && (
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
                  {productDetails.colors.map((color) => {
                    // 檢查此顏色是否有可用變體
                    const hasVariant = productDetails.variants.some(
                      v => parseInt(v.color_id) === parseInt(color.id)
                    );
                    
                    // 只顯示有對應變體的顏色
                    if (!hasVariant) return null;
                    
                    return (
                      <button
                        key={color.id}
                        className={`color-option ${
                          parseInt(selectedColor) === parseInt(color.id) ? "selected" : ""
                        }`}
                        onClick={() => setSelectedColor(parseInt(color.id))}
                        style={{
                          backgroundColor: color.code,
                          border:
                            color.code === "#FFFFFF" ? "1px solid #ddd" : "none",
                        }}
                      >
                        <span className="color-name">{color.name}</span>
                      </button>
                    );
                  })}
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
              onClick={handleUpdate}
              disabled={loading || !selectedVariant || parseInt(selectedVariant.id) === parseInt(item.variant_id)}
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