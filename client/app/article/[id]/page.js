"use client";
import React from "react";
import ArticleDetail from "../components/articleDetail";
import "../components/articleAside.css";
import "../components/article.css";

export default function ArticlePage() {
  return (
    <div className="container mt-4">
      <ArticleDetail />
    </div>
  );
}