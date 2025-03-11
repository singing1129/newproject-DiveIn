"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import EditMyeditor from "./editMyeditor";
import "./articleCreate.css";
import InteractiveButton from "../components/InteractiveButton"; // 假設路徑相同

const API_URL = "http://localhost:3005";

const Edit = ({ initialData = {}, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryBig, setCategoryBig] = useState("");
  const [categorySmall, setCategorySmall] = useState(
    initialData?.article_category_small_id || ""
  );
  const [newTag, setNewTag] = useState("");
  const [tagsList, setTagsList] = useState(initialData?.tags || []);
  const [coverImage, setCoverImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");

  const [categoriesBig, setCategoriesBig] = useState([]);
  const [categoriesSmall, setCategoriesSmall] = useState([]);
  const [filteredSmallCategories, setFilteredSmallCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // 計算按鈕是否應該禁用
  const isDisabled = !title.trim() || !content.trim() || !categorySmall;

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

          if (initialData?.article_category_small_id) {
            const smallCategory = data.category_small.find(
              (item) =>
                item.small_category_id === initialData.article_category_small_id
            );
            if (smallCategory) {
              setCategoryBig(smallCategory.category_big_id);
              setCategorySmall(smallCategory.small_category_id);
              const filtered = data.category_small.filter(
                (item) => item.category_big_id === smallCategory.category_big_id
              );
              setFilteredSmallCategories(filtered);
            }
          }

          setTags(data.tags || []);
        }
      } catch (error) {
        console.error("❌ 取得分類與標籤失敗：", error);
      }
    };
    getCategoriesAndTags();
  }, [initialData]);

  useEffect(() => {
    if (categoryBig) {
      const filtered = categoriesSmall.filter(
        (item) => item.category_big_id === parseInt(categoryBig)
      );
      setFilteredSmallCategories(filtered);
      if (
        !filtered.some(
          (item) => item.small_category_id === parseInt(categorySmall)
        )
      ) {
        setCategorySmall("");
      }
    } else {
      setFilteredSmallCategories([]);
      setCategorySmall("");
    }
  }, [categoryBig, categoriesSmall]);

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

  const oldImageUrl = initialData?.img_url
    ? `http://localhost:3005${initialData.img_url}`
    : "http://localhost:3005/uploads/article/no_is_main.png";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("只支持 JPG 和 PNG 格式的圖片");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("圖片大小不能超過 5MB");
      return;
    }

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title || "");
    formData.append("content", content || "");
    formData.append("article_category_small_id", categorySmall || "");
    formData.append("tags", JSON.stringify(tagsList || []));
    formData.append("status", submitStatus || "draft");

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    onSave(formData, submitStatus);
  };

  const router = useRouter();

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

        <div className="secondaryTitle">標題</div>
        <input
          type="text"
          className="form-control"
          placeholder="限 60 個中英字母"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

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

        <div className="secondaryTitle">內容</div>
        <EditMyeditor value={content} onChange={(data) => setContent(data)} />

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

        <div className="btnarea">
          <InteractiveButton
            onClick={() => setSubmitStatus("draft")}
            disabled={isDisabled}
            rubbing="請填寫完整內容"
          >
            儲存草稿
          </InteractiveButton>
          <InteractiveButton
            onClick={() => setSubmitStatus("published")}
            disabled={isDisabled}
            rubbing="請填寫完整內容"
          >
            發表文章
          </InteractiveButton>
        </div>
      </form>
    </div>
  );
};

export default Edit;