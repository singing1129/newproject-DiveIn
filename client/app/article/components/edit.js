"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import EditMyeditor from "./editMyeditor"; // 引入編輯用的 CKEditor 組件
import "./articleCreate.css"; // 共用樣式

const API_URL = "http://localhost:3005";

const Edit = ({ initialData = {}, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  // 使用 ID 来设置分类字段
  const [categoryBig, setCategoryBig] = useState(
    initialData?.category_big_name || ""
  );
  const [categorySmall, setCategorySmall] = useState(
    initialData?.category_small_name || ""
  );

  const [newTag, setNewTag] = useState("");
  const [tagsList, setTagsList] = useState(initialData?.tags || []);
  const [coverImage, setCoverImage] = useState(null); // 存儲選中的圖片
  const [previewImage, setPreviewImage] = useState(null); // 存儲圖片預覽的 URL

  const [submitStatus, setSubmitStatus] = useState("");

  // 其他狀態（分類、標籤等）
  const [categoriesBig, setCategoriesBig] = useState([]);
  const [categoriesSmall, setCategoriesSmall] = useState([]);
  const [filteredSmallCategories, setFilteredSmallCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // 獲取分類與標籤
  useEffect(() => {
    const getCategoriesAndTags = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3005/api/article/create/data"
        );
        const data = response.data;

        if (data.success) {
          setCategoriesBig(data.category_big || []);
          setCategoriesSmall(data.category_small || []);

          // 根據 initialData 設置分類
          if (initialData?.category_big_id) {
            const filtered = data.category_small.filter(
              (item) => item.category_big_id === initialData.category_big_id
            );
            setFilteredSmallCategories(filtered);
          }

          setTags(data.tags || []);
        }
      } catch (error) {
        console.error("❌ 取得分類與標籤失敗：", error);
      }
    };
    getCategoriesAndTags();
  }, [initialData]);

  // 當選擇大分類時，更新對應的小分類
  useEffect(() => {
    if (categoryBig) {
      const filtered = categoriesSmall.filter(
        (item) => item.category_big_id === parseInt(categoryBig)
      );
      setFilteredSmallCategories(filtered);
    } else {
      setFilteredSmallCategories([]);
    }
  }, [categoryBig, categoriesSmall]);

  // 處理標籤輸入
  const handleTagInput = (e) => setNewTag(e.target.value);
  const addTag = (e) => {
    if (e.key === "Enter" && newTag.trim() !== "") {
      setTagsList([...tagsList, newTag.trim()]);
      setNewTag("");
      e.preventDefault();
    }
  };
  const removeTag = (tagToRemove) => {
    setTagsList(tagsList.filter((tag) => tag !== tagToRemove));
  };
  // 從後端返回的初始數據中獲取舊圖片 URL
  const oldImageUrl = initialData?.img_url
    ? `http://localhost:3005${initialData.img_url}`
    : "http://localhost:3005/uploads/article/no_is_main.png";

  // 處理封面圖片選擇
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("只支持 JPG 和 PNG 格式的圖片");
      return;
    }

    // 檢查圖片大小（假設限制為 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("圖片大小不能超過 5MB");
      return;
    }

    // 設置新的封面圖片
    setCoverImage(file);

    // 使用 FileReader 加載圖片並更新預覽
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result); // 更新預覽圖片
    };
    reader.readAsDataURL(file);
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title || ""); // 確保 title 不是 undefined
    formData.append("content", content || ""); // 確保 content 不是 undefined
    formData.append("article_category_small_id", categorySmall || null); // 確保 categorySmall 不是 undefined
    formData.append("tags", JSON.stringify(tagsList || [])); // 確保 tagsList 不是 undefined
    formData.append("status", submitStatus || "draft"); // 確保 submitStatus 不是 undefined

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    onSave(formData, submitStatus); // 把狀態一併傳給父組件
  };
  return (
    <div className="create-form">
      <div className="article-controls-btn">
        <span className="create-title">編輯文章</span>
        <span className="btn" onClick={() => router.push("/article")}>
          <span className="btn-icon">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          返回列表
        </span>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* 封面圖片 */}
        <div className="secondaryTitle">上傳封面縮圖</div>
        <div className="image-upload-box">
          <label htmlFor="coverImage" className="upload-square">
          {previewImage ? (
  <img src={previewImage} alt="封面圖片預覽" />
) : (
  <img src={oldImageUrl} alt="舊封面圖片" />
)}

          </label>
          <input
            type="file"
            id="coverImage"
            className="form-control"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

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

        {/* 文章分類 */}
        <div className="secondaryTitle">文章分類</div>
        <div className="category-container">
          <select
            className="form-control category-big"
            value={categoryBig}
            onChange={(e) => setCategoryBig(e.target.value)}
            required
          >
            <option value="">請選擇大分類</option>
            {categoriesBig.map((category) => (
              <option
                key={category.big_category_id}
                value={category.big_category_id}
              >
                {category.big_category_name}
              </option>
            ))}
          </select>

          <select
            className="form-control category-small"
            value={categorySmall}
            onChange={(e) => setCategorySmall(e.target.value)}
            required
          >
            <option value="">請選擇小分類</option>
            {filteredSmallCategories.map((category) => (
              <option
                key={category.small_category_id}
                value={category.small_category_id}
              >
                {category.small_category_name}
              </option>
            ))}
          </select>
        </div>

        {/* 內容 (CKEditor) */}
        <div className="secondaryTitle">內容</div>
        <EditMyeditor value={content} onChange={(data) => setContent(data)} />

        {/* 標籤 */}
        <div className="secondaryTitle">標籤</div>
        <input
          type="text"
          className="form-control create-tag"
          placeholder="請輸入標籤內容，按 Enter 即可新增"
          value={newTag}
          onChange={handleTagInput}
          onKeyDown={addTag}
        />
        <div>
          {tagsList.map((tag, index) => (
            <span key={index} className="new-tag">
              #{tag}{" "}
              <button
                type="button"
                className="close-tag-btn"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* 按鈕 */}
        <div className="btnarea">
          <button
            type="submit"
            className="btn article-create-btn"
            onClick={() => setSubmitStatus("draft")}
          >
            儲存草稿
          </button>
          <button
            type="submit"
            className="btn article-create-btn"
            onClick={() => setSubmitStatus("published")}
          >
            發表文章
          </button>
        </div>
      </form>
    </div>
  );
};

export default Edit;
