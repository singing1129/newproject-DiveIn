import React, { useState, useEffect } from "react";
import axios from "axios";

const FavoriteButton = ({ rentalId }) => {
  const [isFavorite, setIsFavorite] = useState(0); // 0: 未收藏, 1: 已收藏
  const [isLoading, setIsLoading] = useState(false); // 按照建議加個加載狀態，避免 user 重複點擊
  const userId = 1; // 直接將 userId 寫死為 1

  // 初始化的時候先檢查收藏狀態（是否已經收藏）
  useEffect(() => {
    console.log("Checking favorite status for:", rentalId);

    const checkFavoriteStatus = async () => {
      if (!userId || !rentalId) return; // 確保參數存在

      try {
        const response = await axios.get(
          "http://localhost:3005/api/favorites/check",
          {
            params: { userId, rentalId }, // 傳遞 userId 和 rentalId 來檢查收藏狀態
          }
        );
        setIsFavorite(response.data.is_like); // 設定收藏狀態
      } catch (error) {
        console.error("檢查收藏狀態失敗:", error);
      }
    };

    checkFavoriteStatus();
  }, [rentalId, userId]); // 依賴 rentalId 和 userId

  // 處理收藏按鈕點擊
  const handleClick = async (e) => {
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("handleClick 被觸發");
    console.log("userId:", userId);
    console.log("type:", "rental");
    console.log("itemId:", rentalId);

    if (isLoading) return; // 如果正在加載，則不執行

    setIsLoading(true); // 開始加載

    try {
      console.log("準備發送請求...");

      const type = "rental";
      const itemId = rentalId;
      const endpoint = isFavorite === 0 ? "add" : "remove";

      const response = await axios.post(
        `http://localhost:3005/api/favorites/${endpoint}`,
        {
          userId,
          type,
          itemIds: [itemId], // 將 itemId 包裝成陣列，與後端參數符合
        }
      );

      console.log(`${isFavorite === 0 ? "加入" : "移除"}收藏的回應:`, response);

      setIsFavorite(isFavorite === 0 ? 1 : 0); // 更新收藏狀態
    } catch (error) {
      console.error("更新收藏狀態失敗:", error);
      alert("更新收藏狀態失敗，請稍後再試");
    } finally {
      setIsLoading(false); // 結束加載
    }
  };

  // 返回 JSX
  return (
    <div
      className={`heart-icon ${isFavorite ? "filled" : ""}`}
      onClick={handleClick}
      style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
    >
      <i className={`bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}`}></i>
      {isLoading && <span>加載中...</span>}
    </div>
  );
};

export default FavoriteButton;
