import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../../config/articleDb.js";

const router = express.Router();

// 計算 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer 設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "article");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/gif"]);
  cb(null, allowedTypes.has(file.mimetype));
};

const upload = multer({ storage, fileFilter });

// 文章創建 API 路由
router.post("/create", upload.single("new_coverImage"), async (req, res) => {
  console.log("req.body:", req.body); // 調試：打印非文件字段
  console.log("req.file:", req.file); // 調試：打印文件字段

  const {
    new_title,
    new_content,
    new_categorySmall,
    new_tags,
    status = "draft",
  } = req.body;

  const coverImagePath = req.file
    ? `/uploads/article/${req.file.filename}`
    : null;
  const currentDate = new Date();

  // 檢查必要的字段
  if (!new_title || !new_content || !new_categorySmall || !new_tags) {
    return res.status(400).json({ message: "所有字段都是必需的！" });
  }

  try {
    // 插入文章資料
    const userId = 1; // 假設用戶 ID 為 1
    const { results: articleResult } = await db.query(
      "INSERT INTO article (title, content, article_category_small_id, users_id, status, created_at, publish_at, view_count, reply_count, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        new_title,
        new_content,
        new_categorySmall,
        userId,
        status,
        currentDate,
        status === "published" ? currentDate : null,
        0,
        0,
        0,
      ]
    );

    // 調試：檢查插入文章的返回值
    console.log("articleResult:", articleResult);
    if (!articleResult || articleResult.insertId === 0) {
      throw new Error("無法獲取文章 ID");
    }
    const articleId = articleResult.insertId;

    // 插入封面圖片資料
    if (coverImagePath) {
      await db.query(
        "INSERT INTO article_image (article_id, img_url, is_main) VALUES (?, ?, ?)",
        [articleId, coverImagePath, 0]
      );
    }

    // 處理標籤
    let tagArray;
    try {
      tagArray = JSON.parse(new_tags);
    } catch (error) {
      console.error("new_tags 解析失敗：", new_tags);
      return res.status(400).json({ message: "標籤格式錯誤" });
    }

    console.log("tagArray:", tagArray); // 調試：打印解析後的標籤數組

    // 檢查 tagArray 是否為數組
    if (!Array.isArray(tagArray)) {
      console.error("new_tags 不是有效的數組：", new_tags);
      return res.status(400).json({ message: "標籤格式錯誤" });
    }

    for (let tag of tagArray) {
      // 檢查標籤是否已存在
      const [existingTag] = await db.query(
        "SELECT id FROM article_tag_small WHERE tag_name = ?",
        [tag]
      );
      console.log("existingTag:", existingTag); // 調試：打印查詢結果

      if (!Array.isArray(existingTag)) {
        throw new Error("資料庫查詢返回值格式錯誤");
      }

      let tagId;
      if (existingTag.length > 0) {
        tagId = existingTag[0].id;
      } else {
        // 插入新標籤
        const { results: tagResult } = await db.query(
          "INSERT INTO article_tag_small (tag_name) VALUES (?)",
          [tag]
        );
        tagId = tagResult.insertId;
      }

      // 關聯標籤與文章
      await db.query(
        "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
        [articleId, tagId]
      );
    }

    res
      .status(200)
      .json({ success: true, message: "文章創建成功！", articleId });
  } catch (error) {
    console.error("❌ 文章創建失敗：", error);
    res.status(500).json({ success: false, message: "創建文章時發生錯誤" });
  }
});

// 處理文章封面圖片上傳
router.post("/upload-image", upload.single("coverImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "請選擇圖片" });
  }

  const imageUrl = `/uploads/article/${req.file.filename}`;

  try {
    // 將圖片信息存儲到 article_image 資料表
    const { results } = await db.query(
      "INSERT INTO article_image (img_url, is_main) VALUES (?, ?)",
      [imageUrl, 1] // is_main 設為 1
    );

    res.status(200).json({
      success: true,
      imageUrl,
      imageId: results.insertId, // 可選：返回圖片的 ID
    });
  } catch (error) {
    console.error("❌ 封面圖片上傳失敗：", error);
    res.status(500).json({ success: false, message: "封面圖片上傳失敗" });
  }
});

// 新增 CKEditor 圖片上傳路由
router.post("/upload", upload.single("articleImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "請選擇圖片" });
  }

  const imageUrl = `/uploads/article/${req.file.filename}`;

  try {
    // 將圖片信息存儲到 article_image 資料表
    const { results } = await db.query(
      "INSERT INTO article_image (img_url, is_main) VALUES (?, ?)",
      [imageUrl, 0] // is_main 設為 0
    );

    res.status(200).json({
      success: true,
      url: imageUrl, // CKEditor 需要的返回格式
      imageId: results.insertId, // 可選：返回圖片的 ID
    });
  } catch (error) {
    console.error("❌ 圖片上傳失敗：", error);
    res.status(500).json({ success: false, message: "圖片上傳失敗" });
  }
});

// 更新文章 API
router.put("/update/:id", upload.single("cover_image"), async (req, res) => {
  const articleId = req.params.id;
  const {
    new_title,
    new_content,
    new_article_category_small_id,
    new_status,
    new_tags,
  } = req.body;
  let coverImagePath = req.file
    ? `/uploads/article/${req.file.filename}`
    : null;

  try {
    // 檢查必要的字段
    if (
      !new_title ||
      !new_content ||
      !new_article_category_small_id ||
      !new_tags
    ) {
      return res.status(400).json({ message: "所有字段都是必需的！" });
    }

    // 如果沒有新圖片，保留舊的圖片
    async function getCoverImagePath(articleId, coverImagePath) {
      if (!coverImagePath) {
        const [oldCover] = await db.query(
          "SELECT cover_image FROM article WHERE id = ?",
          [articleId]
        );
        return oldCover.length > 0 ? oldCover[0].cover_image : null;
      }
      return coverImagePath;
    }

    // 更新文章資料
    await db.query(
      "UPDATE article SET title = ?, content = ?, article_category_small_id = ?, status = ?, cover_image = ? WHERE id = ?",
      [
        new_title,
        new_content,
        new_article_category_small_id,
        new_status,
        coverImagePath,
        articleId,
      ]
    );

    // 刪除舊的標籤關聯
    await db.query("DELETE FROM article_tag_big WHERE article_id = ?", [
      articleId,
    ]);

    // 重新關聯標籤
    const tagArray = JSON.parse(new_tags);
    for (let tag of tagArray) {
      const [existingTag] = await db.query(
        "SELECT id FROM article_tag_small WHERE tag_name = ?",
        [tag]
      );
      let tagId;

      if (existingTag.length > 0) {
        tagId = existingTag[0].id;
      } else {
        const [tagResult] = await db.query(
          "INSERT INTO article_tag_small (tag_name) VALUES (?)",
          [tag]
        );
        tagId = tagResult.insertId;
      }

      // 關聯標籤與文章
      await db.query(
        "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
        [articleId, tagId]
      );
    }

    res
      .status(200)
      .json({ success: true, message: "文章更新成功！", articleId });
  } catch (error) {
    console.error("❌ 文章更新失敗：", error);
    res.status(500).json({ success: false, message: "更新文章時發生錯誤" });
  }
});

// 草稿儲存 API
router.post("/save-draft", async (req, res) => {
  const { new_title, new_content, new_article_category_small_id, new_tags } =
    req.body;
  console.log("🔍 接收到的请求数据:", req.body); // 打印请求数据
  try {
    // 檢查必要的字段
    if (
      !new_title ||
      !new_content ||
      !new_article_category_small_id ||
      !new_tags
    ) {
      return res.status(400).json({ message: "所有字段都是必需的！" });
    }

    // 插入草稿資料
    const [draftResult] = await db.query(
      'INSERT INTO article (title, content, article_category_small_id, status) VALUES (?, ?, ?, "draft")',
      [new_title, new_content, new_article_category_small_id]
    );
    const draftId = draftResult.insertId;

    // 插入並關聯標籤
    const tagArray = JSON.parse(new_tags);
    for (let tag of tagArray) {
      const [tagResult] = await db.query(
        "INSERT IGNORE INTO article_tag_small (tag_name) VALUES (?)",
        [tag]
      );
      const tagId = tagResult.insertId;

      // 關聯標籤與草稿文章
      await db.query(
        "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
        [draftId, tagId]
      );
    }

    res.status(200).json({ success: true, message: "草稿儲存成功！", draftId });
  } catch (error) {
    console.error("❌ 草稿儲存失敗：", error);
    res.status(500).json({ success: false, message: "儲存草稿時發生錯誤" });
  }
});

// 新建文章所需分類與標籤資料 API (GET)
router.get("/data", async (req, res) => {
  try {
    // 取得分類
    const { category_big, category_small } = await db.getCategories();

    // 取得標籤
    const tags = await db.getTags();

    res.status(200).json({
      success: true,
      category_big,
      category_small,
      tags,
    });
  } catch (error) {
    console.error("❌ 無法獲取分類與標籤：", error);
    res.status(500).json({ success: false, message: "獲取資料失敗" });
  }
});

// 測試路由
router.get("/create", (req, res) => {
  res.send("這是文章創建頁面");
});

export default router;
