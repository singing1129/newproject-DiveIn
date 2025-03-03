"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useToast from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

// 用於儲存全局收藏狀態
const favoriteStore = {
  products: new Set(),
  activities: new Set(),
  rentals: new Set(),
  bundles: new Set(),
  listeners: new Set(),

  // 通知所有監聽器
  notify() {
    this.listeners.forEach((listener) => listener());
  },

  // 更新收藏狀態
  updateFavorites(type, ids, action = "add") {
    // 確保使用正確的 key
    const storeKey = this.getStoreKey(type);
    if (action === "add") {
      ids.forEach((id) => this[storeKey].add(id));
    } else {
      ids.forEach((id) => this[storeKey].delete(id));
    }
    this.notify();
  },

  // 設置初始收藏
  setInitialFavorites(type, ids) {
    const storeKey = this.getStoreKey(type);
    this[storeKey] = new Set(ids);
    this.notify();
  },

  // 檢查是否已收藏
  isFavorite(type, id) {
    const storeKey = this.getStoreKey(type);
    return this[storeKey].has(id);
  },

  // 獲取正確的存儲 key
  getStoreKey(type) {
    // 如果已經是複數形式，直接返回
    if (type.endsWith("s")) {
      return type;
    }
    // 否則加上 s
    return `${type}s`;
  },

  // 轉換為後端需要的格式（單數形式）
  getBackendType(type) {
    // 如果是複數形式，移除最後的 s
    if (type.endsWith("s")) {
      return type.slice(0, -1);
    }
    return type;
  },
};

// type 可以是 'product'/'products', 'activity'/'activities', 或 'rental'/'rentals' 或 'bundle'/'bundles'
export default function useFavorite(itemId, type = "products", options = {}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { disableToast = false } = options; // 设置默认值为false

  const API_BASE_URL = "http://localhost:3005/api/favorites";

  // 獲取token
  const getToken = useCallback(() => {
    return localStorage.getItem("loginWithToken");
  }, []);

  // 檢查收藏狀態
  const checkFavoriteStatus = useCallback(() => {
    if (itemId) {
      setIsFavorite(favoriteStore.isFavorite(type, itemId));
    }
  }, [itemId, type]);

  // 檢查用戶是否已登入
  const isUserLoggedIn = useCallback(() => {
    return user && user !== -1; // user不為null且不為-1(初始值)
  }, [user]);

  // 初始化收藏狀態
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // 如果已經登入
        if (isUserLoggedIn()) {
          const token = getToken();
          if (token) {
            const response = await axios.get(API_BASE_URL, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.data.success) {
              // 更新全局收藏狀態
              Object.keys(response.data.data).forEach((key) => {
                const items = response.data.data[key];
                const ids = items.map((item) => {
                  // 确保使用正确的ID字段
                  return item[`${key.slice(0, -1)}_id`]; // 例如：products -> product_id
                });
                favoriteStore.setInitialFavorites(key, ids);
              });
            }
          }
        }
      } catch (err) {
        console.error("獲取收藏狀態失敗:", err);
      }
    };

    fetchFavorites();
  }, [getToken, isUserLoggedIn]); // 依赖isUserLoggedIn而不是直接依赖user

  // 監聽全局狀態變化
  useEffect(() => {
    checkFavoriteStatus();
    favoriteStore.listeners.add(checkFavoriteStatus);
    return () => favoriteStore.listeners.delete(checkFavoriteStatus);
  }, [checkFavoriteStatus]);

  // 切換收藏狀態
  const toggleFavorite = async () => {
    if (!itemId) return false;

    // 檢查用戶是否已登入
    if (!isUserLoggedIn()) {
      if (!disableToast) {
        showToast("請先登入再收藏", { style: { backgroundColor: "orange" } });
      }
      return false;
    }

    const token = getToken();
    if (!token) {
      if (!disableToast) {
        showToast("請先登入再收藏", { style: { backgroundColor: "orange" } });
      }
      return false;
    }

    try {
      setLoading(true);
      const endpoint = isFavorite ? "remove" : "add";
      // 轉換為後端需要的格式
      const backendType = favoriteStore.getBackendType(type);

      const response = await axios.post(
        `${API_BASE_URL}/${endpoint}`,
        {
          type: backendType, // 使用轉換後的類型
          itemIds: [itemId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 更新全局狀態（使用原始類型）
        favoriteStore.updateFavorites(type, [itemId], endpoint);
        setIsFavorite(!isFavorite);

        if (!disableToast) {
          showToast(
            isFavorite ? "已從收藏移除" : "已加入收藏",
            isFavorite ? { style: { backgroundColor: "red" } } : {}
          );
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error("收藏操作失敗:", err);

      if (!disableToast) {
        showToast(
          err.response?.data?.message || "操作失敗，請稍後再試",
          "error"
        );
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  // 批量收藏操作
  const batchToggleFavorites = async (ids, action) => {
    if (!ids || ids.length === 0) return;

    // 检查用户是否已登录
    if (!isUserLoggedIn()) {
      if (!disableToast) {
        showToast("請先登入再收藏", { style: { backgroundColor: "orange" } });
      }
      return false;
    }

    const token = getToken();
    if (!token) {
      if (!disableToast) {
        showToast("請先登入再收藏", { style: { backgroundColor: "orange" } });
      }
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      // 轉換為後端需要的格式
      const backendType = favoriteStore.getBackendType(type);

      const response = await axios.post(
        `${API_BASE_URL}/${action}`,
        {
          type: backendType, // 使用轉換後的類型
          itemIds: ids,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 更新全局狀態（使用原始類型）
        favoriteStore.updateFavorites(type, ids, action);
        return true;
      }

      throw new Error(response.data.message);
    } catch (err) {
      console.error("批量收藏操作失敗:", err);
      setError(err.response?.data?.message || "批量收藏操作失敗");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isFavorite,
    toggleFavorite,
    batchToggleFavorites,
    loading,
    error,
  };
}
