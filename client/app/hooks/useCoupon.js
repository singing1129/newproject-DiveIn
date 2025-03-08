// hooks/useCoupon.js
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./useAuth";

const API_BASE_URL = "http://localhost:3005/api";

export const useCoupon = (cartData) => {
  const { user } = useAuth();
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState("");

  // 取得用戶的可用優惠券
  const fetchAvailableCoupons = async () => {
    if (!user || user === -1) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/jimmy/my-available-coupons`,
        {
          params: { userId: user.id },
        }
      );

      if (response.data.success) {
        console.log("可用優惠券:", response.data.coupons);
        setAvailableCoupons(response.data.coupons);
      } else {
        console.error("獲取可用優惠券失敗:", response.data.message);
        setError("無法載入優惠券");
      }
    } catch (err) {
      console.error("獲取可用優惠券失敗:", err);
      setError("無法載入優惠券");
    } finally {
      setLoading(false);
    }
  };

  // 取得用戶的所有優惠券
  const fetchAllCoupons = async () => {
    if (!user || user === -1) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/jimmy/my-all-coupons`, {
        params: { userId: user.id },
      });

      if (response.data.success) {
        console.log("所有優惠券:", response.data.coupons);
        setAllCoupons(response.data.coupons);
      } else {
        console.error("獲取所有優惠券失敗:", response.data.message);
      }
    } catch (err) {
      console.error("獲取所有優惠券失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 檢查優惠券是否適用於目前購物車
  const checkEligibility = () => {
    if (!cartData || !availableCoupons.length) return;

    console.log("檢查優惠券適用性");
    console.log("購物車:", cartData);
    console.log("可用優惠券:", availableCoupons);

    const subtotal = calculateSubtotal();
    console.log("購物車小計:", subtotal);

    // 篩選出符合條件的優惠券
    const eligible = availableCoupons.filter((coupon) => {
      console.log("檢查優惠券:", coupon);

      // 檢查最低消費
      const minSpent = parseFloat(coupon.min_spent);
      const isMinSpentMet = subtotal >= minSpent;
      console.log("最低消費:", minSpent, "是否達到:", isMinSpentMet);

      if (!isMinSpentMet) {
        console.log("未達到最低消費，跳過");
        return false;
      }

      // 檢查是否適用於購物車內容
      // 默認所有優惠券適用於全館，除非有特定限制
      let isApplicable = true;

      // 這裡可以根據優惠券類型進行更細緻的檢查
      // 例如檢查是否僅適用於特定商品、特定類型等

      console.log("是否適用於購物車:", isApplicable);

      return isApplicable;
    });

    console.log("符合條件的優惠券:", eligible);
    setEligibleCoupons(eligible);
  };

  // 計算購物車小計
  const calculateSubtotal = () => {
    if (!cartData) return 0;

    // 如果有total.final欄位，直接使用
    if (cartData.total && typeof cartData.total.final === "number") {
      console.log("使用購物車提供的總額:", cartData.total.final);
      return cartData.total.final;
    }

    let subtotal = 0;

    // 計算一般商品總價
    if (cartData.products && Array.isArray(cartData.products)) {
      const productsTotal = cartData.products.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      console.log("一般商品總價:", productsTotal);
      subtotal += productsTotal;
    }

    // 計算活動總價
    if (cartData.activities && Array.isArray(cartData.activities)) {
      const activitiesTotal = cartData.activities.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      console.log("活動總價:", activitiesTotal);
      subtotal += activitiesTotal;
    }

    // 計算租賃總價
    if (cartData.rentals && Array.isArray(cartData.rentals)) {
      const rentalsTotal = cartData.rentals.reduce(
        (sum, item) => sum + parseFloat(item.rental_fee || 0),
        0
      );
      console.log("租賃總價:", rentalsTotal);
      subtotal += rentalsTotal;
    }

    // 計算套組總價
    if (cartData.bundles && Array.isArray(cartData.bundles)) {
      const bundlesTotal = cartData.bundles.reduce(
        (sum, item) => sum + parseFloat(item.discount_price) * item.quantity,
        0
      );
      console.log("套組總價:", bundlesTotal);
      subtotal += bundlesTotal;
    }

    console.log("計算後的購物車小計:", subtotal);
    return subtotal;
  };

  // 應用優惠券
  const applyCoupon = (coupon) => {
    console.log("應用優惠券:", coupon);
    setSelectedCoupon(coupon);
  };

  // 取消優惠券
  const removeCoupon = () => {
    console.log("移除選擇的優惠券");
    setSelectedCoupon(null);
  };

  // 計算優惠金額
  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    const subtotal = calculateSubtotal();

    if (selectedCoupon.discount_type === "金額") {
      return parseFloat(selectedCoupon.discount);
    } else if (selectedCoupon.discount_type === "折扣 %") {
      // 計算折扣金額 (例如: 90% = 10% 折扣)
      const discountPercent = parseFloat(selectedCoupon.discount);
      const discountAmount = ((subtotal * discountPercent) / 100).toFixed(0);
      console.log(
        "折扣百分比:",
        discountPercent,
        "%, 折扣金額:",
        discountAmount
      );
      return parseFloat(discountAmount);
    }

    return 0;
  };

  // 使用優惠券代碼
  const applyByCouponCode = async () => {
    if (!couponCode.trim() || !user || user === -1) return;

    try {
      setLoading(true);
      // 這裡需要實現一個從優惠券代碼查詢可用優惠券的功能
      // 目前暫時不處理優惠券代碼領取
      setError("目前暫不支持優惠券代碼輸入");
    } catch (err) {
      console.error("應用優惠券代碼失敗:", err);
      setError(err.response?.data?.error || "無法應用優惠券代碼");
    } finally {
      setLoading(false);
    }
  };

  // 標記優惠券為已使用
  const markCouponAsUsed = async (couponUsageId) => {
    if (!user || user === -1 || !couponUsageId) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/jimmy/use-coupon`, {
        couponUsageId,
        userId: user.id,
      });

      if (response.data.success) {
        console.log("優惠券已標記為已使用:", response.data);
        // 重新獲取優惠券列表
        await fetchAvailableCoupons();
        await fetchAllCoupons();
        return true;
      } else {
        console.error("標記優惠券失敗:", response.data.message);
        return false;
      }
    } catch (err) {
      console.error("標記優惠券失敗:", err);
      return false;
    }
  };

  // 結帳時調用，將優惠券標記為已使用
  const completeCouponUsage = async () => {
    if (selectedCoupon && selectedCoupon.coupon_usage_id) {
      console.log("正在標記優惠券為已使用:", selectedCoupon.coupon_usage_id);
      return await markCouponAsUsed(selectedCoupon.coupon_usage_id);
    }
    return true;
  };

  // 當用戶或購物車內容變更時，重新獲取優惠券
  useEffect(() => {
    if (user && user !== -1) {
      fetchAvailableCoupons();
      fetchAllCoupons();
    }
  }, [user]);

  // 當優惠券列表或購物車內容變更時，重新檢查適用性
  useEffect(() => {
    checkEligibility();
  }, [availableCoupons, cartData]);

  return {
    availableCoupons,
    allCoupons,
    eligibleCoupons,
    selectedCoupon,
    applyCoupon,
    removeCoupon,
    calculateDiscount,
    loading,
    error,
    couponCode,
    setCouponCode,
    applyByCouponCode,
    completeCouponUsage, // 新增：完成優惠券使用的函數
  };
};
