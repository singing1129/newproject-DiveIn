"use client";
import React, { useState } from "react";
// import Image from "next/image";
import axios from "axios";
import "./CartItem.css";
import SpecModal from "./SpecModal";
import RentalSpecModal from "./RentalSpecModal";
import { useCart } from "@/hooks/cartContext";
import useFavorite from "@/hooks/useFavorite";


// 計算租借天數的函數
const calculateRentalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end - start;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // 包含起始日和結束日
};

const CartItem = ({ item, type = "products" }) => {
  const { selectedItems, handleSelectItem, removeFromCart, updateQuantity } =
    useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // 租借修改資料的 modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 根據類型獲取正確的 ID
  const getFavoriteId = () => {
    switch (type) {
      case "products":
        return item.product_id;
      case "activities":
        return item.activity_id;
      case "rentals":
        return item.rental_id;
      default:
        return null;
    }
  };

  const favoriteId = getFavoriteId();
  // 不需要轉換 type，直接使用複數形式
  const { isFavorite, toggleFavorite } = useFavorite(favoriteId, type);

  // 檢查是否被選中
  const isSelected = selectedItems[type]?.includes(item.id);

  // 處理數量更新
  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || isUpdating) return;

    // 調試訊息：打印當前商品信息和數量
    console.log("Updating quantity for item:", {
      type,
      itemId: item.id,
      newQuantity,
      stock: item.stock,
    });

    // 如果是 rental 類型
    if (type === "rentals") {
      // 如果 stock 為 null 或 undefined，則允許任意數量
      if (item.stock == null) {
        // 使用 == 檢查 null 和 undefined
        // 允許任意數量，不做庫存檢查
      }
      // 如果 stock 不為 null 或 undefined，則檢查庫存
      else if (newQuantity > item.stock) {
        alert("商品庫存不足");
        return;
      }
    }
    // 其他類型（products 和 activities）保持原有的庫存檢查邏輯
    else if (item.stock !== null && newQuantity > item.stock) {
      // 使用 !== 檢查 null
      alert("商品庫存不足");
      return;
    }

    setIsUpdating(true);

    try {
      // 更新購物車
      await updateQuantity(type, item.id, newQuantity);
      setQuantity(newQuantity);
    } catch (error) {
      console.error("更新數量錯誤:", error);
      alert(
        error.response?.data?.message || error.message || "更新失敗，請稍後再試"
      );
      // 如果更新失敗，恢復原來的數量
      setQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  // 處理刪除
  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await removeFromCart(type, item.id);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 加入收藏
  const handleAddToFavorites = async () => {
    try {
      const success = await toggleFavorite();
      if (success) {
        // 成功加入收藏後從購物車移除
        await removeFromCart(type, item.id);
      }
    } catch (error) {
      console.error("加入收藏失敗:", error);
    }
  };

  // 新增處理 租借修改資訊的 Modal 關閉
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // 新增處理 租借修改資訊的 Modal 更新

  // 新增狀態來管理租借資訊
  const [rentalInfo, setRentalInfo] = useState({
    start_date: item.start_date,
    end_date: item.end_date,
    color: item.color,
  });
  

  // 處理 Modal 更新
  const handleModalUpdate = (updatedItem) => {
    // 更新本地狀態
    setRentalInfo({
      start_date: updatedItem.start_date,
      end_date: updatedItem.end_date,
      color: updatedItem.color,
    });

    // 關閉 Modal
    setIsModalOpen(false);
  };

  const renderQuantityControl = () => (
    <div className="quantity-control">
      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={() => handleQuantityChange(quantity - 1)}
        disabled={isUpdating}
      >
        -
      </button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
        min="1"
        className="form-control form-control-sm"
        disabled={isUpdating}
      />
      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={
          isUpdating ||
          // 如果是 rental 類型，且 stock 不為 null 或 undefined，則檢查庫存
          (type === "rentals" &&
            item.stock != null &&
            quantity >= item.stock) ||
          // 其他類型（products 和 activities）保持原有的庫存檢查邏輯
          (type !== "rentals" && item.stock !== null && quantity >= item.stock)
        }
      >
        +
      </button>
    </div>
  );

  const renderSpecificInfo = () => {
    switch (type) {
      case "products":
        return (
          <SpecModal item={item}>
            <div className="spec-display">
              <div className="spec-content">
                <div className="spec-row">
                  <span className="spec-label">尺碼：</span>
                  <span className="spec-value">
                    {item?.size_name || "沒填"}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">顏色：</span>
                  <span className="spec-value">
                    {item?.color_name || "沒填"}
                  </span>
                </div>
              </div>
              <span className="edit-mark">修改</span>
            </div>
          </SpecModal>
        );
      case "activities":
        return (
          <div className="info-display">
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">活動時間：</span>
                <div className="info-value">
                  <div>{item.date}</div>
                  <div className="time">{item.time}</div>
                </div>
              </div>
            </div>
          </div>
        );
      case "rentals":
        return (
          <>
            <div
              className="rent-display"
              onClick={() => setIsModalOpen(true)} // 觸發 修改資訊的 Modal
            >
              <div className="rent-content">
                <div className="rent-row">
                <span className="rent-label">
                  租借期間：{" "}
                  <span className="days">
                    ({calculateRentalDays(rentalInfo.start_date, rentalInfo.end_date)}天)
                  </span>
                </span>
                  <div className="rent-value">
                  <div>自 {rentalInfo.start_date}</div>
                  <div>至 {rentalInfo.end_date}</div>
                  </div>
                </div>
                <div className="rent-row">
                  <span className="rent-label">顏色：</span>
                  <span className="rent-value">{rentalInfo.color || "無"} </span>
                </div>
                {/* <div className="info-row">
                <span className="info-label">每日租金：</span>
                <span className="info-value">
                  NT$ {item.discounted_price ?? item.price}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">押金：</span>
                <span className="info-value">NT$ {item.deposit}</span>
              </div> */}
              </div>
              <span
                className="edit-mark"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  setIsModalOpen(true);
                }}
              >
                修改
              </span>
            </div>

            {isModalOpen && (
            <RentalSpecModal
              item={item}
              onClose={() => setIsModalOpen(false)}
              onUpdate={handleModalUpdate}
            />
          )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="cart-item row g-0 py-3 align-items-center border-bottom">
      <div className="col-12 col-md-4 mb-3 mb-md-0">
        <div className="d-flex align-items-start gap-2">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              className="ms-2"
              checked={isSelected}
              onChange={(e) =>
                handleSelectItem(type, item.id, e.target.checked)
              }
            />
          </div>
          <div className="product-image">
            <img
              src={item.image || "/article-5ae9687eec0d4.jpg"}
              alt={item.name || "商品圖片"}
              className="img-thumbnail"
              width={80}
              height={80}
            />
          </div>
          <div className="flex-grow-1">
            <div className="product-name mb-2">{item.name}</div>
            {type === "activities" && (
              <div className="text-muted">{item.project_name}</div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-2 mb-3 mb-md-0">{renderSpecificInfo()}</div>

      <div className="col-4 col-md-1 mb-3 mb-md-0">
        <div className="text-start text-md-center">
          <span className="d-inline d-md-none">
            {type === "rentals" ? "每日租金及押金：" : "單價："}
          </span>
          <span className="text-muted">
            {type === "rentals" ? (
              <>
                ${item.price_per_day}
                <br />
                <span className="text-muted small">(+${item.deposit})</span>
              </>
            ) : (
              `$${item.price}`
            )}
          </span>
        </div>
      </div>

      <div className="col-8 col-md-2 mb-3 mb-md-0">
        <div className="quantity-wrapper d-flex justify-content-end justify-content-md-center align-items-center gap-1">
          {renderQuantityControl()}
        </div>
      </div>

      <div className="col-6 col-md-1 mb-3 mb-md-0">
        <div className="text-start text-md-center">
          <span className="d-inline d-md-none">小計：</span>
          <div className="price">
            NT${" "}
            {type === "rentals"
              ? (Number(item.price_per_day) + Number(item.deposit)) *
                quantity *
                item.rental_days
              : Number(item.price) * quantity}
            {type === "rentals" && item.deposit > 0 && (
              <div className="text-muted small"></div>
            )}
          </div>
        </div>
      </div>

      <div className="col-6 col-md-2">
        <div className="d-flex flex-row flex-md-column align-items-end align-items-md-center gap-2">
          <button
            className="btn p-0 text-muted"
            onClick={handleAddToFavorites}
            disabled={isFavorite}
            title={isFavorite ? "商品已在收藏中" : "加入收藏"}
          >
            {isFavorite ? "已在收藏中" : "加入收藏"}
          </button>
          <button
            className="btn p-0 text-muted"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "刪除中..." : "刪除"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
