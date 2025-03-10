"use client";
import { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import Link from "next/link";
import styles from "./search.module.css";

export default function Search({ onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // 处理搜索
  const handleSearch = async (e) => {
    e?.preventDefault(); // 使e参数可选
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 调用后端API
      console.log("发送搜索请求:", searchTerm);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
        }/api/search?term=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        console.error("搜索请求失败，状态码:", response.status);
        throw new Error("搜索请求失败");
      }

      const data = await response.json();
      console.log("搜索结果:", data);

      // 检查是否有任何结果
      const hasAnyResults = Object.values(data).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );

      if (!hasAnyResults) {
        console.log("搜索没有找到任何结果");
      } else {
        // 记录每个类别的结果数量
        console.log("结果统计:", {
          products: data.products?.length || 0,
          activities: data.activities?.length || 0,
          rentals: data.rentals?.length || 0,
          groups: data.groups?.length || 0,
          articles: data.articles?.length || 0,
        });
      }

      setSearchResults(data);
      setShowResults(true);
    } catch (err) {
      console.error("搜索错误:", err);
      setError("搜索过程中发生错误，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 点击外部关闭搜索结果
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 添加快捷键监听
  useEffect(() => {
    function handleKeyDown(event) {
      // 检测 Ctrl+K 或 Command+K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault(); // 阻止默认行为
        if (inputRef.current) {
          inputRef.current.focus(); // 聚焦到搜索框
        }
      }

      // 按ESC键关闭搜索
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 过滤当前标签的结果
  const getFilteredResults = () => {
    if (!searchResults) return {};

    if (activeTab === "all") return searchResults;

    const categoryMap = {
      products: "products",
      activities: "activities",
      rentals: "rentals",
      groups: "groups",
      articles: "articles",
    };

    const filtered = {};
    filtered[categoryMap[activeTab]] = searchResults[categoryMap[activeTab]];
    return filtered;
  };

  // 检查是否有搜索结果
  const hasResults = () => {
    if (!searchResults) return false;

    return Object.values(searchResults).some((arr) => arr && arr.length > 0);
  };

  // 获取图片URL，处理可能的空值或相对路径
  const getImageUrl = (imageUrl, type) => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

    if (!imageUrl) {
      // 返回默认图片
      switch (type) {
        case "article":
          return `${backendUrl}/uploads/article/no_is_main.png`;
        case "activity":
          return "/image/activity/1.jpg";
        case "group":
          return "/image/group/1.jpg";
        case "product":
          return "/image/product/no-img.png";
        case "rental":
          return "/image/rent/no-img.png";
        default:
          return `/image/${type}-placeholder.jpg`;
      }
    }

    // 文章图片特殊处理，与articleCard.js保持一致
    if (type === "article") {
      return typeof imageUrl === "string" && imageUrl.startsWith("http")
        ? imageUrl
        : `${backendUrl}${
            typeof imageUrl === "string" && imageUrl.startsWith("/") ? "" : "/"
          }${imageUrl}`;
    }

    // 如果是对象类型，根据不同类型处理
    if (typeof imageUrl === "object") {
      if (type === "activity" && imageUrl.id && imageUrl.image) {
        return `/image/activity/${imageUrl.id}/${imageUrl.image}`;
      }
      // 如果是其他类型的对象，尝试使用toString()方法或返回默认图片
      return imageUrl.toString ? imageUrl.toString() : getImageUrl(null, type);
    }

    // 如果是相对路径，添加基础URL
    if (typeof imageUrl === "string" && imageUrl.startsWith("/")) {
      return imageUrl;
    }

    // 如果是完整URL，直接返回
    if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // 根据不同类型处理图片路径
    switch (type) {
      case "activity":
        // 活动图片需要包含活动ID
        if (typeof imageUrl === "string" && imageUrl.includes("/")) {
          // 如果已经包含路径分隔符，可能已经包含ID
          return `/image/activity/${imageUrl}`;
        } else {
          // 否则使用默认路径
          return `/image/activity/1/${imageUrl}`;
        }
      case "group":
        // 揪团图片存储在前端public目录
        return `/image/group/${imageUrl}`;
      case "product":
        // 商品图片存储在前端public目录
        return `/image/product/${imageUrl}`;
      case "rental":
        // 租赁图片可能存储在前端public目录
        return `/image/rent/${imageUrl}`;
      default:
        // 默认情况
        return `/image/${type}/${imageUrl}`;
    }
  };

  // 安全获取数组，确保即使是undefined也返回空数组
  const safeArray = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  return (
    <div className={styles.searchOverlay} onClick={onClose}>
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="關閉搜尋"
      >
        <FaTimes />
      </button>

      <div
        className={styles.searchContainer}
        ref={searchRef}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋商品、活動、租借、揪團、文章... (按 Ctrl+K 或 Command+K 快速搜尋)"
            className={styles.searchInput}
            autoFocus
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={isLoading}
          >
            {isLoading ? "搜尋中..." : <FaSearch />}
          </button>
        </form>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {showResults && searchResults && (
          <div className={styles.searchResults}>
            <div className={styles.searchTabs}>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "all" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("all")}
              >
                全部
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "products" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("products")}
              >
                商品
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "activities" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("activities")}
              >
                活動
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "rentals" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("rentals")}
              >
                租借
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "groups" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("groups")}
              >
                揪團
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "articles" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("articles")}
              >
                論壇
              </button>
            </div>

            <div className={styles.resultsContent}>
              {/* 商品结果 */}
              {safeArray(getFilteredResults().products).length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>商品</h3>
                  <div className={styles.productGrid}>
                    {safeArray(getFilteredResults().products).map((product) => (
                      <div
                        key={product.id || Math.random()}
                        className={styles.productCard}
                      >
                        <Link
                          href={`/products/${product.id || ""}`}
                          className={styles.productLink}
                        >
                          <div className={styles.productImage}>
                            <img
                              src={getImageUrl(product.image, "product")}
                              alt={product.name || "商品"}
                              loading="lazy"
                            />
                          </div>
                          <div className={styles.productInfo}>
                            <h4>{product.name || "未命名商品"}</h4>
                            <p className={styles.price}>
                              ${product.price || "價格待定"}
                            </p>
                            <p className={styles.brand}>
                              品牌: {product.brand || "未知"}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/products/search?term=${searchTerm}`}
                    className={styles.viewMore}
                  >
                    查看更多
                  </Link>
                </div>
              )}

              {/* 活动结果 */}
              {safeArray(getFilteredResults().activities).length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>活動</h3>
                  <div className={styles.activityList}>
                    {safeArray(getFilteredResults().activities).map(
                      (activity) => (
                        <div
                          key={activity.id || Math.random()}
                          className={styles.activityItem}
                        >
                          <Link
                            href={`/activity/${activity.id || ""}`}
                            className={styles.activityLink}
                          >
                            <div className={styles.activityImage}>
                              <img
                                src={getImageUrl(
                                  activity.image
                                    ? { id: activity.id, image: activity.image }
                                    : null,
                                  "activity"
                                )}
                                alt={activity.name || "活動"}
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                            <div className={styles.activityInfo}>
                              <h4>{activity.name || "未命名活動"}</h4>
                              <p>
                                {activity.city || "未知地點"} |{" "}
                                {activity.date || "日期待定"} | $
                                {activity.price || "價格待定"}
                              </p>
                            </div>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                  <Link
                    href={`/activity/search?term=${searchTerm}`}
                    className={styles.viewMore}
                  >
                    查看更多
                  </Link>
                </div>
              )}

              {/* 租借结果 */}
              {safeArray(getFilteredResults().rentals).length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>租借</h3>
                  <div className={styles.rentalGrid}>
                    {safeArray(getFilteredResults().rentals).map((rental) => (
                      <div
                        key={rental.id || Math.random()}
                        className={styles.rentalCard}
                      >
                        <Link
                          href={`/rent/${rental.id || ""}`}
                          className={styles.rentalLink}
                        >
                          <div className={styles.rentalImage}>
                            <img
                              src={getImageUrl(rental.image, "rental")}
                              alt={rental.name || "租借"}
                              loading="lazy"
                            />
                          </div>
                          <div className={styles.rentalInfo}>
                            <h4>{rental.name || "未命名租借"}</h4>
                            <p className={styles.price}>
                              ${rental.price || "價格待定"}/天
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/rent/search?term=${searchTerm}`}
                    className={styles.viewMore}
                  >
                    查看更多
                  </Link>
                </div>
              )}

              {/* 揪团结果 */}
              {safeArray(getFilteredResults().groups).length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>揪團</h3>
                  <div className={styles.groupList}>
                    {safeArray(getFilteredResults().groups).map((group) => (
                      <div
                        key={group.id || Math.random()}
                        className={styles.groupItem}
                      >
                        <Link
                          href={`/group/list/${group.id || ""}`}
                          className={styles.groupLink}
                        >
                          <div className={styles.groupImage}>
                            <img
                              src={getImageUrl(group.image, "group")}
                              alt={group.name || "揪團"}
                              loading="lazy"
                            />
                          </div>
                          <div className={styles.groupInfo}>
                            <h4>{group.name || "未命名揪團"}</h4>
                            <p>
                              {group.city || "未知地點"} |{" "}
                              {group.date || "日期待定"} |{" "}
                              {group.status || "狀態未知"} ({group.current || 0}
                              /{group.max || 0}人)
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/group/search?term=${searchTerm}`}
                    className={styles.viewMore}
                  >
                    查看更多
                  </Link>
                </div>
              )}

              {/* 论坛结果 */}
              {safeArray(getFilteredResults().articles).length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>論壇</h3>
                  <div className={styles.articleList}>
                    {safeArray(getFilteredResults().articles).map((article) => (
                      <div
                        key={article.id || Math.random()}
                        className={styles.articleItem}
                      >
                        <Link
                          href={`/article/${article.id || ""}`}
                          className={styles.articleLink}
                        >
                          <div className={styles.articleImage}>
                            <img
                              src={getImageUrl(article.image, "article")}
                              alt={article.name || "文章"}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div className={styles.articleInfo}>
                            <h4>{article.name || "未命名文章"}</h4>
                            <p>
                              {article.date || "日期未知"} |{" "}
                              {article.views || 0}瀏覽 | {article.replies || 0}
                              回覆
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/article/search?term=${searchTerm}`}
                    className={styles.viewMore}
                  >
                    查看更多
                  </Link>
                </div>
              )}

              {/* 无结果提示 */}
              {!hasResults() && (
                <div className={styles.noResults}>
                  <p>沒有找到與 &quot;{searchTerm}&quot; 相關的結果</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
