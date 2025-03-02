"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import EditMyeditor from "./editMyeditor"; // 引入編輯用的 CKEditor 組件
import "./articleCreate.css"; // 共用樣式

const Edit = ({ initialData = {}, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryBig, setCategoryBig] = useState(
    initialData?.category_big_id || ""
  );
  const [categorySmall, setCategorySmall] = useState(
    initialData?.article_category_small_id || ""
  );
  const [tags, setTags] = useState(initialData?.tags || []);
  const [coverImage, setCoverImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    initialData?.cover_image || null
  );

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("article_category_small_id", categorySmall);
    formData.append("tags", JSON.stringify(tags));

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    onSave(formData); // 將表單數據傳遞給父組件
  };

  return (
    <div className="create-form">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* 標題 */}
        <div className="secondaryTitle">標題</div>
        <input
          type="text"
          className="form-control"
          placeholder="限 60 個中英字母"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* 內容 (CKEditor) */}
        <div className="secondaryTitle">內容</div>
        <EditMyeditor value={content} onChange={(data) => setContent(data)} />

        {/* 提交按鈕 */}
        <div className="btnarea">
          <button type="submit" className="btn article-create-btn">
            儲存
          </button>
        </div>
      </form>
    </div>
  );
};

export default Edit;