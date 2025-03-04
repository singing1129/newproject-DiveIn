"use client";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import useToast from "@/hooks/useToast";

// 創建 Context
const CartContext = createContext();
const API_BASE_URL = "http://localhost:3005/api";

// cart Provider
export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  //使用吐司
  const { showToast } = useToast();
  // const [cart, setCart] = useState([]);
  const [cartData, setCartData] = useState({
    products: [],
    activities: [],
    rentals: [],
    bundles: [], // 新增 bundles 陣列
  });

  const [error, setError] = useState(null);
  // 添加選中項目的狀態
  const [selectedItems, setSelectedItems] = useState({
    products: [],
    activities: [],
    rentals: [],
    bundles: [], // 新增 bundles 選中狀態
  });
  const router = useRouter();

  // 當用戶登入狀態改變時自動獲取購物車
  // 用戶A登出後，用戶B登入可以即時獲取購物車，優化使用者體驗
  useEffect(() => {
    if (user && user !== -1) {
      fetchCart();
    }
  }, [user]);

  // 處理全選
  const handleSelectAll = (type, items, isSelected) => {
    setSelectedItems((prev) => ({
      ...prev,
      [type]: isSelected ? items.map((item) => item.id) : [],
    }));
  };

  // 處理單個選擇
  const handleSelectItem = (type, itemId, isSelected) => {
    setSelectedItems((prev) => ({
      ...prev,
      [type]: isSelected
        ? [...prev[type], itemId]
        : prev[type].filter((id) => id !== itemId),
    }));
  };

  // 檢查是否全選
  const isAllSelected = (type) => {
    const items = cartData[type] || [];
    return items.length > 0 && items.length === selectedItems[type].length;
  };

  // 更新購物車數量
  const updateQuantity = async (type, itemId, newQuantity) => {
    if (!user || user === -1) {
      setError("請先登入");
      return false;
    }
    try {
      // 轉換 type 格式
      const updateType =
        type === "products"
          ? "product"
          : type === "activities"
          ? "activity"
          : type === "rentals"
          ? "rental"
          : "bundle"; // 新增 bundle 類型

      const response = await axios.put(`${API_BASE_URL}/cart/update`, {
        userId: user.id,
        type: updateType, // 使用轉換後的 type
        itemId,
        quantity: newQuantity,
      });

      if (response.data.success) {
        // 更新成功後重新獲取購物車數據
        await fetchCart(user.id);
        return true;
      } else {
        throw new Error(response.data.message || "更新失敗");
      }
    } catch (error) {
      throw error;
    }
  };

  // 加入商品到購物車
  // const addToCart = async (cartItem) => {
  //   if (!user || user === -1) {
  //     setError("請先登入");
  //     return false;
  //   }

  //   try {
  //     const response = await axios.post(`${API_BASE_URL}/cart/add`, {
  //       userId: user.id,
  //       ...cartItem,
  //     });

  //     if (response.data.success) {
  //       // 重新獲取購物車資料
  //       await fetchCart();
  //       showToast("商品已加入購物車");
  //       return true;
  //     }
  //   } catch (error) {
  //     console.error("加入購物車失敗:", error);
  //     setError(error.message);
  //     return false;
  //   }
  // };

  // 在 cartContext.js 中
  const addToCart = async (cartItem) => {
    if (!user || user === -1) {
      setError("請先登入");
      return false;
    }

    try {
      // 檢查是否為 bundle 類型
      if (cartItem.type === "bundle") {
        console.log("添加套組到購物車:", cartItem);

        // 發送包含變體選擇的請求
        const response = await axios.post(`${API_BASE_URL}/cart/add`, {
          userId: user.id,
          type: "bundle",
          bundleId: cartItem.bundleId,
          quantity: cartItem.quantity,
          variants: cartItem.variants, // 傳遞用戶選擇的變體
          quantities: cartItem.quantities, // 傳遞數量信息
        });

        if (response.data.success) {
          // 重新獲取購物車資料
          await fetchCart();
          showToast("套組已加入購物車");
          return true;
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/cart/add`, {
          userId: user.id,
          ...cartItem,
        });
      }
    } catch (error) {
      console.error("加入購物車失敗:", error);
      setError(error.response?.data?.message || error.message);
      return false;
    }
  };

  // 移除商品
  const removeFromCart = async (type, itemIds) => {
    if (!user || user === -1) {
      setError("請先登入");
      return false;
    }
    try {
      const response = await axios.delete(
        "http://localhost:3005/api/cart/remove",
        {
          data: {
            userId: user.id,
            type:
              type === "products"
                ? "product"
                : type === "activities"
                ? "activity"
                : type === "rentals"
                ? "rental"
                : type === "bundles"
                ? "bundle" // 新增 bundle 類型處理
                : type,
            itemIds: Array.isArray(itemIds) ? itemIds : [itemIds],
          },
        }
      );

      if (response.data.success) {
        // 刪除成功後重新獲取購物車數據
        await fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("刪除購物車項目失敗:", error);
      throw new Error(error.response?.data?.message || "刪除失敗，請稍後再試");
    }
  };

  // 從後端獲取購物車資料
  const fetchCart = async () => {
    if (!user || user === -1) {
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
      if (response.data.success) {
        const data = response.data.data;
        setCartData(data);

        // 設置預設全選，包含套組
        setSelectedItems({
          products: data.products?.map((item) => item.id) || [],
          activities: data.activities?.map((item) => item.id) || [],
          rentals: data.rentals?.map((item) => item.id) || [],
          bundles: data.bundles?.map((item) => item.id) || [],
        });
      }
    } catch (error) {
      console.error("獲取購物車失敗:", error);
      setError(error.message);
    }
  };

  // 修改 proceedToCheckout 函數
  const proceedToCheckout = async () => {
    if (!user || user === -1) {
      setError("請先登入");
      return false;
    }
    try {
      // 使用後端的 initialize endpoint 來初始化結帳流程
      const response = await axios.post(`${API_BASE_URL}/checkout/initialize`, {
        userId: user.id, // 這裡應該使用實際的 userId
      });

      if (response.data.success) {
        const { checkoutSteps } = response.data.data;

        // 根據後端返回的結果決定導向
        if (checkoutSteps.needsActivityForm) {
          // 如果需要填寫活動表單，導向 step2
          router.push("/cart/step2");
        } else if (checkoutSteps.needsShippingInfo) {
          // 如果需要配送資訊但不需要活動表單，直接導向 step3
          router.push("/cart/step3");
        } else {
          // 處理錯誤情況
          setError("購物車內容有誤，請重新確認");
        }
        return true;
      }
    } catch (error) {
      console.error("初始化結帳流程失敗:", error);
      setError(
        error.response?.data?.message || "初始化結帳流程失敗，請稍後再試"
      );
      return false;
    }
  };

  // 在 CartProvider 中添加新的函數
  const submitActivityTravelers = async (data) => {
    try {
      // 創建 FormData
      const formData = new FormData();
      formData.append("activityId", data.activityId);
      formData.append("travelers", JSON.stringify(data.travelers));

      const response = await axios.post(
        `${API_BASE_URL}/checkout/activity-travelers`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("提交旅客資料失敗:", error);
      setError(error.response?.data?.message || "提交旅客資料失敗");
      return false;
    }
  };

  const completeCheckout = async (checkoutData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/checkout/complete`, {
        userId: user.id, // 這裡應該使用實際的 userId
        ...checkoutData,
      });

      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || "結帳失敗");
    } catch (error) {
      console.error("完成結帳失敗:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        // cart,
        cartData,
        error,
        selectedItems,
        handleSelectAll,
        handleSelectItem,
        isAllSelected,
        addToCart,
        removeFromCart,
        fetchCart,
        updateQuantity,
        proceedToCheckout,
        submitActivityTravelers,
        completeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
