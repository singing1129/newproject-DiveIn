import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./articleAside.css";
import "./articleList.css";

const Sidebar = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  handleClearSearch,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const [sidebarData, setSidebarData] = useState({ sidebar: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClearIcon, setShowClearIcon] = useState(false); // 新增狀態

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const res = await fetch("http://localhost:3005/api/article/sidebar");
        if (!res.ok) {
          throw new Error(`HTTP 错误！状态码: ${res.status}`);
        }
        const data = await res.json();
        setSidebarData(data);
      } catch (error) {
        console.error("❌ 获取 Sidebar 数据失败:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  // 修改搜尋處理函數
  const handleSearchClick = () => {
    if (searchQuery) {
      handleSearch(); // 執行搜尋
      setShowClearIcon(true); // 顯示清除圖標
    }
  };

  // 修改清除處理函數
  const handleClearClick = () => {
    handleClearSearch(); // 清空搜尋
    setShowClearIcon(false); // 隱藏清除圖標，恢復搜尋圖標
  };

  if (loading || !sidebarData.sidebar) return <div>加载中...</div>;
  if (error) return <div>发生错误: {error}</div>;

  const {
    categoryBig = [],
    categorySmall = [],
    latest_articles = [],
    random_tags = [],
  } = sidebarData.sidebar || {};

  const handleCategoryClick = (categorySmallName) => {
    router.push(`/article?category=${encodeURIComponent(categorySmallName)}`);
  };

  const handleTagClick = (tagName) => {
    router.push(`/article?tag=${encodeURIComponent(tagName)}`);
  };

  const handleArticleClick = (articleId) => {
    router.push(`/article/${articleId}`);
  };

  return (
    <aside>
      {/* 搜尋框 */}
      <div className="article-search-box">
        <input
          type="text"
          placeholder="搜尋文章..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {showClearIcon && searchQuery ? (
          <i
            className="fa-solid fa-times clear-icon"
            onClick={handleClearClick}
            style={{ cursor: "pointer" }}
          />
        ) : (
          <i
            className="fa-solid fa-search search-icon"
            onClick={handleSearchClick}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>

      {/* 原有的分類區域 */}
      {categoryBig.map((bigCategory) => (
        <div key={bigCategory.id} className="aside-category">
          <div className="aside-title">{bigCategory.name}</div>
          <div className="aside-category-list">
            {categorySmall
              .filter((small) => small.category_big_id === bigCategory.id)
              .map((smallCategory) => {
                const isActive =
                  currentCategory === smallCategory.category_small_name;

                return (
                  <div
                    className="aside-category-item d-flex justify-content-between"
                    key={smallCategory.id}
                  >
                    <div
                      className={`aside-category-title ${isActive ? "active" : ""}`}
                      onClick={() =>
                        handleCategoryClick(smallCategory.category_small_name)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {smallCategory.category_small_name}
                    </div>
                    <div className="aside-category-amount">
                      (<span>{smallCategory.article_count}</span>)
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {/* 最近文章 */}
      <div className="aside-recent">
        <div className="aside-recent-article-list">
          <div className="aside-title">最近文章</div>
          {latest_articles.map((article) => (
            <div
              className="aside-recent-article"
              key={article.id}
              onClick={() => handleArticleClick(article.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="aside-recent-article-title">{article.title}</div>
              <div className="aside-recent-article-publish-time">
                {article.publish_at}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 標籤區域 */}
      <div className="aside-tag">
        <div className="aside-title">標籤區域</div>
        <div className="aside-tag-area">
          {random_tags.map((tag) => (
            <span
              key={tag.id}
              className="aside-popular-tag"
              onClick={() => handleTagClick(tag.tag_name)}
              style={{ cursor: "pointer" }}
            >
              #{tag.tag_name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;