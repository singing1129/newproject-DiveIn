"use client";
import React, { useState, useEffect, useCallback } from "react";
import CouponSelector from "./components/CouponSelector";
import { useCoupon } from "@/hooks/useCoupon";
import "./step3.css";
import CartFlow from "../components/cartFlow";
import { useRouter, useSearchParams } from "next/navigation";
import CreditCard from "./components/creditCard";
import { useShip711StoreOpener } from "./ship/_hooks/use-ship-711-store";
import { nextUrl } from "../../../config";
import { useCart } from "@/hooks/cartContext";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
const API_BASE_URL = "http://localhost:3005/api";

// 將 HomeDeliveryForm 提取為獨立組件
const HomeDeliveryForm = React.memo(
  ({ shippingInfo, onInputChange, cityDistricts }) => {
    HomeDeliveryForm.displayName = "HomeDeliveryForm";

    // 當縣市改變時，清空區域
    const handleCityChange = (e) => {
      const selectedCity = e.target.value;
      onInputChange({ target: { name: "city", value: selectedCity } });

      // 清空區域選擇
      onInputChange({ target: { name: "district", value: "" } });
    };

    return (
      <div className="mt-3">
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="sameAsCustomer"
            defaultChecked
          />
          <label className="form-check-label" htmlFor="sameAsCustomer">
            收件人資料與會員資料相同
          </label>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <input
              type="text"
              className="form-control"
              placeholder="收件人姓名"
              name="name"
              value={shippingInfo.name}
              onChange={onInputChange}
            />
          </div>
          <div className="col-6">
            <input
              type="tel"
              className="form-control"
              placeholder="手機號碼"
              name="phone"
              value={shippingInfo.phone}
              onChange={onInputChange}
            />
          </div>
          <div className="col-2">
            <select
              className="form-select mb-2"
              name="city"
              value={shippingInfo.city}
              onChange={handleCityChange}
            >
              <option value="">選擇縣市</option>
              {Object.keys(cityDistricts).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="col-2">
            <select
              className="form-select mb-2"
              name="district"
              value={shippingInfo.district}
              onChange={onInputChange}
              disabled={!shippingInfo.city}
            >
              <option value="">選擇區域</option>
              {shippingInfo.city &&
                cityDistricts[shippingInfo.city]?.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="詳細地址"
              name="address"
              value={shippingInfo.address}
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
    );
  }
);

// 將 StorePickupForm 也提取為獨立組件
const StorePickupForm = React.memo(
  ({ shippingInfo, onInputChange, store711, openWindow }) => {
    StorePickupForm.displayName = "StorePickupForm";
    return (
      <div className="mt-3">
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="sameAsCustomer2"
            defaultChecked
          />
          <label className="form-check-label" htmlFor="sameAsCustomer2">
            收件人資料與會員資料相同
          </label>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <input
              type="text"
              className="form-control"
              placeholder="收件人姓名"
              name="name"
              value={shippingInfo.name}
              onChange={onInputChange}
            />
          </div>
          <div className="col-6">
            <input
              type="tel"
              className="form-control"
              placeholder="手機號碼"
              name="phone"
              value={shippingInfo.phone}
              onChange={onInputChange}
            />
          </div>
          <div className="col-12">
            <button
              className="btn btn-outline-primary w-100"
              onClick={openWindow}
            >
              選擇 7-11 門市
            </button>
          </div>
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="門市名稱"
              value={store711.storename}
              readOnly
            />
          </div>
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="門市地址"
              value={store711.storeaddress}
              readOnly
            />
          </div>
        </div>
      </div>
    );
  }
);

const Cart2 = () => {
  // 添加縣市和區域的狀態和函數
  const [cityDistricts, setCityDistricts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/cityDistricts.json");
        const data = await response.json();
        setCityDistricts(data);
      } catch (error) {
        console.error("載入 cityDistricts.json 失敗:", error);
      }
    };

    fetchData();
  }, []);
  // 添加優惠券相關的狀態和函數
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cartData, completeCheckout } = useCart();
  const [checkoutSteps, setCheckoutSteps] = useState({
    needsShippingInfo: false,
  });
  // 新增優惠券處理
  const {
    selectedCoupon,
    applyCoupon,
    removeCoupon,
    calculateDiscount,
    completeCouponUsage,
  } = useCoupon(cartData);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const [shippingMethod, setShippingMethod] = useState("homeDelivery");

  const shippingChange = (e) => {
    const method = e.target.value;
    setShippingMethod(method);
    setShippingInfo((prev) => ({
      ...prev,
      method,
    }));
  };
  // console.log(shippingMethod);

  // 添加7-11門市選擇 hook
  const { store711, openWindow } = useShip711StoreOpener(
    `${nextUrl}/cart/step3/ship/api`,
    { autoCloseMins: 3 }
  );

  console.log(cartData);
  // 檢查是否只有活動項目
  const hasOnlyActivities =
    cartData.activities.length > 0 &&
    cartData.products.length === 0 &&
    cartData.rentals.length === 0;

  useEffect(() => {
    // 在頁面載入時檢查是否需要顯示配送資訊表單
    const initializeCheckout = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/checkout/initialize`,
          {
            userId: user.id, // 這裡應該使用實際的 userId
          }
        );

        if (response.data.success) {
          setCheckoutSteps(response.data.data.checkoutSteps);
        }
      } catch (error) {
        console.error("初始化結帳頁面失敗:", error);
      }
    };

    initializeCheckout();
  }, []);

  // 在 step3 頁面頂部加入 useEffect 來確認資料
  useEffect(() => {
    // 如果購物車是空的，導回 step1
    if (
      !cartData ||
      (cartData.products.length === 0 &&
        cartData.activities.length === 0 &&
        cartData.rentals.length === 0 &&
        cartData.bundles.length === 0)
    ) {
      router.push("/cart/step1");
      return;
    }
  }, [cartData, router]);

  // 在組件頂部添加 shippingInfo state
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    storeName: "",
    storeAddress: "",
    method: "",
  });

  const handleShippingInfoChange = useCallback((e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 處理商品名稱
  const itemNames = [
    ...cartData.products.map(
      (item) => `${item.product_name} x ${item.quantity}`
    ),
    ...cartData.activities.map(
      (item) => `${item.activity_name} x ${item.quantity}`
    ),
    ...cartData.rentals.map((item) => `${item.rental_name} x ${item.quantity}`),
    ...cartData.bundles.map(
      (item) =>
        `${item.name} x ${item.quantity} ${item.items.map(
          (i) => i.product_name + " x " + i.quantity
        )}`
    ),
  ];

  //linepay
  const handleLinePayCheckout = async () => {
    try {
      validateOrder();

      // 獲取活動旅客資料
      const activityTravelers = JSON.parse(
        localStorage.getItem("activityTravelers") || "{}"
      );

      // 獲取表單數據
      let shippingData = null;
      if (checkoutSteps.needsShippingInfo) {
        if (shippingMethod === "homeDelivery") {
          shippingData = {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            city: shippingInfo.city,
            district: shippingInfo.district,
            address: shippingInfo.address,
            method: "homeDelivery",
          };
        } else {
          shippingData = {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            storeId: store711.id || "",
            storeName: store711.storename,
            storeAddress: store711.storeaddress,
            method: "storePickup",
          };
        }
      }

      // // 建立訂單前標記優惠券為已使用
      // if (selectedCoupon) {
      //   await completeCouponUsage();
      // }

      // 建立訂單
      const orderResponse = await fetch(`${API_BASE_URL}/checkout/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          shippingInfo: checkoutSteps.needsShippingInfo ? shippingData : null,
          paymentMethod: "linepay",
          couponCode: selectedCoupon ? selectedCoupon.code : null,
          // couponUsageId: selectedCoupon ? selectedCoupon.coupon_usage_id : null,
          // couponDiscount: couponDiscount,
          activityTravelers: Object.values(activityTravelers).flat(),
        }),
      });

      const orderResult = await orderResponse.json();
      console.log("orderResult:", orderResult);

      // if (!orderResult.success) throw new Error(orderResult.message);
      localStorage.setItem("lastOrderId", orderResult.data.orderId);

      // 2️⃣ **取得訂單金額**
      const amount = orderResult.data.totalAmount;
      const itemNames = [
        ...cartData.products.map((p) => p.product_name),
        ...cartData.activities.map((a) => a.activity_name),
        ...cartData.rentals.map((r) => r.rental_name),
        ...cartData.bundles.map((b) => b.bundle_name),
      ].join(",");

      // 3️⃣ **向 `/linepay/reserve` 發送付款請求**
      const response = await fetch(
        `http://localhost:3005/api/linepay/reserve?amount=${amount}&items=${encodeURIComponent(
          itemNames
        )}`
      );

      console.log("LINE Pay Reserve API Response:", response);
      const result = await response.json();
      console.log("Parsed result:", result);

      if (result.status !== "success") throw new Error("LINE Pay 預約失敗");

      // 4️⃣ **儲存交易 ID 並跳轉付款頁**
      localStorage.setItem("linePayTransactionId", result.data.transactionId);
      window.location.href = result.data.paymentUrl;
    } catch (error) {
      console.error("LINE Pay 付款失敗:", error);

      // 提供更明確的錯誤訊息
      if (error.message.includes("優惠券")) {
        alert(
          `優惠券錯誤: ${error.message}. 請嘗試使用其他優惠券或不使用優惠券結帳。`
        );
      } else {
        alert(error.message);
      }
    }
  };

  useEffect(() => {
    const confirmLinePay = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get("transactionId");
      if (!transactionId) return;

      const storedTransactionId = localStorage.getItem("linePayTransactionId");
      if (storedTransactionId !== transactionId) {
        console.error("❌ 交易 ID 不匹配");
        return;
      }

      console.log("🟢 確認付款中，交易 ID:", transactionId);

      try {
        const amount = calculateTotal();
        const response = await fetch(
          `http://localhost:3005/api/linepay/confirm?transactionId=${transactionId}&amount=${amount}`
        );

        const result = await response.json();
        console.log(" LINE Pay 確認結果:", result);

        if (result.success) {
          console.log(" 付款成功，重新獲取訂單資訊...");

          //  **重新請求最新訂單資訊**
          const lastOrderId = localStorage.getItem("lastOrderId");
          if (!lastOrderId) {
            console.error("❌ 找不到 lastOrderId，無法更新訂單狀態！");
            return;
          }

          const orderResponse = await axios.get(
            `http://localhost:3005/api/order/${lastOrderId}`
          );

          const updatedOrder = orderResponse.data.data;
          console.log(" 更新後的訂單資訊:", updatedOrder);

          //  **更新狀態**
          if (updatedOrder.orderInfo.orderStatus === "paid") {
            alert("付款成功，訂單狀態已更新！");
          } else {
            alert("付款成功，但訂單狀態未更新，請聯絡客服！");
          }

          //**確保 `orderStatus` 不會卡在 `pending`**
          router.push("/order/success");
        } else {
          alert("付款失敗");
        }
      } catch (error) {
        console.error("❌ 確認付款時發生錯誤:", error);
      }
    };

    confirmLinePay();
  }, []);

  //ecpay
  const handleEcpayCheckout = async () => {
    try {
      // 獲取表單數據
      let shippingData = null;
      if (checkoutSteps.needsShippingInfo) {
        if (shippingMethod === "homeDelivery") {
          shippingData = {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            city: shippingInfo.city,
            district: shippingInfo.district,
            address: shippingInfo.address,
            method: "homeDelivery",
          };
        } else {
          shippingData = {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            storeId: store711.id || "",
            storeName: store711.storename,
            storeAddress: store711.storeaddress,
            method: "storePickup",
          };
        }
      }

      // 獲取活動旅客資料
      const activityTravelers = JSON.parse(
        localStorage.getItem("activityTravelers") || "{}"
      );
      // // 建立訂單前標記優惠券為已使用
      // if (selectedCoupon) {
      //   await completeCouponUsage();
      // }

      // 建立訂單
      const orderResponse = await fetch(`${API_BASE_URL}/checkout/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          shippingInfo: checkoutSteps.needsShippingInfo ? shippingData : null,
          paymentMethod: "ecpay",
          couponCode: selectedCoupon ? selectedCoupon.code : null,
          // couponUsageId: selectedCoupon ? selectedCoupon.coupon_usage_id : null,
          // couponDiscount: couponDiscount,
          activityTravelers: Object.values(activityTravelers).flat(),
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.message || "建立訂單失敗");
      }

      localStorage.setItem("lastOrderId", orderResult.data.id);
      // 清除暫存的旅客資料
      localStorage.removeItem("activityTravelers");

      // 2. 取得綠界支付資訊
      const ecpayResponse = await fetch(
        `http://localhost:3005/api/ecpay?amount=${
          orderResult.data.totalAmount
        }&items=${itemNames.join(",")}`
      );

      const ecpayResult = await ecpayResponse.json();

      if (ecpayResult.status === "success") {
        // 3. 建立並送出綠界支付表單
        const form = document.createElement("form");
        form.method = "POST";
        form.action = ecpayResult.data.action;

        // 加入所有需要的欄位
        Object.entries(ecpayResult.data.params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        // 送出表單
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        throw new Error("無法取得綠界支付資訊");
      }
    } catch (error) {
      console.error("結帳失敗:", error);
      alert(error.message || "付款過程發生錯誤");
    }
  };

  // 計算商品小計
  const calculateSubtotal = () => {
    return cartData.total?.final || 0; // 使用可選鏈運算符
  };

  // 計算運費
  const calculateShipping = () => {
    // 如果只有活動商品，不需要運費
    if (hasOnlyActivities) {
      return 0;
    }
    // 根據配送方式計算運費
    const subtotal = calculateSubtotal();
    if (shippingMethod === "homeDelivery") {
      return subtotal >= 1000 ? 0 : 80;
    }
    return subtotal >= 1000 ? 0 : 60;
  };

  // 計算優惠券折扣金額
  const couponDiscount = selectedCoupon ? calculateDiscount() : 0;
  // 更新計算總金額的函數，考慮優惠券折扣
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() - couponDiscount;
  };
  // useEffect(() => {
  //   console.log("結帳頁面 - 選中優惠券:", selectedCoupon);
  //   console.log("結帳頁面 - 可用優惠券數量:", eligibleCoupons?.length);
  //   console.log("結帳頁面 - 所有優惠券數量:", availableCoupons?.length);
  //   console.log("結帳頁面 - 優惠折扣金額:", couponDiscount);
  // }, [selectedCoupon, eligibleCoupons, availableCoupons, couponDiscount]);

  const validateOrder = () => {
    // 檢查購物車是否為空
    if (
      !cartData ||
      (cartData.products.length === 0 &&
        cartData.activities.length === 0 &&
        cartData.rentals.length === 0 &&
        cartData.bundles.length === 0)
    ) {
      throw new Error("購物車是空的");
    }

    // 只在需要配送資訊時檢查
    if (checkoutSteps.needsShippingInfo) {
      if (shippingMethod === "homeDelivery") {
        const nameInput = document.querySelector('input[name="name"]');
        const phoneInput = document.querySelector('input[name="phone"]');
        const citySelect = document.querySelector('select[name="city"]');
        const addressInput = document.querySelector('input[name="address"]');

        if (
          !nameInput?.value ||
          !phoneInput?.value ||
          !citySelect?.value ||
          !addressInput?.value
        ) {
          throw new Error("請填寫完整的配送資訊");
        }
      } else {
        const nameInput = document.querySelector(
          '.form-control[placeholder="收件人姓名"]'
        );
        const phoneInput = document.querySelector(
          '.form-control[placeholder="手機號碼"]'
        );

        if (
          !nameInput?.value ||
          !phoneInput?.value ||
          !store711.storename ||
          !store711.storeaddress
        ) {
          throw new Error("請填寫完整的取貨資訊並選擇門市");
        }
      }
    }
    // 添加優惠券檢查
    if (selectedCoupon) {
      const subtotal = calculateSubtotal();
      if (subtotal < parseFloat(selectedCoupon.min_spent)) {
        throw new Error(
          `訂單金額未達到優惠券使用條件，最低消費為 NT$${selectedCoupon.min_spent}`
        );
      }
    }

    // 檢查金額
    if (calculateTotal() <= 0) {
      throw new Error("訂單金額錯誤");
    }
  };

  return (
    <>
      <div className="cartCss2">
        <div className="container py-5">
          <CartFlow />
          <div className="total-price-area">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <button
                className="btn btn-link text-decoration-none p-0"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#cartPreview"
                aria-expanded="false"
                aria-controls="cartPreview"
              >
                購物車 <i className="bi bi-chevron-down" />
              </button>
            </div>
            {/* 購物車預覽區域 */}
            <div className="collapse" id="cartPreview">
              <div className="cart-preview-items">
                {/* 一般商品 */}
                {cartData.products.map((item) => (
                  <div
                    key={item.id}
                    className="cart-preview-item d-flex align-items-center p-2 border-bottom"
                  >
                    <img
                      src={
                        item.image_url
                          ? `/uploads/${item.image_url}`
                          : "/images/no-image.jpg"
                      }
                      className="img-thumbnail"
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                      alt={item.product_name}
                    />
                    <div className="ms-3 flex-grow-1">
                      <div className="fw-bold">{item.product_name}</div>
                      <div className="text-muted small">
                        {item.color_name && <div>顏色：{item.color_name}</div>}
                        {item.size_name && <div>尺寸：{item.size_name}</div>}
                        {item.original_price !== item.price && (
                          <div className="text-danger">
                            原價：<del>NT$ {item.original_price}</del>
                          </div>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <div className="text-primary">NT$ {item.price}</div>
                        <div className="text-muted">數量：{item.quantity}</div>
                        <div className="text-primary fw-bold">
                          NT$ {item.subtotal}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 活動商品 */}
                {cartData.activities.map((item) => (
                  <div
                    key={item.id}
                    className="cart-preview-item d-flex align-items-center p-2 border-bottom"
                  >
                    <img
                      src={
                        item.image_url
                          ? `/uploads/${item.image_url}`
                          : "/images/no-image.jpg"
                      }
                      className="img-thumbnail"
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                      alt={item.activity_name}
                    />
                    <div className="ms-3 flex-grow-1">
                      <div className="fw-bold">{item.activity_name}</div>
                      <div className="text-muted small">
                        <div>活動日期：{item.date}</div>
                        <div>活動時間：{item.time}</div>
                        <div>方案名稱：{item.project_name}</div>
                        {item.original_price !== item.price && (
                          <div className="text-danger">
                            原價：<del>NT$ {item.original_price}</del>
                          </div>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <div className="text-primary">NT$ {item.price}</div>
                        <div className="text-muted">
                          報名人數：{item.quantity}
                        </div>
                        <div className="text-primary fw-bold">
                          NT$ {item.subtotal}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 租賃商品 */}
                {cartData.rentals.map((item) => (
                  <div
                    key={item.id}
                    className="cart-preview-item d-flex align-items-center p-2 border-bottom"
                  >
                    <img
                      src={item.image_url || "/images/no-image.jpg"}
                      className="img-thumbnail"
                      style={{ width: 80, height: 80, objectFit: "cover" }}
                      alt={item.rental_name}
                    />
                    <div className="ms-3 flex-grow-1">
                      <div className="fw-bold">{item.rental_name}</div>
                      <div className="text-muted small">
                        <div>
                          租賃期間：{item.start_date} ~ {item.end_date}
                        </div>
                        <div>租賃天數：{item.rental_days} 天</div>
                        {item.price !== item.discounted_price && (
                          <div className="text-danger">
                            原價：<del>NT$ {item.price}</del>
                          </div>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <div className="text-primary">
                          NT$ {item.discounted_price} × {item.rental_days}天
                        </div>
                        <div className="text-muted">數量：{item.quantity}</div>
                        <div className="text-primary fw-bold">
                          NT$ {item.rental_fee}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 小計區域 */}
                <div className="p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted">總金額</div>
                      <div className="text-muted small">
                        共{" "}
                        {cartData.products.length +
                          cartData.activities.length +
                          cartData.rentals.length}{" "}
                        項
                      </div>
                    </div>
                    <div className="text-primary fw-bold fs-5">
                      NT$ {calculateSubtotal()}
                    </div>
                  </div>
                </div>

                {/* 返回購物車按鈕 */}
                <div className="text-center p-3">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => router.push("/cart/step1")}
                  >
                    返回購物車修改
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 主要內容區 */}
          <div className="row mt-4">
            {/* 左側主要內容 (佔 8 欄位) */}
            <div className="col-8">
              {/* 送貨方式 */}
              {checkoutSteps.needsShippingInfo && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">一般商品&租賃配送資訊</h5>
                  </div>
                  <div className="card-body">
                    <div className="vstack gap-3">
                      {/* 送貨選項 */}
                      <div className="d-flex gap-4">
                        <div className="form-check shipping-method-card">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="shippingMethod"
                            id="homeDelivery"
                            value="homeDelivery"
                            checked={shippingMethod === "homeDelivery"}
                            onChange={shippingChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="homeDelivery"
                          >
                            <div className="fw-bold">宅配到府</div>
                            <div className="shipping-fee">
                              {calculateSubtotal() >= 1000 ? (
                                <>
                                  <del className="text-muted me-2">NT$ 80</del>
                                  <span className="text-success">免運費</span>
                                </>
                              ) : (
                                <span>運費 NT$ 80</span>
                              )}
                            </div>
                            {calculateSubtotal() >= 1000 && (
                              <span className="badge bg-success">
                                已符合免運
                              </span>
                            )}
                          </label>
                        </div>
                        <div className="form-check shipping-method-card">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="shippingMethod"
                            id="storePickup"
                            value="storePickup"
                            checked={shippingMethod === "storePickup"}
                            onChange={shippingChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="storePickup"
                          >
                            <div className="fw-bold">超商取貨</div>
                            <div className="shipping-fee">
                              {calculateSubtotal() >= 1000 ? (
                                <>
                                  <del className="text-muted me-2">NT$ 60</del>
                                  <span className="text-success">免運費</span>
                                </>
                              ) : (
                                <span>運費 NT$ 60</span>
                              )}
                            </div>
                            {calculateSubtotal() >= 1000 && (
                              <span className="badge bg-success">
                                已符合免運
                              </span>
                            )}
                          </label>
                        </div>
                      </div>
                      {/* 根據選擇的配送方式顯示對應的表單 */}
                      {shippingMethod === "homeDelivery" ? (
                        <HomeDeliveryForm
                          shippingInfo={shippingInfo}
                          onInputChange={handleShippingInfoChange}
                          cityDistricts={cityDistricts}
                        />
                      ) : (
                        <StorePickupForm
                          shippingInfo={shippingInfo}
                          onInputChange={handleShippingInfoChange}
                          store711={store711}
                          openWindow={openWindow}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* 優惠券 */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">使用優惠券</h5>
                </div>
                <div className="card-body">
                  <CouponSelector
                    cartData={cartData}
                    onApplyCoupon={applyCoupon}
                    onRemoveCoupon={removeCoupon}
                  />
                  <div className="mb-4">
                    <div
                      id="couponMessage"
                      className="mt-2"
                      style={{ display: "none" }}
                    >
                      <small className="text-success">
                        <i className="bi bi-check-circle-fill me-1" />
                        已套用優惠碼，折抵 NT$ {calculateDiscount()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 右側訂單摘要 (佔 4 欄位) */}
            <div className="col-4">
              <div className="card position-sticky" style={{ top: "5rem" }}>
                <div className="card-header">
                  <h5 className="mb-0">訂單摘要</h5>
                </div>
                <div className="card-body">
                  <div className="vstack gap-2">
                    <div className="d-flex justify-content-between">
                      <span>商品金額</span>
                      <span>NT$ {calculateSubtotal()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>運費</span>
                      <div className="text-end">
                        {hasOnlyActivities ? (
                          <span className="text-success">活動無需運費</span>
                        ) : calculateSubtotal() >= 1000 ? (
                          <div>
                            <del className="text-muted me-2">
                              NT$ {shippingMethod === "homeDelivery" ? 80 : 60}
                            </del>
                            <span className="text-success">免運費</span>
                          </div>
                        ) : (
                          <div>
                            <span>
                              NT$ {shippingMethod === "homeDelivery" ? 80 : 60}
                            </span>
                            <div className="free-shipping-hint mt-1">
                              <small className="text-danger">
                                <i className="bi bi-info-circle me-1" />
                                {calculateSubtotal() >= 1000 ? (
                                  <span className="text-success">
                                    已符合免運
                                  </span>
                                ) : (
                                  <>
                                    還差 NT$ {1000 - calculateSubtotal()}{" "}
                                    享免運優惠
                                  </>
                                )}
                                <Link
                                  href="/products"
                                  className="text-danger text-decoration-none ms-1"
                                >
                                  <small>去湊單</small>
                                  <i className="bi bi-arrow-right" />
                                </Link>
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between text-danger">
                      <span>優惠折抵</span>
                      {couponDiscount > 0 ? (
                        <span>-NT$ {couponDiscount}</span>
                      ) : (
                        <span>NT$ 0</span>
                      )}
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>總計金額</span>
                      <span className="text-danger fs-5">
                        {/* 優惠折抵後的金額 */}
                        NT$ {calculateTotal()}
                      </span>
                    </div>
                    <button
                      className="btn btn-primary w-100 mt-3 p-3 fw-bold shadow-lg rounded-pill"
                      onClick={handleEcpayCheckout}
                    >
                      <i className="bi bi-credit-card me-2"></i>
                      信用卡
                    </button>
                    <button
                      className="btn btn-success w-100 mt-3 p-3 fw-bold shadow-lg rounded-pill text-white fw-100"
                      onClick={handleLinePayCheckout}
                    >
                      <div>Line Pay</div>
                    </button>
                    {/* <button
                      className="btn btn-warning w-100 mt-3 p-3 fw-bold shadow-lg"
                      onClick={handleOpenModal}
                    >
                      信用卡支付
                    </button> */}
                    {/* <div className="text-center mt-2">
                      <small className="text-muted">
                        完成訂單可獲得 18 點購物金
                      </small>
                    </div> */}
                  </div>
                </div>
              </div>
              {/* 湊單商品推薦區 */}
              <div className="collapse mt-3" id="recommendProducts">
                <div className="recommend-products">
                  <div className="small fw-bold mb-2">推薦商品</div>
                  <div className="vstack gap-2">
                    {/* 推薦商品項目 */}
                    <div className="recommend-item d-flex align-items-center p-2 border rounded">
                      <img
                        src="https://picsum.photos/100/100"
                        className="img-thumbnail"
                        style={{ width: 50, height: 50 }}
                      />
                      <div className="ms-3 flex-grow-1">
                        <div className="small fw-bold">推薦商品名稱</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-danger">NT$ 199</span>
                          <button className="btn btn-outline-danger btn-sm">
                            加入購物車
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="recommend-item d-flex align-items-center p-2 border rounded">
                      <img
                        src="https://picsum.photos/100/100"
                        className="img-thumbnail"
                        style={{ width: 50, height: 50 }}
                      />
                      <div className="ms-3 flex-grow-1">
                        <div className="small fw-bold">推薦商品名稱 2</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-danger">NT$ 299</span>
                          <button className="btn btn-outline-danger btn-sm">
                            加入購物車
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 正確傳遞 props 給 CreditCard 組件 */}
      <CreditCard isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default Cart2;
