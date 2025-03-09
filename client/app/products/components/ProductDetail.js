"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import axios from "axios";
import "./ProductDetail.css";
import ProductReviews from "./ProductReviews";
import BrowsingHistory from "./BrowsingHistory";
import RecommendedProducts from "./RecommendedProducts";
import SocialToolbar from "./SocialToolbar";
import useFavorite from "@/hooks/useFavorite";
import { useCart } from "@/hooks/cartContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import useToast from "@/hooks/useToast";
import useLocalStorage from "@/hooks/use-localstorage";
//使用swiper
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

// 評價
import RatingSummary from "@/components/RatingSummary";
import ReviewsSection from "@/components/ReviewsSection";
// API 基礎 URL
const API_BASE_URL = "http://localhost:3005/api";
export default function ProductDetail() {
  const { showToast } = useToast();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const { addToCart } = useCart();
  const {
    isFavorite,
    toggleFavorite,
    loading: favoriteLoading,
  } = useFavorite(parseInt(params.id), "product");
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentOriginalPrice, setCurrentOriginalPrice] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const mainSwiperRef = useRef(null);
  const [historyItems, setHistoryItems] = useLocalStorage(
    "browsingHistory",
    []
  );

  // 複製連結
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast("連結已複製到剪貼簿", {
      style: { backgroundColor: "green" },
    });
  };

  //瀏覽紀錄
  useEffect(() => {
    if (!product) return;

    // 使用函數式更新，避免依賴於 historyItems
    setHistoryItems((prevHistory) => {
      // 檢查商品是否已經在歷史記錄中
      const isProductInHistory = prevHistory.some(
        (item) => item.id === product.id
      );

      // 如果已經在歷史記錄中且位置是第一個，則不需要更新
      if (isProductInHistory && prevHistory[0]?.id === product.id) {
        return prevHistory;
      }

      // 創建新的歷史記錄項目
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.variants[0].price,
        image: product.images[0]
          ? `/image/product/${product.images[0]}`
          : "/image/product/no-img.png",
      };

      // 創建新的歷史記錄，移除舊的相同商品（如果有）
      const filteredHistory = prevHistory.filter(
        (item) => item.id !== product.id
      );

      // 將新項目添加到歷史記錄的開頭，並限制為10項
      return [newItem, ...filteredHistory].slice(0, 10);
    });
  }, [product, setHistoryItems]); // 只依賴 product 和 setHistoryItems

  // 當顏色或尺寸改變時，更新庫存
  useEffect(() => {
    const variant = getCurrentVariant();
    if (variant) {
      setCurrentStock(variant.stock);
    }
  }, [selectedColor, selectedSize]);

  // 範例：改寫 getCurrentVariant
  const getCurrentVariant = () => {
    if (!product) return null;

    // 如果既沒有顏色也沒有尺寸，就直接回傳唯一或第一個變體
    if (
      (!product.colors || product.colors.length === 0) &&
      (!product.sizes || product.sizes.length === 0) &&
      product.variants &&
      product.variants.length > 0
    ) {
      return product.variants[0];
    }

    // 如果只有顏色，沒有尺寸
    if (
      product.colors &&
      product.colors.length > 0 &&
      product.sizes.length === 0
    ) {
      // user 必須選了顏色之後才找得到
      if (!selectedColor) return null;

      // 只靠 color_id 來找
      return product.variants.find((v) => v.color_id === selectedColor.id);
    }

    // 如果只有尺寸，沒有顏色
    if (
      product.sizes &&
      product.sizes.length > 0 &&
      product.colors.length === 0
    ) {
      if (!selectedSize) return null;

      return product.variants.find((v) => v.size_id === selectedSize.id);
    }

    // 如果既有顏色又有尺寸
    if (
      product.colors &&
      product.colors.length > 0 &&
      product.sizes &&
      product.sizes.length > 0
    ) {
      if (!selectedColor || !selectedSize) return null;

      return product.variants.find(
        (v) => v.color_id === selectedColor.id && v.size_id === selectedSize.id
      );
    }

    return null;
  };

  // 處理數量變更
  const handleQuantityChange = (value) => {
    setQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + value;
      const variant = getCurrentVariant();

      if (newQuantity >= 1 && variant) {
        if (newQuantity <= variant.stock) {
          return newQuantity;
        } else {
          alert("超過庫存數量！");
          return prevQuantity;
        }
      }
      return prevQuantity;
    });
  };

  // 修改加入購物車函數
  const handleAddToCart = async () => {
    // 檢查是否有顏色和尺寸選項
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    // 根據實際情況檢查是否選擇了必要的選項
    if ((hasColors && !selectedColor) || (hasSizes && !selectedSize)) {
      alert(
        hasColors && hasSizes
          ? "請選擇商品尺寸和顏色"
          : hasColors
          ? "請選擇商品顏色"
          : "請選擇商品尺寸"
      );
      return;
    }

    const currentVariant = getCurrentVariant();
    if (!currentVariant) {
      alert("找不到對應的商品規格");
      return;
    }

    try {
      // 使用購物車上下文的 addToCart 函數
      const cartData = {
        type: "product",
        variantId: currentVariant.id,
        quantity: quantity,
      };

      const success = await addToCart(cartData);

      if (!success) {
        alert("加入購物車失敗，請稍後再試");
      }
    } catch (error) {
      console.error("加入購物車失敗:", error);
      alert("加入購物車失敗，請稍後再試");
    }
  };

  // 修改 handleSizeSelect 函數以處理沒有顏色的情況
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setQuantity(1);

    let variant;
    if (selectedColor) {
      variant = product.variants.find(
        (v) => v.color_id === selectedColor.id && v.size_id === size.id
      );
    } else {
      variant = product.variants.find((v) => v.size_id === size.id);
    }

    if (variant) {
      setCurrentPrice(variant.price);
      setCurrentOriginalPrice(variant.original_price);
      setCurrentStock(variant.stock);

      // 如果變體有圖片，切換到對應圖片
      if (variant.images && variant.images.length > 0) {
        const imageIndex = allImages.findIndex(
          (img) => img === variant.images[0]
        );
        if (imageIndex !== -1 && mainSwiperRef.current) {
          mainSwiperRef.current.slideTo(imageIndex);
          if (thumbsSwiper) {
            thumbsSwiper.slideTo(imageIndex);
          }
        }
      }
    }
  };
  // 修改顏色選擇的處理
  // const handleColorSelect = (color) => {
  //   setSelectedColor(color);
  //   setQuantity(1);

  //   if (selectedSize) {
  //     const variant = product.variants.find(
  //       (v) => v.color_id === color.id && v.size_id === selectedSize.id
  //     );
  //     if (variant) {
  //       setCurrentPrice(variant.price);
  //       setCurrentOriginalPrice(variant.original_price);
  //       setCurrentStock(variant.stock);

  //       // 如果變體有圖片，切換到對應圖片
  //       if (variant.images?.[0]) {
  //         const imageIndex = allImages.findIndex(
  //           (img) => img === variant.images[0]
  //         );
  //         if (imageIndex !== -1 && mainSwiperRef.current) {
  //           mainSwiperRef.current.slideTo(imageIndex);
  //           if (thumbsSwiper) {
  //             thumbsSwiper.slideTo(imageIndex);
  //           }
  //         }
  //       }
  //     }
  //   }
  // };
  // 修改 handleColorSelect 函數以處理沒有尺寸的情況
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setQuantity(1);

    let variant;
    if (selectedSize) {
      variant = product.variants.find(
        (v) => v.color_id === color.id && v.size_id === selectedSize.id
      );
    } else {
      variant = product.variants.find((v) => v.color_id === color.id);
    }

    if (variant) {
      setCurrentPrice(variant.price);
      setCurrentOriginalPrice(variant.original_price);
      setCurrentStock(variant.stock);

      // 如果變體有圖片，切換到對應圖片
      if (variant.images && variant.images.length > 0) {
        const imageIndex = allImages.findIndex(
          (img) => img === variant.images[0]
        );
        if (imageIndex !== -1 && mainSwiperRef.current) {
          mainSwiperRef.current.slideTo(imageIndex);
          if (thumbsSwiper) {
            thumbsSwiper.slideTo(imageIndex);
          }
        }
      }
    }
  };
  // useEffect(() => {
  //   const fetchProduct = async () => {
  //     try {
  //       const productId = Number(params.id);
  //       if (!productId) {
  //         setError("無效的商品 ID");
  //         return;
  //       }

  //       const response = await axios.get(
  //         `${API_BASE_URL}/products/${productId}`
  //       );

  //       if (response.data.status === "success" && response.data.data) {
  //         const productData = response.data.data;
  //         console.log("現在測試", productData);

  //         // 收集所有變體的圖片
  //         const variantImages = productData.variants.flatMap(
  //           (variant) => variant.images || []
  //         );
  //         // 合併主圖片和變體圖片
  //         const images = [...productData.images, ...variantImages];

  //         setAllImages(images);
  //         console.log("images", images);
  //         setProduct(productData);

  //         // 但是也會有商品沒有尺寸和顏色的時候啊
  //         // 設置初始選中的尺寸和顏色
  //         if (productData.sizes?.length > 0 && productData.colors?.length > 0) {
  //           const initialSize = productData.sizes[0];
  //           const initialColor = productData.colors[0];

  //           setSelectedSize(initialSize);
  //           setSelectedColor(initialColor);

  //           // 找到對應的變體
  //           const initialVariant = productData.variants.find(
  //             (v) =>
  //               v.color_id === initialColor.id && v.size_id === initialSize.id
  //           );

  //           if (initialVariant) {
  //             setCurrentPrice(initialVariant.price);
  //             setCurrentOriginalPrice(initialVariant.original_price);
  //             setCurrentStock(initialVariant.stock);

  //             // 如果初始變體有圖片，設置初始圖片位置
  //             if (initialVariant.images?.[0]) {
  //               const imageIndex = images.findIndex(
  //                 (img) => img === initialVariant.images[0]
  //               );
  //               // 等待 Swiper 初始化完成後再設置位置
  //               setTimeout(() => {
  //                 if (imageIndex !== -1 && mainSwiperRef.current) {
  //                   mainSwiperRef.current.slideTo(imageIndex);
  //                   if (thumbsSwiper) {
  //                     thumbsSwiper.slideTo(imageIndex);
  //                   }
  //                 }
  //               }, 100);
  //             }
  //           }
  //         }
  //       } else {
  //         setError("找不到商品");
  //       }
  //     } catch (err) {
  //       console.error("獲取商品詳情失敗:", err);
  //       setError(err.response?.data?.message || "商品獲取失敗");
  //     }
  //   };

  //   if (params.id) {
  //     fetchProduct();
  //   }
  // }, [params.id]);
  // Modify the useEffect that fetches the product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = Number(params.id);
        if (!productId) {
          setError("無效的商品 ID");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/products/${productId}`
        );

        if (response.data.status === "success" && response.data.data) {
          const productData = response.data.data;
          console.log("現在測試", productData);

          // 收集所有變體的圖片
          const variantImages = productData.variants.flatMap(
            (variant) => variant.images || []
          );
          // 合併主圖片和變體圖片
          const images = [...(productData.images || []), ...variantImages];

          if (images.length === 0) {
            // 如果沒有圖片，增加一個預設圖片路徑
            images.push("no-img.png");
          }

          setAllImages(images);
          console.log("images", images);
          setProduct(productData);

          // 檢查是否有顏色和尺寸
          const hasColors = productData.colors && productData.colors.length > 0;
          const hasSizes = productData.sizes && productData.sizes.length > 0;

          // 設置初始選中的尺寸和顏色 (如果有的話)
          if (hasColors) {
            const initialColor = productData.colors[0];
            setSelectedColor(initialColor);
          }

          if (hasSizes) {
            const initialSize = productData.sizes[0];
            setSelectedSize(initialSize);
          }

          // 找到對應的變體
          let initialVariant;

          if (hasColors && hasSizes) {
            // 如果既有顏色又有尺寸
            initialVariant = productData.variants.find(
              (v) =>
                v.color_id === productData.colors[0].id &&
                v.size_id === productData.sizes[0].id
            );
          } else if (hasColors) {
            // 如果只有顏色
            initialVariant = productData.variants.find(
              (v) => v.color_id === productData.colors[0].id
            );
          } else if (hasSizes) {
            // 如果只有尺寸
            initialVariant = productData.variants.find(
              (v) => v.size_id === productData.sizes[0].id
            );
          } else {
            // 如果既沒有顏色也沒有尺寸，選擇第一個變體
            initialVariant = productData.variants[0];
          }

          if (initialVariant) {
            setCurrentPrice(initialVariant.price);
            setCurrentOriginalPrice(initialVariant.original_price);
            setCurrentStock(initialVariant.stock);

            // 如果初始變體有圖片，設置初始圖片位置
            if (initialVariant.images && initialVariant.images.length > 0) {
              const imageIndex = images.findIndex(
                (img) => img === initialVariant.images[0]
              );
              // 等待 Swiper 初始化完成後再設置位置
              setTimeout(() => {
                if (imageIndex !== -1 && mainSwiperRef.current) {
                  mainSwiperRef.current.slideTo(imageIndex);
                  if (thumbsSwiper) {
                    thumbsSwiper.slideTo(imageIndex);
                  }
                }
              }, 100);
            }
          }
        } else {
          setError("找不到商品");
        }
      } catch (err) {
        console.error("獲取商品詳情失敗:", err);
        setError(err.response?.data?.message || "商品獲取失敗");
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);
  return (
    <div className="container">
      {error && <div className="alert alert-danger">{error}</div>}
      {!product ? (
        <div className="text-center py-5">載入中...</div>
      ) : (
        <div className="productDetailContainer">
          <div className="row">
            {/* 左側產品圖片 */}
            <div className="col-md-6">
              <div className="product-img">
                <Swiper
                  spaceBetween={10}
                  navigation={true}
                  thumbs={{ swiper: thumbsSwiper }}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper2"
                  onSwiper={(swiper) => {
                    mainSwiperRef.current = swiper;
                  }}
                >
                  {allImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="product-img-wrapper">
                        <Image
                          src={
                            `/image/product/${image}` ||
                            "/image/product/no-img.png"
                          }
                          alt={`${product?.name}-${index + 1}`}
                          width={500}
                          height={500}
                          priority={index === 0}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className="mt-3">
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={10}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper"
                >
                  {allImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="thumb-wrapper">
                        <Image
                          src={
                            image
                              ? `/image/product/${image}`
                              : "/image/product/no-img.png"
                          }
                          alt={`${product?.name}-${index + 1}`}
                          width={100}
                          height={100}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* 右側產品訊息 */}
            <div className="col-md-6">
              <div className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="fw-bold text-secondary mb-0">
                    {product.brand_name}
                  </h3>
                  <div className="d-flex gap-2">
                    <button className="btn p-0" onClick={handleShare}>
                      <i className="fa-solid fa-share-from-square fs-4"></i>
                    </button>
                    <button
                      className="btn p-0"
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                    >
                      {isFavorite ? (
                        <AiFillHeart color="red" size={40} />
                      ) : (
                        <AiOutlineHeart size={40} />
                      )}
                    </button>
                  </div>
                </div>
                <h2>{product.name}</h2>
                <hr />
                <h2 className="salePrice">NT${currentPrice}</h2>
                <h5 className="text-secondary text-decoration-line-through">
                  NT${currentOriginalPrice}
                </h5>

                <div className="mb-2">
                  <RatingSummary type="product" id={product.id} />
                </div>

                <div>{product.description}</div>

                {/* 尺寸選擇 - 只在有尺寸時顯示 */}
                {product.sizes && product.sizes.length > 0 && (
                  <>
                    <div className="my-2">產品尺寸</div>
                    <div className="d-flex gap-2">
                      {product.sizes.map((size) => (
                        <div
                          key={size.id}
                          className={`sizeBox ${
                            selectedSize?.id === size.id ? "active" : ""
                          }`}
                          onClick={() => handleSizeSelect(size)}
                        >
                          {size.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 顏色選擇 - 只在有顏色時顯示 */}
                {product.colors && product.colors.length > 0 && (
                  <>
                    <div className="my-2">
                      產品顏色
                      {selectedColor && (
                        <span style={{ color: selectedColor.code }}>
                          {" ::: "}
                          {selectedColor.name}
                        </span>
                      )}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {product.colors.map((color) => (
                        <div
                          key={color.id}
                          className={`circle ${
                            selectedColor?.id === color.id ? "active" : ""
                          }`}
                          style={{
                            backgroundColor: color.code,
                            border: `2px solid ${
                              selectedColor?.id === color.id
                                ? "#007bff"
                                : "#dee2e6"
                            }`,
                          }}
                          onClick={() => handleColorSelect(color)}
                          title={color.name}
                        >
                          {selectedColor?.id === color.id && (
                            <div className="check-mark">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 數量選擇 */}
                <div className="my-2">
                  產品數量
                  {currentStock > 0 && (
                    <span className="text-muted ms-2">
                      (庫存: {currentStock})
                    </span>
                  )}
                </div>
                <div className="buttonCount">
                  <button
                    className="button-left"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <span>-</span>
                  </button>
                  <input
                    type="text"
                    className="input-field"
                    value={quantity}
                    readOnly
                  />
                  <button
                    className="button-right"
                    onClick={() => handleQuantityChange(1)}
                    disabled={!currentStock || quantity >= currentStock}
                  >
                    <span>+</span>
                  </button>
                </div>

                {/* 購買按鈕 - 更新按鈕禁用邏輯 */}
                <div className="d-flex mt-4">
                  <button
                    onClick={handleAddToCart}
                    className="btn btn-info addCartButton flex-grow-1"
                    disabled={
                      (product.colors?.length > 0 && !selectedColor) ||
                      (product.sizes?.length > 0 && !selectedSize)
                    }
                  >
                    加入購物車
                  </button>
                  <button className="btn btn-warning buyButton flex-grow-1">
                    直接購買
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 產品詳情和評價標籤 */}
          <div className="mt-5">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "description" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("description")}
                >
                  商品詳情
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "reviews" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  商品評價
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {activeTab === "description" ? (
                <div className="mt-3 descriptionField">
                  <div>
                    <h4>{product.name}</h4>
                    <p className="custom-border">
                      {product.detailed_description}
                    </p>
                  </div>
                </div>
              ) : (
                <ReviewsSection type="product" id={product.id} />
              )}
            </div>
          </div>

          {/* 瀏覽記錄 */}
          <BrowsingHistory />

          {/* 推薦商品 */}
          <RecommendedProducts />
          {/* 社交工具欄 */}
          <SocialToolbar />
        </div>
      )}
    </div>
  );
}
