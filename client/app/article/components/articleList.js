"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import "./articleList.css";
import "./articleAside.css";
import Sidebar from "./sidebar";
import ArticleCard from "./articleCard";
import { useAuth } from "../../hooks/useAuth";

const API_BASE_URL = "http://localhost:3005/api";

const ArticleListPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
  });

  // 搜尋相關狀態和函數
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState([]);

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredArticles(articles);
      return;
    }
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredArticles(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredArticles(articles);
  };

  // 文章篩選選項
  const [sortOption, setSortOption] = useState("all");
  const [statusOption, setStatusOption] = useState("all");

  // 用戶認證和加載狀態
  const { user } = useAuth();
  const [usersId, setUsersId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sidebar 數據狀態
  const [sidebarData, setSidebarData] = useState({ sidebar: {} });
  const [currentBigCategory, setCurrentBigCategory] = useState("課程與體驗");

  useEffect(() => {
    if (user === -1) {
      setUsersId(null);
    } else if (user && user.id) {
      setUsersId(user.id);
    } else {
      setUsersId(null);
    }
    setLoading(false);
  }, [user]);

  // 獲取文章數據
  useEffect(() => {
    const fetchArticles = async () => {
      const page = parseInt(searchParams.get("page")) || 1;
      const category = searchParams.get("category");
      const tag = searchParams.get("tag");
      const sort = searchParams.get("sort");
      const status = searchParams.get("status");

      let url = `${API_BASE_URL}/article`;
      const params = new URLSearchParams();

      if (!status && sortOption !== "my-articles") {
        params.set("status", "published");
      }

      params.set("page", page);
      params.set("limit", 10);

      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (sort) params.set("sort", sort);
      if (status) params.set("status", status);

      if (sortOption === "my-articles" && usersId) {
        params.set("users_id", usersId);
      }

      url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.pagination) {
        console.error("Pagination data is missing in API response");
        return;
      }

      setArticles(data.data);
      setFilteredArticles(data.data); // 初始時同步 filteredArticles
      setPagination({
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
      });
    };

    if (!loading) {
      fetchArticles();
    }
  }, [searchParams, sortOption, usersId, loading]);

  // 獲取 Sidebar 數據
  useEffect(() => {
    const fetchSidebarData = async () => {
      const res = await fetch(`${API_BASE_URL}/article/sidebar`);
      const data = await res.json();
      setSidebarData(data);
    };
    fetchSidebarData();
  }, []);

  // 分頁切換
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`);
  };

  // 排序處理
  const handleSortChange = (sortValue) => {
    setSortOption(sortValue);
    const params = new URLSearchParams(searchParams);

    if (sortValue === "all") {
      params.delete("sort");
      params.delete("category");
      params.delete("tag");
      params.delete("status");
    } else if (sortValue === "my-articles") {
      if (!usersId) {
        const choice = window.confirm(
          "您尚未登入！\n[確定] 前往登入\n[取消] 返回文章列表"
        );
        if (choice) {
          router.push("/admin/login");
          return;
        }
        setSortOption("all");
        return;
      }
      params.delete("sort");
      params.delete("status");
    } else {
      params.set("sort", sortValue);
    }

    router.push(`/article?${params.toString()}`);
  };

  // 狀態篩選處理
  const handleStatusChange = (statusValue) => {
    setStatusOption(statusValue);
    const params = new URLSearchParams(searchParams);

    if (statusValue === "all") {
      params.delete("status");
    } else {
      params.set("status", statusValue);
    }

    router.push(`/article?${params.toString()}`);
  };

  // 按鈕跳轉
  const handleButtonClick = (path) => {
    router.push(path);
  };

  // 大分類切換
  const handleBigCategoryChange = (bigCategory) => {
    setCurrentBigCategory(bigCategory);
    const params = new URLSearchParams(searchParams);
    params.delete("category"); // 切換大分類時清空小分類
    router.push(`?${params.toString()}`);
  };

  // 小分類點擊
  const handleCategoryClick = (categorySmallName) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", categorySmallName);
    router.push(`/article?${params.toString()}`);
  };

  // 根據當前大分類過濾小分類
  const smallCategories = sidebarData.sidebar.categorySmall?.filter(
    (small) =>
      small.category_big_id ===
      sidebarData.sidebar.categoryBig?.find(
        (big) => big.name === currentBigCategory
      )?.id
  ) || [];

  if (loading || !articles) {
    return <div>載入中...</div>;
  }

  return (
    <div className="container mt-4">
    <div className="row">
      {/* 大螢幕 Sidebar */}
      <div className="col-lg-3 col-md-4 sidebar-desktop">
        <Sidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          handleClearSearch={handleClearSearch}
        />
      </div>

        {/* 手機版分類與控制區域 */}
        <div className="col-12 sidebar-mobile">
          <div className="mobile-category-bar">
            <div className="big-category-bar">
              <select
                value={currentBigCategory}
                onChange={(e) => handleBigCategoryChange(e.target.value)}
              >
                {sidebarData?.sidebar?.categoryBig?.map((big) => (
                  <option key={big.id} value={big.name}>
                    {big.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="small-category-bar">
              {smallCategories.slice(0, 3).map((small) => ( // 只顯示前三個小分類
                <button
                  key={small.id}
                  className={`small-category-btn ${
                    searchParams.get("category") === small.category_small_name
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleCategoryClick(small.category_small_name)}
                >
                  {small.category_small_name}
                </button>
              ))}
            </div>
          </div>
      
        </div>

        {/* 主內容區域 */}
        <div className="col-lg-9 col-md-8 article-list">
          {/* 大螢幕的控制區域 */}
          <div className="article-controls desktop-controls">
            <div className="article-controls-btn">
              <button
                className="btn"
                onClick={() => handleButtonClick("/article/create")}
              >
                <span className="btn-icon">
                  <i className="fa-solid fa-pen"></i>
                </span>
                新增文章
              </button>
            </div>
            <div className="custom-filter">
              <div className="dropdown">
                <button
                  className="px-3 btn custom-filter-btn"
                  type="button"
                  id="sortButton"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {sortOption === "all"
                    ? "所有文章"
                    : sortOption === "newest"
                    ? "最新文章"
                    : sortOption === "oldest"
                    ? "最舊文章"
                    : sortOption === "popular"
                    ? "熱門文章"
                    : "我的文章"}
                  <i className="bi bi-caret-down-fill ps-2"></i>
                </button>
                <ul className="dropdown-menu" aria-labelledby="sortButton">
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("all");
                      }}
                    >
                      所有文章
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("newest");
                      }}
                    >
                      最新文章
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("oldest");
                      }}
                    >
                      最舊文章
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("popular");
                      }}
                    >
                      熱門文章
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSortChange("my-articles");
                      }}
                    >
                      我的文章
                    </a>
                  </li>
                </ul>
              </div>
              {sortOption === "my-articles" && (
                <div className="dropdown">
                  <button
                    className="px-3 btn custom-filter-btn ms-2"
                    type="button"
                    id="statusButton"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {statusOption === "all"
                      ? "所有文章"
                      : statusOption === "published"
                      ? "已發表"
                      : "草稿夾"}
                    <i className="bi bi-caret-down-fill ps-2"></i>
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="statusButton">
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusChange("all");
                        }}
                      >
                        所有文章
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusChange("published");
                        }}
                      >
                        已發表
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusChange("draft");
                        }}
                      >
                        草稿夾
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 卡片區域 */}
          <div className="cards-container">
            {(searchQuery ? filteredArticles : articles).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isMyArticles={sortOption === "my-articles"}
                onDeleteSuccess={() => {
                  setArticles((prevArticles) =>
                    prevArticles.filter((a) => a.id !== article.id)
                  );
                  setFilteredArticles((prevFilteredArticles) =>
                    prevFilteredArticles.filter((a) => a.id !== article.id)
                  );
                }}
              />
            ))}
          </div>

          {/* 分頁 */}
          <div className="custom-pagination">
            <div className="page-item">
              <button
                className="page-link"
                aria-label="First"
                onClick={() => goToPage(1)}
                disabled={pagination.currentPage === 1}
              >
                ««
              </button>
            </div>
            <div className="page-item">
              <button
                className="page-link"
                aria-label="Previous"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                «
              </button>
            </div>
            {pagination.currentPage > 1 && (
              <div className="page-item">
                <button
                  className="page-link"
                  onClick={() => goToPage(pagination.currentPage - 1)}
                >
                  {pagination.currentPage - 1}
                </button>
              </div>
            )}
            <div className="page-item active">
              <button className="page-link">{pagination.currentPage}</button>
            </div>
            {pagination.currentPage < pagination.totalPages && (
              <div className="page-item">
                <button
                  className="page-link"
                  onClick={() => goToPage(pagination.currentPage + 1)}
                >
                  {pagination.currentPage + 1}
                </button>
              </div>
            )}
            <div className="page-item">
              <button
                className="page-link"
                aria-label="Next"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                »
              </button>
            </div>
            <div className="page-item">
              <button
                className="page-link"
                aria-label="Last"
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                »»
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleListPage;