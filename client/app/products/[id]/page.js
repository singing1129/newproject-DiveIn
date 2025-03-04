"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductDetail from "../components/ProductDetail";
import BundleDetail from "../components/BundleDetail";
import { useParams } from "next/navigation";

export default function ProductOrBundlePage() {
  const { id } = useParams(); // 取得路由上的 [id]
  const [data, setData] = useState(null);
  const [itemType, setItemType] = useState(null); // "product" or "bundle"
  const [error, setError] = useState(null);
  const BASE_URL = "http://localhost:3005/api";

  useEffect(() => {
    // 每次 id 改變都重新抓
    (async () => {
      try {
        // 1) 先嘗試呼叫 /api/products/:id
        const res = await axios.get(`${BASE_URL}/products/${id}`);
        const returnedData = res.data.data;

        // 假設後端一律回傳 "item_type" 屬性
        if (returnedData.item_type === "bundle") {
          setItemType("bundle");
        } else {
          setItemType("product");
        }

        setData(returnedData);
      } catch (err) {
        // 2) 如果 /api/products/:id 查不到，可能是組合包
        try {
          const bundleRes = await axios.get(`${BASE_URL}/bundle/${id}`);
          setItemType("bundle");
          setData(bundleRes.data.data);
        } catch (err2) {
          // 都查不到，404
          setError("找不到此商品或組合包");
        }
      }
    })();
  }, [id]);

  if (error) return <div className="container py-4">{error}</div>;
  if (!data) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4">
      {itemType === "bundle" ? (
        <BundleDetail bundle={data} />
      ) : (
        <ProductDetail product={data} />
      )}
    </div>
  );
}
