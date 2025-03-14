"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useAuth } from "@/hooks/useAuth";
import useFavorite from "@/hooks/useFavorite";
import useToast from "@/hooks/useToast";
import SelectBundle from "../components/SelectBundle";
import Link from "next/link";
import { useCart } from "@/hooks/cartContext";
import RatingSummary from "@/components/RatingSummary";
// import styles from "./bundle.module.css";

// components/BundleDetail.js
export default function BundleDetail({ bundle }) {
  // const params = useParams();
  // const bundleId = params?.id;

  console.log(bundle);
  console.log("bundle.items", bundle.items);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorite(bundle?.id, "bundle");
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleOpenSelectModal = () => {
    if (!user || user === -1) {
      showToast("請先登入");
      return;
    }
    setIsSelectModalOpen(true);
  };

  // 處理套組選擇

  // 在 BundleDetail.js 或 SelectBundle.js 中
const handleBundleSelect = async (bundleData) => {
  try {
    console.log("準備將套組加入購物車:", bundleData);
    // 確保 bundleData 中包含正確的 type 和 bundleId
    if (!bundleData.type || !bundleData.bundleId) {
      console.error("套組數據格式不正確:", bundleData);
      showToast("添加失敗，數據不完整");
      return;
    }
    
    const success = await addToCart(bundleData);
    if (success) {
      showToast("套組已成功加入購物車！");
    }
  } catch (error) {
    console.error("添加套組到購物車失敗:", error);
    showToast("添加失敗，請稍後再試");
  }
};

  if (!bundle) return <div>載入中...</div>;

  return (
    <div className="container">
      <div className="productDetailContainer">
        <div className="row">
          {/* 左側主要商品圖片 */}
          <div className="col-md-6">
            <div className="product-img">
              <Image
                src={
                  bundle.main_image
                    ? `/image/product/${bundle.main_image}`
                    : "/image/product/no-img.png"
                }
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
                  <button className="btn p-0">
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
                <RatingSummary type="bundle" id={bundle.id} />
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
        onSelect={handleBundleSelect}
      />
    </div>
  );
}
