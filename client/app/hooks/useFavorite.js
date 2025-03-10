"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useToast from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

// 用於儲存全局收藏狀態，直接以單數作為 key
const favoriteStore = {
  product: new Set(),
  activity: new Set(),
  rental: new Set(),
  bundle: new Set(),
  listeners: new Set(),
  initialized: false,

  notify() {
    this.listeners.forEach((listener) => listener());
  },

  updateFavorites(type, ids, action = "add") {
    if (action === "add") {
      ids.forEach((id) => this[type].add(Number(id)));
    } else {
      ids.forEach((id) => this[type].delete(Number(id)));
    }
    this.notify();
  },

  setInitialFavorites(type, ids) {
    this[type] = new Set(ids.map((id) => Number(id)));
    this.notify();
  },

  isFavorite(type, id) {
    return this[type] instanceof Set && this[type].has(Number(id));
  },
};

export default function useFavorite(itemId, type = "product", options = {}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { disableToast = false } = options;

  const API_BASE_URL = "http://localhost:3005/api/favorites";

  // 獲取 token
  const getToken = useCallback(() => {
    return localStorage.getItem("loginWithToken");
  }, []);

  // 檢查收藏狀態
  const checkFavoriteStatus = useCallback(() => {
    if (itemId) {
      const isItemFavorite = favoriteStore.isFavorite(type, itemId);
      setIsFavorite(isItemFavorite);
    }
  }, [itemId, type]);

  // 檢查用戶是否已登入
  const isUserLoggedIn = useCallback(() => {
    return user && user !== -1;
  }, [user]);

  // 初始化收藏狀態
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (isUserLoggedIn()) {
          const token = getToken();
          if (token) {
            const response = await axios.get(API_BASE_URL, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
              // 假設後端回傳的資料格式為 { product: [...], activity: [...], ... }
              Object.keys(response.data.data).forEach((key) => {
                const items = response.data.data[key];
                // 取出單數 key 對應的 id 欄位，例如 key 為 "product"，則欄位名稱為 "product_id"
                const ids = items.map((item) => Number(item[`${key}_id`]));
                favoriteStore.setInitialFavorites(key, ids);
              });
              favoriteStore.initialized = true;
              checkFavoriteStatus();
            }
          }
        }
      } catch (err) {
        console.error("獲取收藏狀態失敗:", err);
      }
    };

    if (!favoriteStore.initialized) {
      fetchFavorites();
    } else {
      checkFavoriteStatus();
    }
  }, [getToken, isUserLoggedIn, checkFavoriteStatus]);

  // 監聽全局收藏狀態變化
  useEffect(() => {
    checkFavoriteStatus();
    favoriteStore.listeners.add(checkFavoriteStatus);
    return () => favoriteStore.listeners.delete(checkFavoriteStatus);
  }, [checkFavoriteStatus]);

  // 切換單一收藏狀態
  const toggleFavorite = async () => {
    if (!itemId) return false;

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

      const response = await axios.post(
        `${API_BASE_URL}/${endpoint}`,
        {
          type: type, // 直接送出單數型態
          itemIds: [Number(itemId)],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        favoriteStore.updateFavorites(type, [Number(itemId)], endpoint);
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
      const numericIds = ids.map((id) => Number(id));

      const response = await axios.post(
        `${API_BASE_URL}/${action}`,
        {
          type: type, // 直接送單數
          itemIds: numericIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        favoriteStore.updateFavorites(type, numericIds, action);
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
