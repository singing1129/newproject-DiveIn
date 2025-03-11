"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import ArticleForm from "../components/articleForm"; // 引入表單組件
import "../components/articleCreate.css";

export default function ArticleCreate() {
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-3 d-none d-md-block"> {/* 在大尺寸顯示，小尺寸隱藏 */}
          <Sidebar />
        </div>
        <div className="article-create col-12 col-md-9"> {/* 小尺寸佔滿，大尺寸佔 9/12 */}
          <ArticleForm />
        </div>
      </div>
    </div>
  );
}