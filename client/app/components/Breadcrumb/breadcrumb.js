"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean); // 分割網址並移除空值
  let fullPath = "";

  const lastSegment = pathSegments[pathSegments.length - 1];
  const [detailName, setDetailName] = useState(null);

  const breadcrumbNames = {
    activity: { "": "活動列表", detail: "活動詳情" },
    group: { "": "揪團首頁", list: "揪團列表", detail: "揪團詳情", create: "創立新揪團" },
    rent: { "": "租借商品列表" },
    products: { "": "商品列表" },
    article: { "": "文章首頁", list: "文章列表", detail: "文章詳情", create: "建立文章" },
    admin: {
      "": "會員中心",
      account: "我的帳戶",
      favorites: "我的收藏",
      group: "我的揪團",
      order: "我的訂單",
      orderActivity: "活動清單",
      orderProduct: "商品清單",
      orderRent: "租借清單",
      login: "用戶登入",
      coupon: "我的優惠券",
      "coupon-claim": "領取專屬優惠",
      "coupon-history": "歷史紀錄",
      message: "我的訊息",
      notifications: "系統通知",
    },
  };

  useEffect(() => {
    const fetchDetailName = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
        const parent = pathSegments[0];
        let response, data;

        switch (parent) {
          case "rent":
            if (pathSegments.length === 2 && Number(lastSegment)) {
              response = await fetch(`${API_BASE_URL}/api/rent/${encodeURIComponent(lastSegment)}`);
              data = await response.json();
              if (data.success && data.data) {
                const brandName = data.data.brand_name || "未知品牌";
                const productName = data.data.name || "暫無商品名稱";
                setDetailName(`${brandName} - ${productName}`);
              } else {
                setDetailName("未知品牌 - 暫無商品名稱");
              }
            } else {
              setDetailName(null);
            }
            break;

          case "article":
            if ((pathSegments.length === 2 && Number(lastSegment)) || pathname.includes("/article/detail")) {
              response = await fetch(`${API_BASE_URL}/api/article/${encodeURIComponent(lastSegment)}`);
              data = await response.json();
              if (data.status === "success" && data.data) {
                setDetailName(data.data.title || "未命名文章");
              } else {
                setDetailName("未命名文章");
              }
            } else {
              setDetailName(null);
            }
            break;

          case "group":
            if (pathname.includes("/group/list/") && pathSegments.length === 3) {
              response = await fetch(`${API_BASE_URL}/api/group/list/${encodeURIComponent(lastSegment)}`);
              data = await response.json();
              if (data.status === "success" && data.data.length > 0) {
                setDetailName(data.data[0].name || "未命名揪團");
              } else {
                setDetailName("未命名揪團");
              }
            } else {
              setDetailName(null);
            }
            break;

          case "admin":
            if (pathname.includes("/admin/message/") && pathSegments.length === 3) {
              response = await fetch(`${API_BASE_URL}/api/group/list/${encodeURIComponent(lastSegment)}`);
              data = await response.json();
              if (data.status === "success" && data.data.length > 0) {
                setDetailName(`[${data.data[0].name}] 的聊天室` || "未命名聊天室");
              } else {
                setDetailName("未命名揪團");
              }
            } else {
              setDetailName(null);
            }
            break;

          case "products":
            if (pathSegments.length === 2 && Number(lastSegment)) {
              const id = Number(lastSegment);
              // 如果 ID 是四位數（大於等於 1000），從 bundle API 獲取
              if (id >= 1000) {
                response = await fetch(`${API_BASE_URL}/api/bundle/${encodeURIComponent(lastSegment)}`);
                data = await response.json();
                if (data.status === "success" && data.data) {
                  // 假設 bundle API 返回的數據中有 name 字段表示套裝名稱
                  setDetailName(data.data.name || "未命名組合套裝");
                } else {
                  setDetailName("未命名組合套裝");
                }
              } else {
                // 否則從 products API 獲取單品資料
                response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(lastSegment)}`);
                data = await response.json();
                if (data.status === "success" && data.data) {
                  const brandName = data.data.brand_name || "未知品牌";
                  const productName = data.data.name || "暫無商品名稱";
                  setDetailName(`${brandName} - ${productName}`);
                } else {
                  setDetailName("未知品牌 - 暫無商品名稱");
                }
              }
            } else {
              setDetailName(null);
            }
            break;

          default:
            setDetailName(null);
            break;
        }
      } catch (error) {
        console.error("Failed to fetch detail name:", error);
        setDetailName("無法獲取名稱");
      }
    };

    const isDetailPage =
      (pathSegments.length === 2 && Number(lastSegment)) ||
      (pathSegments.length === 3 && (pathname.includes("/group/list/") || pathname.includes("/admin/message/"))) ||
      pathname.includes("detail");

    if (isDetailPage) {
      fetchDetailName();
    } else {
      setDetailName(null);
    }
  }, [pathname, lastSegment]);

  return (
    <div className="bread container d-none d-sm-block">
      <nav aria-label="breadcrumb">
        <ol className="m-0 breadcrumb breadcrumb-list">
          <li className="breadcrumb-item">
            <Link className="a" href="/">首頁</Link>
          </li>
          {pathSegments.map((segment, index) => {
            fullPath += `/${segment}`;
            const parent = pathSegments[0];
            let label = breadcrumbNames[parent]?.[segment] || breadcrumbNames[segment]?.[""] || segment;
            const isLast = index === pathSegments.length - 1;

            // 如果是最後一段且有動態名稱，且是詳情頁，替換為 detailName
            if (isLast && detailName && Number(lastSegment)) {
              label = detailName;
            }

            return (
              <li key={index} className={`breadcrumb-item ${isLast ? "active" : ""}`}>
                {isLast ? (
                  <span>{label}</span>
                ) : (
                  <Link className="a" href={fullPath}>{label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}