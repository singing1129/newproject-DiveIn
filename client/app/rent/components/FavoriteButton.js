import React, { useState, useEffect } from "react";
import axios from "axios";
import MessageModal from "./MessageModal";
import useFavorite from "@/hooks/useFavorite"; // 引入 useFavorite

const FavoriteButton = ({
  rentalId,
  userId = 1, // 預設值改為可從 props 傳入
  className = "", // 允許傳入自訂 class
  isCircle = false, // 是否為圓形背景樣式
  onFavoriteChange, // 收藏狀態改變的回調
}) => {
  // const [isFavorite, setIsFavorite] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorite(rentalId, "rental", true);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // 合併基礎樣式與自訂樣式
  const baseClass = isCircle
    ? "icon d-flex justify-content-center align-items-center"
    : "heart-icon";

  const containerClass = `
    ${baseClass}
    ${className}
    ${isFavorite ? "filled" : ""}
    ${isCircle ? "circle-style" : ""}
  `;

  // // 初始化的時候先檢查收藏狀態（是否已經收藏）
  // useEffect(() => {
  //   // console.log("Checking favorite status for:", rentalId);

  //   const checkFavoriteStatus = async (userId, rentalId) => {
  //     try {
  //       const response = await axios.get('http://localhost:3005/api/favorites/check', {
  //         params: { userId, rentalId }
  //       });

  //       if (response.data.success) {
  //         setIsFavorite(response.data.isFavorite); // 更新 isFavorite 狀態
  //       } else {
  //         console.error('請求失敗:', response.data.message);
  //       }
  //     } catch (error) {
  //       console.error('請求失敗:', error);
  //       if (error.response && error.response.status === 404) {
  //         console.error('API 端點不存在，請檢查後端路由');
  //       }
  //     }
  //   };

  //   checkFavoriteStatus();
  // }, [rentalId, userId]); // 依賴 rentalId 和 userId

  // 處理收藏按鈕點擊
  const handleClick = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("handleClick 被觸發");
    console.log("rentalId:", rentalId);
    console.log("當前 isFavorite 狀態:", isFavorite);
    // console.log("userId:", userId);
    // console.log("type:", "rental");
    // console.log("itemId:", rentalId);

    if (isLoading) return; // 如果正在加載，則不執行

    setIsLoading(true); // 開始加載

    //   try {
    //     // console.log("準備發送請求...");

    //     const type = "rental";
    //     const itemId = rentalId;
    //     const endpoint = isFavorite === 0 ? "add" : "remove";

    //     const response = await axios.post(
    //       `http://localhost:3005/api/favorites/${endpoint}`,
    //       {
    //         userId,
    //         type,
    //         itemIds: [itemId], // 將 itemId 包裝成陣列，與後端參數符合
    //       },
    //       {
    //         headers: {
    //           "Content-Type": "application/json", // 設置為 JSON 格式
    //         },
    //       }
    //     );

    //     // console.log(`${isFavorite === 0 ? "加入" : "移除"}收藏的回應:`, response);

    //     const newStatus = isFavorite === 0 ? 1 : 0; // 更新收藏狀態
    //     setIsFavorite(newStatus);
    //     onFavoriteChange?.(newStatus); // 觸發回調

    //     // 顯示 Modal 訊息
    //     setModalMessage(newStatus ? "已加入收藏！" : "已取消收藏！");
    //     setShowModal(true);
    //   } catch (error) {
    //     setModalMessage("操作失敗，請稍後再試");
    //     setShowModal(true);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    try {
      console.log("準備發送請求...");

      const success = await toggleFavorite(); // 使用 useFavorite 的 toggleFavorite
      
      console.log("toggleFavorite 返回值:", success);

      if (success) {
        const newStatus = !isFavorite; // 更新本地狀態

        console.log("新狀態:", newStatus);

        setModalMessage(newStatus ? "已加入收藏！" : "已取消收藏！");
        setShowModal(true);
        onFavoriteChange?.(newStatus); // 觸發回調
      }
    } catch (error) {
      setModalMessage("操作失敗，請稍後再試");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 返回 JSX
  return (
    <>
      <div
        className={`${containerClass.trim()} ${
          isCircle ? "circle-button" : ""
        } ${isFavorite ? "favorited" : ""}`}
        onClick={handleClick}
        style={{
          cursor: isLoading ? "not-allowed" : "pointer",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <i className={`bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}`}></i>
        {isLoading && <span className="loading-dot"></span>}
      </div>

      <MessageModal
        message={modalMessage}
        show={showModal}
        onClose={() => setShowModal(false)}
      />

      {showModal && (
        <div
          className="modal-backdrop fade show"
          style={{ display: "block" }}
        />
      )}
    </>
  );
};

export default FavoriteButton;
