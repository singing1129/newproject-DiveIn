"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useCart } from "@/hooks/cartContext";
import { useAuth } from "@/hooks/useAuth";
import useFavorite from "@/hooks/useFavorite";
import useToast from "@/hooks/useToast";
import SelectBundle from "../components/SelectBundle";
import Link from "next/link";
// import styles from "./bundle.module.css";

// components/BundleDetail.js
export default function BundleDetail({ bundle }) {
  // const params = useParams();
  // const bundleId = params?.id;
  console.log(bundle);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorite(bundle?.id, "bundle");
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // 修改後的加入購物車處理函數
  const handleAddToCart = async () => {
    if (!user || user === -1) {
      showToast("請先登入");
      return;
    }

    try {
      // 修改請求參數以符合API需求
      const cartData = {
        type: "bundle",
        bundleId: bundle.id,  // 使用bundleId而不是variantId
        quantity: 1,  // 套組數量預設為1
      };

      const success = await addToCart(cartData);
      if (success) {
        showToast("套組已加入購物車");
      } else {
        showToast("加入購物車失敗");
      }
    } catch (error) {
      console.error("加入購物車失敗:", error);
      showToast("加入購物車失敗");
    }
  };

  const handleOpenSelectModal = () => {
    setIsSelectModalOpen(true);
  };

  console.log("bundle.items", bundle.items);

  if (!bundle) return <div>載入中...</div>;

  return (
    <div className="container">
      <div className="productDetailContainer">
        <div className="row">
          {/* 左側主要商品圖片 */}
          <div className="col-md-6">
            <div className="product-img">
              <Image
                src={`/img/product/${bundle.main_image}`}
                alt={bundle.name || "套組商品圖片"}
                width={500}
                height={500}
                priority
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* 右側商品資訊 */}
          <div className="col-md-6">
            <div className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="fw-bold text-secondary mb-0">
                  {bundle.brand_name || "自由潛水套組"}
                </h3>
                <div className="d-flex gap-2">
                  <button className="btn p-0" >
                    <i className="fa-solid fa-share-from-square fs-4"></i>
                  </button>

                  <button className="btn p-0" onClick={toggleFavorite}>
                    {isFavorite ? (
                      <AiFillHeart color="red" size={40} />
                    ) : (
                      <AiOutlineHeart size={40} />
                    )}
                  </button>
                </div>
              </div>

              <h2>{bundle.name}</h2>
              <hr />

              {/* 價格顯示 */}
              <div className="price-section">
                <h2 className="salePrice">NT${bundle.discount_price}</h2>
                <h5 className="text-secondary text-decoration-line-through">
                  NT${bundle.original_total}
                </h5>
                <div className="savings-badge">
                  省下 NT${bundle.original_total - bundle.discount_price}
                </div>
              </div>

              <div className="bundle-description mt-3">
                <p>{bundle.description}</p>
              </div>

              {/* 套組商品列表 */}
              <div className="bundle-items mt-4">
                <h4>套組內容</h4>
                <div className="bundle-items-list">
                  {bundle.items?.map((item, index) => (
                    <div key={index} className="bundle-item-card">
                      <div className="d-flex align-items-center gap-3 p-3 border rounded mb-2">
                        <div
                          className="bundle-item-image"
                          style={{
                            width: "100px",
                            height: "100px",
                            position: "relative",
                          }}
                        >
                          <Image
                            src={`/img/product/${item.main_image}`}
                            alt={item.product_name || `套組商品 ${index + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="bundle-item-info flex-grow-1">
                          <h5>{item.product_name}</h5>
                          <p className="mb-1">數量 Ｘ {item.quantity}</p>
                          <div className="d-flex justify-content-between align-items-center"></div>
                        </div>
                        <Link href={`/products/${item.product_id}`}>
                          <button className="btn btn-primary">查看商品</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleOpenSelectModal}
                  >
                    選取組合商品
                  </button>
                </div>
              </div>

              {/* 購買按鈕 */}
              <div className="d-flex mt-4">
                <button
                  onClick={handleAddToCart}
                  className="btn btn-info addCartButton flex-grow-1"
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

        {/* 商品詳細說明 */}
        <div className="mt-5">
          <h4>套組說明</h4>
          <div className="bundle-details p-4 bg-light rounded">
            <h5>套組特色</h5>
            <ul className="list-unstyled">
              <li>✓ 精選專業裝備組合</li>
              <li>✓ 優惠套組價格</li>
              <li>✓ 適合初學者入門</li>
              <li>✓ 品質保證</li>
            </ul>
            <div className="mt-4">
              <h5>使用須知</h5>
              <p>{bundle.usage_notes || "此套組所有商品皆享有原廠保固"}</p>
            </div>
          </div>
        </div>
      </div>
      <SelectBundle
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        bundle={bundle}
        onSelect={(selectedItems) => {
          console.log("Selected items:", selectedItems);
          setIsSelectModalOpen(false);
        }}
      />
    </div>
  );
}