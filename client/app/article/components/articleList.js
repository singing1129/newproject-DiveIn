"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import "./articleList.css";
import "./articleAside.css";
import Sidebar from "./sidebar";
import ArticleCard from "./articleCard";
import useLocalStorage from "../../hooks/use-localstorage.js"; // 用戶登入

const API_BASE_URL = "http://localhost:3005/api";

const ArticleListPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
  });

  // 文章篩選選項
  const [sortOption, setSortOption] = useState("all"); // 初始值為 all，表示顯示所有文章
  const [isMyArticles, setIsMyArticles] = useState(false); // 控制是否顯示「我的文章」

  // 獲取用戶的 ID
  const [userId, setUserId] = useLocalStorage("user_id", null);
  const [loading, setLoading] = useState(true); // 新增 loading 狀態，防止渲染前頁面顯示不一致

  // 當 userId 改變時才會進行更新
  useEffect(() => {
    if (userId !== null) {
      setLoading(false);
    }
  }, [userId]);

  // 修正依賴陣列，保持一致性
  useEffect(() => {
    const fetchArticles = async () => {
      const page = parseInt(searchParams.get("page")) || 1;
      const category = searchParams.get("category");
      const tag = searchParams.get("tag");

      // 根據是否為「我的文章」，決定篩選條件
      let url = `${API_BASE_URL}/article?page=${page}&sort=${sortOption}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;

      // 只有在 "我的文章" 為 true 且 userId 存在時才進行篩選
      if (isMyArticles && userId) url += `&user_id=${userId}`;

      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.data);
      setPagination({
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
      });
    };

    // 確保用戶已經登入或載入完成
    if (!loading) {
      fetchArticles();
    }
  }, [searchParams, sortOption, isMyArticles, userId, loading]);

  // 切換頁面
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`);
  };

  // 處理篩選條件變更
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // 處理「我的文章」按鈕點擊
  const handleMyArticlesClick = () => {
    if (userId) {
      setIsMyArticles(!isMyArticles); // 只有在用戶登入的情況下，才會切換「我的文章」篩選
    } else {
      alert("請先登入才能查看我的文章");
    }
  };

  if (!articles) {
    return <div>載入中...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <Sidebar />

        <div className="article-list col-9">
          <div className="article-controls">
            {/* 篩選 */}
            <div className="filter">
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="form-select"
              >
                {sortOption === "all" && <option value="all">所有文章</option>}{" "}
                {/* 初始顯示 '所有文章' */}
                <option value="newest">最新文章</option>
                <option value="popular">熱門文章</option>
              </select>
            </div>
            {/* 跳頁面btn */}
            <div className="article-controls-btn">
              <button
                className="btn"
                onClick={() => handleButtonClick("/article/create")}
              >
                {" "}
                <span className="btn-icon">
                  <i className="fa-solid fa-pen"></i>
                </span>
                新增文章
              </button>
              <button className="btn" onClick={handleMyArticlesClick}>
                <span className="btn-icon">
                  <i className="fa-solid fa-bookmark"></i>
                </span>
                我的文章
              </button>
            </div>
          </div>

          {/* 文章card */}
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}

          {/* 分頁 */}
          <div className="custom-pagination">
            <div className="page-item">
              <button
                className="page-link"
                aria-label="First"
                onClick={() => goToPage(1)}
                disabled={pagination.currentPage === 1}
              >
                &laquo;&laquo;
              </button>
            </div>
            <div className="page-item">
              <button
                className="page-link"
                aria-label="Previous"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                &laquo;
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
                &raquo;
              </button>
            </div>
            <div className="page-item">
              <button
                className="page-link"
                aria-label="Last"
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &raquo;&raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleListPage;
