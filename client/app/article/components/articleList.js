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
  const [isMyArticles, setIsMyArticles] = useState(false);
  const [statusOption, setStatusOption] = useState("all");

  const { user } = useAuth();
  const [usersId, setUsersId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setIsMyArticles(searchParams.get("myArticles") === "true");
  }, [searchParams]);

  useEffect(() => {
    const fetchArticles = async () => {
      const page = parseInt(searchParams.get("page")) || 1;
      const category = searchParams.get("category");
      const tag = searchParams.get("tag");
      const sort = searchParams.get("sort");
      const status = searchParams.get("status");

      let url = `${API_BASE_URL}/article`;
      const params = new URLSearchParams();

      if (!status && !isMyArticles) {
        params.set("status", "published");
      }

      params.set("page", page);
      params.set("limit", 10);

      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (sort) params.set("sort", sort);
      if (status) params.set("status", status);

      if (isMyArticles && usersId) {
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
      setPagination({
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
      });
    };

    if (!loading) {
      fetchArticles();
    }
  }, [searchParams, sortOption, isMyArticles, usersId, loading]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    const params = new URLSearchParams(searchParams);
    if (newSort === "all") {
      params.delete("sort");
      params.delete("category");
      params.delete("tag");
      params.delete("status");
      router.push("/article");
    } else {
      params.set("sort", newSort);
      router.push(`/article?${params.toString()}`);
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatusOption(newStatus);
    const params = new URLSearchParams(searchParams);
    if (newStatus === "all") {
      params.delete("status");
      params.delete("category");
      params.delete("tag");
      router.push("/article");
    } else {
      params.set("status", newStatus);
      router.push(`/article?${params.toString()}`);
    }
  };

  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const handleMyArticlesClick = () => {
    if (!usersId) {
      const choice = window.confirm(
        "您尚未登入！\n[確定] 前往登入\n[取消] 返回文章列表"
      );
      if (choice) {
        router.push("/admin/login");
      }
      return;
    }

    setIsMyArticles(!isMyArticles);
    setShowStatusFilter(!isMyArticles);

    const params = new URLSearchParams(searchParams);
    if (!isMyArticles) {
      params.set("myArticles", "true");
    } else {
      params.delete("myArticles");
      router.push("/article");
    }
    router.push(`?${params.toString()}`);
  };

  const handleButtonClick = (path) => {
    router.push(path);
  };

  if (!articles) {
    return <div>載入中...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-3">
          <Sidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            handleClearSearch={handleClearSearch}
          />
        </div>

        <div className="article-list col-9">
          <div className="article-controls">
            <div className="filter">
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="form-select"
              >
                <option value="all">所有文章</option>
                <option value="newest">最新文章</option>
                <option value="oldest">最舊文章</option>
                <option value="popular">熱門文章</option>
              </select>
              {showStatusFilter && (
                <select
                  value={statusOption}
                  onChange={handleStatusChange}
                  className="form-select"
                >
                  <option value="all">所有文章</option>
                  <option value="published">已發表</option>
                  <option value="draft">草稿夾</option>
                </select>
              )}
            </div>
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
              <button className="btn" onClick={handleMyArticlesClick}>
                <span className="btn-icon">
                  <i className="fa-solid fa-bookmark"></i>
                </span>
                {isMyArticles ? "返回列表" : "我的文章"}
              </button>
            </div>
          </div>
          <div className="cards-container">
            {(searchQuery ? filteredArticles : articles).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isMyArticles={isMyArticles}
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