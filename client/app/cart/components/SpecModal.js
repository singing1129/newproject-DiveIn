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
  const [debugInfo, setDebugInfo] = useState("等待选择...");

  // 獲取商品詳情
  useEffect(() => {
    const getProductDetails = async () => {
      try {
        console.log("正在获取商品详情, 商品ID:", item.product_id);
        const response = await axios.get(
          `http://localhost:3005/api/products/${item.product_id}`
        );
        const productData = response.data.data;
        setProductDetails(productData);
        console.log("商品详情获取成功:", productData);
        
        // 初始化颜色选择为当前变体的颜色
        const currentVariant = productData.variants.find(
          v => parseInt(v.id) === parseInt(item.variant_id)
        );
        
        if (currentVariant) {
          console.log("找到当前变体:", currentVariant);
          setSelectedColor(parseInt(currentVariant.color_id));
          setSelectedVariant(currentVariant);
          setDebugInfo(`当前变体: ID=${currentVariant.id}, 颜色=${currentVariant.color_name || "无"}`);
        } else {
          console.log("找不到当前变体:", item.variant_id);
          setDebugInfo(`找不到当前变体: ID=${item.variant_id}`);
        }
      } catch (err) {
        console.error("获取商品详情失败:", err);
        setError("獲取商品詳情失敗: " + (err.response?.data?.message || err.message));
      }
    };

    if (item.product_id) {
      getProductDetails();
    }
  }, [item]);

  // 当颜色改变时，查找对应的变体
  useEffect(() => {
    if (!productDetails || selectedColor === null) return;
    
    console.log("颜色改变, 查找变体. 选择的颜色ID:", selectedColor);
    
    // 查找匹配所选颜色的变体
    const matchingVariant = productDetails.variants.find(
      v => parseInt(v.color_id) === parseInt(selectedColor)
    );
    
    if (matchingVariant) {
      console.log("找到匹配变体:", matchingVariant);
      setSelectedVariant(matchingVariant);
      
      // 检查是否与原始变体不同
      if (parseInt(matchingVariant.id) !== parseInt(item.variant_id)) {
        setDebugInfo(`已选择新变体: ID=${matchingVariant.id}, 颜色=${matchingVariant.color_name || "无"}\n(原变体ID: ${item.variant_id})`);
      } else {
        setDebugInfo(`当前选择的是原变体: ID=${matchingVariant.id}, 颜色=${matchingVariant.color_name || "无"}`);
      }
    } else {
      console.log("未找到匹配变体, 颜色ID:", selectedColor);
      setSelectedVariant(null);
      setDebugInfo(`未找到匹配的变体 (颜色ID: ${selectedColor})`);
    }
  }, [selectedColor, productDetails, item.variant_id]);

  // 處理規格更新
  const handleUpdate = async () => {
    console.log("点击了确定按钮");
    
    if (!selectedVariant) {
      setError("請選擇一個規格");
      return;
    }

    // 確保當前選擇的變體與原始變體不同
    if (parseInt(selectedVariant.id) === parseInt(item.variant_id)) {
      console.log("选择了相同的变体，不需更新");
      setDebugInfo(`选择了相同的变体 (ID: ${selectedVariant.id})，不需要更新`);
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
      
      console.log("更新变体，请求数据:", requestData);
      setDebugInfo(`正在发送更新请求...\n${JSON.stringify(requestData)}`);

      // 发送更新请求
      const response = await axios.put(
        "http://localhost:3005/api/cart/update",
        requestData
      );

      console.log("更新响应:", response.data);
      
      if (response.data.success) {
        setDebugInfo(`更新成功! 新变体ID: ${selectedVariant.id}`);
        // 更新购物车数据
        await fetchCart();
        
        // 延迟关闭对话框，让用户看到成功消息
        setTimeout(() => {
          const closeButton = document.querySelector(".spec-close-button");
          if (closeButton) closeButton.click();
        }, 1000);
      } else {
        throw new Error(response.data.message || "更新失败");
      }
    } catch (err) {
      console.error("更新失败:", err);
      setError(err.response?.data?.message || err.message || "更新规格失败");
      setDebugInfo(`更新失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 如果商品详情未加载完成，显示原始内容
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
            {/* 调试信息 */}
            <div className="debug-info" style={{ 
              background: "#f0f8ff", 
              padding: "10px", 
              borderRadius: "4px", 
              marginBottom: "10px",
              fontSize: "12px",
              wordBreak: "break-word",
              whiteSpace: "pre-line"
            }}>
              <strong>调试信息:</strong> {debugInfo}
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
                    // 检查此颜色是否有可用变体
                    const hasVariant = productDetails.variants.some(
                      v => parseInt(v.color_id) === parseInt(color.id)
                    );
                    
                    // 只显示有对应变体的颜色
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