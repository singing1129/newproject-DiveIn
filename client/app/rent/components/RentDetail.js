"use client";

import { useRef, useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic"; // 動態導入，動態加載 flatpickr，從而避免伺服器端渲染時的問題
import { useParams } from "next/navigation"; // 獲取 url 當中的 id，useParams修改為useSearchParams 更改
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "./flatpickr.css"; // 我定義的小日曆css
import "./RentDetail.css";
import "bootstrap/dist/css/bootstrap.min.css";
// import "./modal2.css"; // 我定義的你可能會喜歡modalcss(跟rentlist同支)
import "../../../public/globals.css";
import HeartIcon from "./HeartIcon/HeartIcon";
import { useCart } from "@/hooks/cartContext"; // 加入購物車

const Flatpickr = dynamic(() => import("flatpickr"), { ssr: false });

const API_BASE_URL = "http://localhost:3005/api";

export default function RentProductDetail() {
  //   const { id } = useParams(); // 取得動態路由參數
  const { id } = useParams(); // 取得動態路由參數
  const [product, setProduct] = useState(null); // 商品資料
  const [quantity, setQuantity] = useState(1); // 租借數量
  const [selectedColor, setSelectedColor] = useState(null); // 選擇的顏色
  const [startDate, setStartDate] = useState(""); // 租借開始日期
  const [endDate, setEndDate] = useState(""); // 租借結束日期
  const [isFavorite, setIsFavorite] = useState(0); // 愛心收藏功能
  const [loading, setLoading] = useState(true); // 加載狀態
  const [error, setError] = useState(null); // 錯誤狀態
  const { fetchCart } = useCart(); // 從 cartContext 中獲取 fetchCart 方法
  const [mainImage, setMainImage] = useState(""); // 商品大張圖片（要做大圖切換
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 當前顯示的圖片索引
  const [selectedDates, setSelectedDates] = useState([]); // 讓我知道會員選擇了多少天數（動態計算價格用
  const [recommendedProducts, setRecommendedProducts] = useState([]); // 你可能會喜歡的隨機推薦商品

  const quantityInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("description"); // 商品描述區塊切換tab

  // 你可能會喜歡區塊，跳出modal選擇詳細資訊加入購物車的 modal
  // const [show, setShow] = useState(false);
  // // const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // // const [bookingDate, setBookingDate] = useState("");
  // const [rentDateRange, setRentDateRange] = useState([]); // 租借日期
  // const [modalVisible, setModalVisible] = useState(false);
  // const [selectedProduct, setSelectedProduct] = useState(null);
  // const [bookingDate, setBookingDate] = useState("");
  // const [rentDateRange, setRentDateRange] = useState([]); // 租借日期
  // const [showModal, setShowModal] = useState(false);

  // 從後端獲取商品數據
  useEffect(() => {
    if (!id) return; // 如果 id 不存在，直接返回

    const fetchProduct = async () => {
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

        const response = await fetch(`${API_BASE_URL}/api/rent/${id}`);
        if (!response.ok) {
          throw new Error("無法獲取租借商品數據！");
        }
        const result = await response.json(); // 解析後端返回的 JSON
        const data = result.data; // 提取 data 物件

        console.log("後端返回的資料:", data); // 檢查資料結構
        setProduct(data);

        // 設置預設大圖
        const images = data.images || [];
        const mainImage =
          (images && images.find((img) => img.is_main === 1)?.img_url) ||
          (images && images[0]?.img_url) ||
          "/image/rent/no-img.png"; // 如果沒有圖片，顯示"本商品暫時沒有圖片"的預設圖片
        setMainImage(mainImage);

        console.log("Product images:", images); // 調試訊息

        // 獲取推薦商品
        const fetchRecommendedProducts = async (brand, categoryId, id) => {
          console.log("呼叫 fetchRecommendedProducts，參數:", {
            brand,
            categoryId,
            id,
          });

          try {
            console.log("收到的 id:", id, "類型:", typeof id);
            const API_BASE_URL =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

            const parsedId = Number(id);
            if (!Number.isInteger(parsedId) || parsedId <= 0) {
              console.error("無效的商品 ID:", id);
              return;
            }

            // 確保 categoryId 存在且為有效數字
            if (!Number.isInteger(categoryId) || categoryId <= 0) {
              console.error("無效的分類 ID:", categoryId);
              return;
            }
            console.log("data.rent_category_small_id:", categoryId);

            const response = await fetch(
              `${API_BASE_URL}/api/rent/${id}/recommended?brand=${encodeURIComponent(
                brand
              )}&category=${categoryId}`
            );

            if (!response.ok) {
              throw new Error("無法獲取推薦商品");
            }
            const result = await response.json();

            // console.log("📌 API 返回的完整資料:", result);

            setRecommendedProducts(result.data || []);
          } catch (err) {
            console.error("獲取推薦商品失敗:", err);
          }
        };

        // 獲取"你可能喜歡"區塊的推薦商品
        fetchRecommendedProducts(
          data.brand_name,
          data.rent_category_small_id,
          data.id
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleColorClick = (color) => {
    if (selectedColor === color) {
      setSelectedColor(null); // 如果已經選中，則取消選擇
    } else {
      setSelectedColor(color); // 如果未選中，則更新選中的顏色
    }
  };

  // 判斷收藏的愛心狀態
  const handleClick = () => {
    const newIsFavorite = isFavorite === 0 ? 1 : 0;
    setIsFavorite(newIsFavorite);

    // 這裡可以加入後端 API 呼叫，更新 is_like 狀態
    // axios.post(`/api/rent-item/${id}/update-favorite`, { isLike: newIsFavorite })
    //   .then(response => {
    //     console.log("後端更新成功:", response.data);
    //   })
    //   .catch(error => {
    //     console.error("後端更新失敗:", error);
    //   });
  };

  // 根據是否有特價動態調整價格樣式
  useEffect(() => {
    const price = document.querySelector(".product-price");
    const price2 = document.querySelector(".product-price2");

    // 如果產品沒有特價，隱藏特價欄位並恢復原價樣式
    if (!product?.price2) {
      if (price2) {
        price2.classList.add("hidden");
        // price2.style.margin = "0";
      } // 隱藏特價欄位
      if (price) {
        price.classList.remove("strikethrough"); // 移除劃線樣式
      }
    } else {
      // 如果產品有特價，改變原價樣式
      if (price) {
        price.classList.add("strikethrough"); // 添加劃線樣式
        price.style.fontSize = "16px";
        price.style.fontWeight = "400";
      }
    }
  }, [product]); // 當 product 更新時執行
  // 根據是否有特價動態調整價格樣式
  useEffect(() => {
    const price = document.querySelector(".product-price");
    const price2 = document.querySelector(".product-price2");

    // 如果產品沒有特價，隱藏特價欄位並恢復原價樣式（你可能會喜歡)
    if (!product?.price2) {
      if (price2) {
        price2.classList.add("hidden");
        // price2.style.margin = "0";
      } // 隱藏特價欄位
      if (price) {
        price.classList.remove("strikethrough"); // 移除劃線樣式
      }
    } else {
      // 如果產品有特價，改變原價樣式
      if (price) {
        price.classList.add("strikethrough"); // 添加劃線樣式
        price.style.fontSize = "16px";
        price.style.fontWeight = "400";
      }
    }
  }, [product]); // 當 product 更新時執行

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      document.querySelector("#fixed-calendar")
    ) {
      // 定義一個函式來計算並更新價格
      const updatePriceDetails = (selectedDates, instance) => {
        const dateRangeText = document.querySelector("#date-range-text");
        const totalCostText = document.querySelector("#total-cost-text");
        const priceDetailsText = document.querySelector("#price-details-text");
        const startDate = selectedDates[0];
        const endDate = selectedDates[1];

        if (startDate && endDate) {
          // const formattedStartDate = instance.formatDate(
          //   startDate,
          //   "Y年m月d日"
          // );
          // const formattedEndDate = instance.formatDate(endDate, "Y年m月d日");
          // 顯示用格式
          const displayStartDate = instance.formatDate(startDate, "Y年m月d日");
          const displayEndDate = instance.formatDate(endDate, "Y年m月d日");

          // 傳遞給後端的格式
          const formattedStartDate = startDate.toLocaleDateString("en-CA"); // 輸出 YYYY-MM-DD
          const formattedEndDate = endDate.toLocaleDateString("en-CA"); // 輸出 YYYY-MM-DD

          // 計算租賃天數
          const timeDiff = endDate.getTime() - startDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1是因為要包含起始日

          // 動態單價（如果有 price2 則使用 price2，否則使用 price）
          const price = product.price; // 原價
          const price2 = product.price2; // 特價
          const unitPrice = Number(price2 ? price2 : price);

          const quantity = parseInt(quantityInputRef.current?.value, 10) || 1;

          // 計算押金（單價的 3 折）
          const deposit = Number(unitPrice * 0.3);

          // 計算總費用
          const totalCost = unitPrice * quantity * daysDiff + deposit;

          // 更新日期範圍文字的顯示
          dateRangeText.textContent = `租賃日期： 自 ${displayStartDate} 至 ${displayEndDate}`;

          // 更新價格明細
          priceDetailsText.innerHTML = `
            <div>單價：${unitPrice.toLocaleString("zh-TW")} 元</div>
            <div>數量：${quantity} 個</div>
            <div>天數：${daysDiff} 天</div>
            <div>押金：${deposit.toLocaleString("zh-TW")} 元</div>
          `;

          // 更新總費用文字
          totalCostText.textContent = `總費用：${totalCost.toLocaleString()} 元`;

          // 顯示區塊
          dateRangeText.style.display = "block";
          totalCostText.style.display = "block";
          priceDetailsText.style.display = "block";

          // 將選擇的日期存入狀態
          setStartDate(startDate);
          setEndDate(endDate);
        } else {
          // 如果沒有選擇完整的日期範圍，隱藏區塊
          dateRangeText.style.display = "none";
          totalCostText.style.display = "none";
          priceDetailsText.style.display = "none";

          // 清空日期狀態
          setStartDate(null);
          setEndDate(null);
        }
      };

      // 初始化 Flatpickr
      const calendar = flatpickr("#fixed-calendar", {
        mode: "range",
        dateFormat: "Y年m月d日",
        minDate: "today",
        inline: true,
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
            longhand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
          },
          months: {
            shorthand: [
              "1月",
              "2月",
              "3月",
              "4月",
              "5月",
              "6月",
              "7月",
              "8月",
              "9月",
              "10月",
              "11月",
              "12月",
            ],
            longhand: [
              "一月",
              "二月",
              "三月",
              "四月",
              "五月",
              "六月",
              "七月",
              "八月",
              "九月",
              "十月",
              "十一月",
              "十二月",
            ],
          },
        },
        disableMobile: true,
        onChange: function (selectedDates, dateStr, instance) {
          // 當日期變化時，更新價格明細
          updatePriceDetails(selectedDates, instance);
        },
      });

      // 監聽數量輸入框的變化
      if (quantityInputRef.current) {
        quantityInputRef.current.addEventListener("input", () => {
          const selectedDates = calendar.selectedDates;
          if (selectedDates.length === 2) {
            // 如果有選擇完整的日期範圍，更新價格明細
            updatePriceDetails(selectedDates, calendar);
          }
        });
      }

      if (product?.images?.length) {
        setMainImage(product.images[0]?.img_url || ""); // 當 product 變更時，重新設置大圖
      }
    }
  }, [product]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  // 處理小圖上一頁按鈕點擊
  const handlePrevClick = () => {
    setCurrentImageIndex((prevIndex) => Math.max(prevIndex - 3, 0));
  };
  // 處理小圖下一頁按鈕點擊
  const handleNextClick = () => {
    setCurrentImageIndex((prevIndex) =>
      Math.min(prevIndex + 3, product.images.length - 3)
    );
  };

  // 點擊圖標時顯示 Modal
  // const handleIconClick = (product, e) => {
  //   e.stopPropagation(); // 防止事件冒泡（才不會點到跳轉 rent detail）
  //   e.preventDefault(); //

  //   // 重設選擇的商品及相關狀態
  //   setSelectedProduct({
  //     ...product,
  //     quantity: 1, // 重置數量
  //   });

  //   setQuantity(1); // 確保數量輸入框重置
  //   setBookingDate(""); // 重置預訂日期
  //   setRentDateRange([]); // 重置日期區間

  //   // 清空日期選擇器的值
  //   const dateRangeInput = document.getElementById("rentDateRange");
  //   if (dateRangeInput && dateRangeInput._flatpickr) {
  //     dateRangeInput._flatpickr.clear();
  //   }

  // 觸發 Bootstrap Modal
  // const myModal = new bootstrap.Modal(
  //   document.getElementById("rentDetailModal")
  // );
  // myModal.show();

  // 在 modal 顯示後初始化 flatpickr
  //   const modalElement = document.getElementById("rentDetailModal");

  //   const handleModalShown = () => {
  //     const dateRangeInput = document.getElementById("rentDateRange");

  //     if (dateRangeInput && !dateRangeInput._flatpickr) {
  //       dateRangeInput.classList.add("rentlist-flatpickr");

  //       const flatpickrInstance = flatpickr(dateRangeInput, {
  //         mode: "range", // 設置為日期區間選擇模式
  //         dateFormat: "Y年m月d日", // 設置日期格式
  //         minDate: "today", // 設置最小日期為今天
  //         locale: {
  //           rangeSeparator: " ~ ", // 設置日期區間的分隔符
  //           firstDayOfWeek: 1,
  //           weekdays: {
  //             shorthand: [
  //               "週日",
  //               "週一",
  //               "週二",
  //               "週三",
  //               "週四",
  //               "週五",
  //               "週六",
  //             ],
  //             longhand: [
  //               "週日",
  //               "週一",
  //               "週二",
  //               "週三",
  //               "週四",
  //               "週五",
  //               "週六",
  //             ],
  //           },
  //           months: {
  //             shorthand: [
  //               "1月",
  //               "2月",
  //               "3月",
  //               "4月",
  //               "5月",
  //               "6月",
  //               "7月",
  //               "8月",
  //               "9月",
  //               "10月",
  //               "11月",
  //               "12月",
  //             ],
  //             longhand: [
  //               "一月",
  //               "二月",
  //               "三月",
  //               "四月",
  //               "五月",
  //               "六月",
  //               "七月",
  //               "八月",
  //               "九月",
  //               "十月",
  //               "十一月",
  //               "十二月",
  //             ],
  //           },
  //         },
  //         disableMobile: true,
  //         onClose: (selectedDates) => {
  //           if (selectedDates.length === 2) {
  //             const [startDate, endDate] = selectedDates.map(
  //               (date) => date.toISOString().split("T")[0]
  //             ); // 轉換為 YYYY-MM-DD 格式

  //             setRentDateRange([startDate, endDate]);
  //             console.log("選擇的日期區間:", startDate, endDate);
  //           }
  //         },
  //         onOpen: () => {
  //           // 在日曆打開時，將 rentlist-flatpickr 類名添加到日曆容器
  //           const calendarContainer = document.querySelector(
  //             ".flatpickr-calendar"
  //           );
  //           if (calendarContainer) {
  //             calendarContainer.classList.add("rentlist-flatpickr");
  //           }
  //           // 清空日期選擇器的值
  //           dateRangeInput.value = "";
  //         },
  //       });
  //     }
  //   };

  //   // 綁定事件監聽器
  //   modalElement.addEventListener("shown.bs.modal", handleModalShown);

  //   // 清理事件監聽器
  //   return () => {
  //     modalElement.removeEventListener("shown.bs.modal", handleModalShown);
  //   };
  // };
  // 在模態框顯示後初始化 flatpickr
  // useEffect(() => {
  //   const modalElement = document.getElementById("rentDetailModal");

  //   if (!modalElement) {
  //     console.error("模態框元素未找到！");
  //     return; // 如果元素不存在，直接返回
  //   }

  //   const handleModalShown = () => {
  //     const dateRangeInput = document.getElementById("rentDateRange");

  //     if (dateRangeInput && !dateRangeInput._flatpickr) {
  //       dateRangeInput.classList.add("rentlist-flatpickr");

  //       const flatpickrInstance = flatpickr(dateRangeInput, {
  //         className: "calendar-recommended",
  //         mode: "range", // 設置為日期區間選擇模式
  //         dateFormat: "Y年m月d日", // 設置日期格式
  //         minDate: "today", // 設置最小日期為今天
  //         locale: {
  //           rangeSeparator: " ~ ", // 設置日期區間的分隔符
  //           firstDayOfWeek: 1,
  //           weekdays: {
  //             shorthand: [
  //               "週日",
  //               "週一",
  //               "週二",
  //               "週三",
  //               "週四",
  //               "週五",
  //               "週六",
  //             ],
  //             longhand: [
  //               "週日",
  //               "週一",
  //               "週二",
  //               "週三",
  //               "週四",
  //               "週五",
  //               "週六",
  //             ],
  //           },
  //           months: {
  //             shorthand: [
  //               "1月",
  //               "2月",
  //               "3月",
  //               "4月",
  //               "5月",
  //               "6月",
  //               "7月",
  //               "8月",
  //               "9月",
  //               "10月",
  //               "11月",
  //               "12月",
  //             ],
  //             longhand: [
  //               "一月",
  //               "二月",
  //               "三月",
  //               "四月",
  //               "五月",
  //               "六月",
  //               "七月",
  //               "八月",
  //               "九月",
  //               "十月",
  //               "十一月",
  //               "十二月",
  //             ],
  //           },
  //         },
  //         disableMobile: true,
  //         onClose: (selectedDates) => {
  //           if (selectedDates.length === 2) {
  //             const [startDate, endDate] = selectedDates.map(
  //               (date) => date.toISOString().split("T")[0]
  //             ); // 轉換為 YYYY-MM-DD 格式

  //             setRentDateRange([startDate, endDate]);
  //             console.log("選擇的日期區間:", startDate, endDate);
  //           }
  //         },
  //         onOpen: () => {
  //           // 在日曆打開時，將 rentlist-flatpickr 類名添加到日曆容器
  //           const calendarContainer = document.querySelector(
  //             ".flatpickr-calendar"
  //           );
  //           if (calendarContainer) {
  //             calendarContainer.classList.add("rentlist-flatpickr");
  //           }
  //           // 清空日期選擇器的值
  //           dateRangeInput.value = "";
  //         },
  //       });
  //     }
  //   };

  //   // 綁定事件監聽器
  //   modalElement.addEventListener("shown.bs.modal", handleModalShown);

  //   // 清理事件監聽器
  //   return () => {
  //     modalElement.removeEventListener("shown.bs.modal", handleModalShown);
  //   };
  // }, []);

  // 加入購物車
  const handleAddToCart = async () => {
    if (!product) {
      alert("租借訂單資料未加載完成，請稍後再試！");
      return;
    }

    // 檢查是否選擇了日期
    if (!startDate || !endDate) {
      alert("請選擇租借日期！");
      return;
    }

    // 確保 startDate 和 endDate 是 Date 物件
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      alert("日期格式錯誤，請重新選擇！");
      return;
    }
    // 傳遞給後端的格式
    const formattedStartDate = startDate.toLocaleDateString("en-CA"); // 輸出 YYYY-MM-DD
    const formattedEndDate = endDate.toLocaleDateString("en-CA"); // 輸出 YYYY-MM-DD

    // 檢查商品是否有顏色規格
    const hasColorSpecifications =
      product.specifications &&
      product.specifications.some((spec) => spec.color_rgb);

    // 如果有顏色規格但未選擇顏色，則提示用戶選擇顏色
    if (hasColorSpecifications && !selectedColor) {
      alert("請選擇商品顏色！");
      return;
    }

    const cartData = {
      userId: 1, // (寫死)
      type: "rental", // (寫死)
      rentalId: product.id, // 商品 ID
      rentalName: product.name, // 商品名稱
      quantity: quantity, // 租借數量
      color: selectedColor, // 選擇的顏色
      startDate: formattedStartDate, // 轉換為 YYYY-MM-DD 格式
      endDate: formattedEndDate, // 轉換為 YYYY-MM-DD 格式
      price: product.price, // 有特價選取特價的價格，沒有的話就是原價 product.price2 ? product.price2 : product.price
    };

    console.log("傳遞的資料:", cartData); // 檢查資料格式

    try {
      const response = await axios.post(`${API_BASE_URL}/cart/add`, cartData);

      if (response.data.success) {
        // fetchCart(1); // 讓購物車重新從後端獲取最新數據
        alert("成功加入購物車！");
      } else {
        alert(response.data.message || "加入購物車失敗");
      }
    } catch (error) {
      console.error("加入購物車失敗:", error);
      if (error.response) {
        console.error("後端錯誤訊息:", error.response.data);
      }
      alert("加入購物車失敗，請稍後再試");
    }
  };

  if (loading) return <div>商品載入中...</div>;
  if (error) return <div>錯誤：{error}</div>;
  if (!product) return <div>未找到商品</div>;

  // 這個用來做最多三張小圖
  const visibleImages = product.images.slice(
    currentImageIndex,
    currentImageIndex + 3
  );
  // 判斷是否顯示小圖的上一頁和下一頁按鈕
  const showPrevButton = currentImageIndex > 0;
  const showNextButton = currentImageIndex + 3 < product.images.length;

  // 確認租借資訊
  // const handleConfirmRent = () => {
  //   const rentDate = document.getElementById('rentDate').value;
  //   const rentQuantity = document.getElementById('rentQuantity').value;

  //   if (!rentDate || !rentQuantity) {
  //     alert('請填寫完整的租借資訊');
  //     return;
  //   }

  //   // 將商品 ID、租借日期和數量發送到後端
  //   addToCart(selectedProductId, rentDate, rentQuantity);

  //   // 關閉 Modal
  //   closeModal();
  // };

  // 加入購物車的函數
  // const addToCart = async (productId, rentDate, rentQuantity) => {
  //   try {
  //     const response = await fetch('/add-to-cart', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         productId,
  //         rentDate,
  //         rentQuantity,
  //       }),
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       alert('商品已成功加入購物車');
  //     } else {
  //       alert('加入購物車失敗');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     alert('發生錯誤，請稍後再試');
  //   }
  // };

  return (
    <div className="container py-4 mx-auto">
      <Head>
        <title>租借商品詳情</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </Head>

      {/* 商品詳細資訊 */}
      <div className="row">
        <div className="main-details d-flex flex-row justify-content-between align-items-start">
          <div className="row">
            {/* 圖片區域 */}
            <div className="px-3 col-12 col-md-6 col-lg-6 order-1 mx-auto d-flex flex-column gap-5">
              <div className="main-image">
                <Image
                  src={mainImage} // 動態設置大圖的 src
                  className="img-fluid"
                  alt="商品主圖"
                  width={360}
                  height={360}
                  layout="responsive"
                  priority
                  unoptimized
                />
              </div>
              <div
                className="small-images d-flex flex-row justify-content-between align-items-center"
                ref={containerRef}
              >
                {product.images?.length > 0 ? (
                  <>
                    {/* 上一頁按鈕 */}
                    {showPrevButton && (
                      <button className="btn-prev" onClick={handlePrevClick}>
                        <i className="bi bi-caret-left-fill"></i>
                      </button>
                    )}

                    {/* 小圖片顯示 */}
                    {visibleImages.map((img, index) => {
                      const containerWidth = 538; // 小圖總容器
                      const gap = 10;
                      const imageCount = visibleImages.length;
                      {
                        /* const imageWidth =
                        (containerWidth - (imageCount - 1) * gap) / imageCount; */
                      }
                      const imageWidth = (containerWidth - (3 - 1) * gap) / 3;
                      const imageHeight = imageWidth; // 正方形

                      return (
                        <div
                          key={index}
                          onClick={() => setMainImage(img.img_url)}
                          style={{ width: imageWidth, height: imageHeight }}
                        >
                          <Image
                            src={img.img_url}
                            className="img-fluid"
                            alt={`小圖${index + 1}`}
                            width={imageWidth}
                            height={imageHeight}
                            priority
                            unoptimized
                          />
                        </div>
                      );
                    })}
                    {/* 如果不足3張圖片則填充空白元素 */}
                    {Array.from({
                      length: 3 - visibleImages.length, // 最多顯示 3 張小圖
                    }).map((_, index) => {
                      const containerWidth = 538; // 小圖總容器
                      const gap = 10;
                      const imageCount = 3; // 最多顯示 3 張小圖
                      {
                        /* const imageWidth =
                        (containerWidth - (imageCount - 1) * gap) / imageCount; */
                      }
                      const imageWidth = (containerWidth - (3 - 1) * gap) / 3;
                      const imageHeight = imageWidth; // 正方形

                      return (
                        <div
                          key={`empty-${index}`}
                          className="empty-image"
                          style={{ width: imageWidth, height: imageHeight }}
                        ></div>
                      );
                    })}
                    {/* 下一頁按鈕 */}
                    {showNextButton && (
                      <button className="btn-next" onClick={handleNextClick}>
                        <i className="bi bi-caret-right-fill"></i>
                      </button>
                    )}
                  </>
                ) : (
                  <div>無圖片</div>
                )}
              </div>
              <div className="rent-rules d-flex flex-column">
                <p className="rules-title">租借規則</p>
                <ul className="rules-content">
                  <li>租借本人出示潛水證</li>
                  <li>租用需先付款，並提供個人證件一張</li>
                  <li>完成租借表單並完成簽名</li>
                  <li>如有遺失或損害，需修復原有狀況或是全新賠償</li>
                  <li>
                    租借與歸還時間限每日上午8:00至
                    下午5:00，過時則以多借一天計算
                  </li>
                  <li>
                    以天計價，非24小時制度。例如:
                    12/18日下午2點租借，12/19下午2點歸還，則算兩天
                  </li>
                </ul>
              </div>
            </div>

            {/* 文字區域 */}
            <div className="px-3 col-12 col-md-6 col-lg-6 order-2 mx-auto d-flex flex-column details-text">
              <div className="details-titles d-flex flex-column">
                <p className="product-brand">
                  {product?.brand_name ? product.brand_name : "未知品牌"}
                </p>
                <div className="product-name-fav d-flex flex-row justify-content-between align-items-center">
                  <p className="product-name">{product.name}</p>
                  <div className="product-name-fav" onClick={handleClick}>
                    <HeartIcon isFavorite={isFavorite} onClick={handleClick} />
                  </div>
                </div>
                <div className="stars d-flex flex-row">
                  {[...Array(5)].map((_, index) => (
                    <i
                      key={index}
                      className={`bi bi-star${
                        index < product.rating ? "-fill" : ""
                      }`}
                    ></i>
                  ))}
                </div>
              </div>
              <div className="subdetails-titles d-flex flex-column">
                {product.price2 && (
                  <p className="product-price2">NT${product.price2}/日</p>
                )}
                <p className="product-price">NT${product.price}/日</p>
                <p className="product-description">{product.description}</p>
              </div>
              <div className="details-select d-flex flex-column">
                <div className="product-color">
                  <p className="color-title">商品顏色</p>
                  <div className="colors d-flex flex-row">
                    {product.specifications &&
                    product.specifications.some((spec) => spec.color_rgb) ? (
                      <div className="product-colors">
                        {product.specifications.map(
                          (spec, index) =>
                            spec.color_rgb && (
                              <span
                                key={index}
                                className={`color-box ${
                                  selectedColor === spec.color_name
                                    ? "selected"
                                    : ""
                                }`}
                                style={{ backgroundColor: spec.color_rgb }}
                                onClick={() =>
                                  handleColorClick(spec.color_name)
                                } // 點擊時更新選中顏色
                              ></span>
                            )
                        )}
                      </div>
                    ) : (
                      <p className="no-colors">本商品暫無其他顏色</p>
                    )}
                  </div>
                </div>
                <div className="product-amount">
                  <p className="amount-title">商品數量</p>
                  <div className="amounts d-flex flex-row align-items-center">
                    {/* 減少數量按鈕 */}
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        if (quantity > 1) {
                          setQuantity((prev) => prev - 1);
                        }
                      }}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    {/* 數量輸入框 */}
                    <input
                      type="text"
                      className="form-control text-center mx-2"
                      style={{ width: "50px" }}
                      value={quantity}
                      readOnly
                    />
                    {/* 增加數量按鈕 */}
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        if (!product.stock || quantity < product.stock) {
                          setQuantity((prev) => prev + 1);
                        }
                      }}
                    >
                      <i className="bi bi-plus"></i>
                    </button>

                    {/* 庫存判斷 */}
                    {product.stock && product.stock > 0 ? (
                      <p className="product-stock">
                        庫存僅剩 {product.stock} 件
                      </p>
                    ) : (
                      <p className="stock-available">庫存餘量充足</p>
                    )}
                  </div>
                </div>
                <div className="booking-date">
                  <p className="booking-title">預訂日期</p>
                  <div className="booking-calendar calendar-detail d-flex flex-column align-items-center">
                    <div id="fixed-calendar" className=""></div>
                    <div className="d-flex flex-column selected-date-range w-100">
                      <p id="date-range-text" style={{ display: "none" }}></p>
                      <div
                        id="price-details-text"
                        style={{ display: "none" }}
                      ></div>
                      <div
                        id="total-cost-text"
                        style={{ display: "none" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-row justify-content-between align-items-center product-btns">
                <button
                  type="button"
                  className="mybtn btn-cart flex-grow-1"
                  onClick={handleAddToCart}
                >
                  加入購物車
                </button>
                <button type="button" className="mybtn btn-buy flex-grow-1">
                  直接購買
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 商品描述及品牌介紹 */}
      <div className="col-12 d-flex flex-column mt-4 under-details">
        {/* 分頁按鈕 */}
        <div className="d-flex flex-row justify-content-center align-items-center tab-buttons">
          <button
            className={`tab-button ${
              activeTab === "description" ? "active" : ""
            }`}
            onClick={() => setActiveTab("description")}
          >
            <p className="under-details-title">商品描述</p>
          </button>
          <button
            className={`tab-button ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            <p className="under-details-title">會員評價</p>
          </button>
        </div>
        {/* 分頁內容 */}
        <div className="tab-content">
          {activeTab === "description" && (
            <div className="under-detail">
              <div className="d-flex flex-column under-details-content">
                <p>{product.description2 || product.description}</p>
              </div>
              <div className="d-flex flex-column under-brand">
                <p className="product-brand">品牌介紹</p>
                <div className="d-flex flex-column under-details-brand">
                  來自義大利的複合材料製造商C4創立於1986年，初始研發的是自行車使用之碳纖維材料，隨後將這樣的材料技術延伸至自由潛水/水中漁獵的裝備；卓越的性能與粗獷的外型，受到許多專業玩家的喜愛。
                </div>
              </div>
            </div>
          )}
          {activeTab === "comments" && (
            <div className="under-comments">
              <div className="d-flex flex-column under-comments-content">
                {/* 這裡放會員評價的內容 */}
                <p>切版用：暫無評價。</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 你可能會喜歡 */}
      <div className="col-12 d-flex flex-column mt-4 you-may-likes">
        <div className="you-may-like">
          <h3 className="you-may-like-title">你可能會喜歡</h3>
        </div>
        <div className="row you-may-like-products">
          {recommendedProducts.map((product) => (
            <div
              key={product.id}
              className="col-12 col-sm-6 col-md-4 col-lg-3 you-may-like-product mb-4"
            >
              <Link
                href={`/rent/${product.id}`}
                passHref
                style={{
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "none",
                }}
              >
                <div className="card border-0 h-100">
                  <div className="d-flex justify-content-center align-items-center img-container">
                    <Image
                      src={product.img_url || "/image/rent/no-img.png"}
                      className="product-img"
                      alt={product.name}
                      layout="intrinsic"
                      width={248}
                      height={248}
                      objectFit="contain"
                      priority
                      unoptimized
                    />
                  </div>
                  <div className="d-flex flex-column justify-content-start align-items-center card-body">
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-name text-center">{product.name}</p>

                    <div
                      className={`price-container d-flex gap-3 ${
                        product.price2 ? "has-discount" : ""
                      }`}
                    >
                      <h6 className="product-price">NT$ {product.price} 元</h6>
                      {product.price2 && (
                        <h6 className="product-price2">
                          NT$ {product.price2} 元
                        </h6>
                      )}
                    </div>
                    <div className="d-flex flex-row justify-content-center align-items-center product-color">
                      {product.color_rgb && product.color_rgb !== "無顏色" ? (
                        // 先將顏色陣列分割出來
                        product.color_rgb
                          .split(",")
                          .slice(0, 3)
                          .map((color, index) => (
                            <span
                              key={index}
                              className="color-box"
                              style={{ backgroundColor: color.trim() }}
                            ></span>
                          ))
                      ) : (
                        <span
                          className="color-box"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                          }}
                        ></span>
                      )}

                      {/* 若顏色數量超過3，顯示 '...' */}
                      {product.color_rgb &&
                        product.color_rgb !== "無顏色" &&
                        product.color_rgb.split(",").length > 3 && (
                          <span
                            className="color-box"
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              textAlign: "center",
                              lineHeight: "7.5px",
                            }}
                          >
                            ...
                          </span>
                        )}
                    </div>

                    {/* hover出現收藏 & 加入購物車 */}
                    <div className="icon-container d-flex flex-row">
                      <div className="icon d-flex justify-content-center align-items-center">
                        <i className="bi bi-heart"></i>
                      </div>
                      {/* <div
                        className="icon d-flex justify-content-center align-items-center"
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡
                          handleIconClick(product, e);
                        }}
                      >
                        <i className="bi bi-cart"></i>
                      </div> */}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
