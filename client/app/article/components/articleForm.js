import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import "./articleCreate.css";
import Myeditor from "../components/Myeditor";

const ArticleForm = () => {
  const router = useRouter();
  const [new_title, setTitle] = useState("");
  const [new_content, setContent] = useState("");
  const [new_categoryBig, setCategoryBig] = useState("");
  const [new_categorySmall, setCategorySmall] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tagsList, setTagsList] = useState([]);
  const [new_coverImage, setCoverImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(""); // "draft" 或 "published"

  // 按鈕點擊事件，跳轉不同頁面
  const handleButtonClick = (path) => {
    router.push(path);
  };

  // 新增的狀態
  const [categoriesBig, setCategoriesBig] = useState([]); // 大分類
  const [categoriesSmall, setCategoriesSmall] = useState([]); // 小分類全部資料
  const [filteredSmallCategories, setFilteredSmallCategories] = useState([]); // 篩選後的小分類
  const [tags, setTags] = useState([]); // 標籤

  // 取得分類與標籤
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
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error("❌ 取得分類與標籤失敗：", error);
      }
    };
    getCategoriesAndTags();
  }, []);

  // 當選擇大分類時，更新對應的小分類
  useEffect(() => {
    if (new_categoryBig) {
      const filtered = categoriesSmall.filter(
        (item) => item.category_big_id === parseInt(new_categoryBig)
      );
      setFilteredSmallCategories(filtered);
      setCategorySmall(""); // 重置小分類選擇
    } else {
      setFilteredSmallCategories([]);
    }
  }, [new_categoryBig, categoriesSmall]);

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

  // 處理封面圖片選擇
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submitStatus) {
      alert("請選擇儲存草稿或發表文章");
      return;
    }

    // 在這裡打印 tagsList，檢查標籤數據
    console.log("tagsList:", tagsList);

    const formData = new FormData();
    formData.append("new_title", new_title);
    formData.append("new_content", new_content);
    formData.append("new_categorySmall", new_categorySmall);
    formData.append("new_tags", JSON.stringify(tagsList));
    formData.append("status", submitStatus);
    if (new_coverImage) formData.append("new_coverImage", new_coverImage);

    try {
      const response = await fetch("http://localhost:3005/api/article/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("請求失敗");
      }

      const data = await response.json();
      if (data.success) {
        alert(submitStatus === "draft" ? "草稿儲存成功！" : "文章發表成功！");

        // ✅ 確保瀏覽器環境加載後才執行 router.push
        setTimeout(() => {
          router.push("/article");
        }, 500);
      } else {
        alert("發表失敗：" + (data.message || "請稍後再試"));
      }
    } catch (error) {
      console.error("❌ 發送請求錯誤：", error);
      alert("提交錯誤，請稍後再試！");
    }
  };

  return (
    <div className="create-form">
      <div className="article-controls-btn">
        <span className="create-title">發表新文章</span>
        <span className="btn" onClick={() => handleButtonClick("/article")}>
          <span className="btn-icon">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          返回列表
        </span>
        <span className="btn">
          {/* onClick={() => handleButtonClick("/article/mine")} */}
          <span className="btn-icon">
            <i className="fa-solid fa-bookmark"></i>
          </span>
          我的文章
        </span>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* 封面圖片 */}
        <div className="secondaryTitle">上傳封面縮圖</div>
        <div className="image-upload-box">
          <label htmlFor="new_coverImage" className="upload-square">
            {previewImage ? (
              <img src={previewImage} alt="封面預覽" className="upload-image" />
            ) : (
              <span>請選擇圖片</span>
            )}
          </label>

          <input
            type="file"
            id="new_coverImage"
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
          value={new_title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* 文章分類 */}
        <div className="secondaryTitle">文章分類</div>
        <div className="category-container">
          {/* 大分類 */}
          <select
            className="form-control category-big"
            value={new_categoryBig}
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

          {/* 小分類 */}
          <select
            className="form-control category-small"
            value={new_categorySmall}
            onChange={(e) => setCategorySmall(e.target.value)}
            required
          >
            <option value="">請選擇小分類</option>
            {filteredSmallCategories.map((category, index) => (
              <option key={index} value={category.small_category_id}>
                {category.small_category_name}
              </option>
            ))}
          </select>
        </div>

        {/* 內容 (CKEditor) */}
        <div className="secondaryTitle">內容</div>
        <Myeditor
          name="new_content"
          value={new_content}
          editorLoaded={true}
          onChange={(data) => setContent(data)}
        />

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

export default ArticleForm;
