import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../config/articleDb.js";

const router = express.Router();

// multer 設置
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

const upload = multer({ storage });

// CKEditor 臨時文件上傳路由
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const tempUpload = multer({ storage: tempStorage });

router.post(
  "/upload-ckeditor-image-temp",
  tempUpload.single("articleImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "未接收到圖片文件" });
      }

      const tempImageUrl = `/uploads/temp/${req.file.filename}`;
      res.status(200).json({ success: true, url: tempImageUrl });
    } catch (error) {
      console.error("❌ 臨時圖片上傳失敗：", error);
      res.status(500).json({ success: false, message: "臨時圖片上傳失敗" });
    }
  }
);

// 處理標籤的函式（與 create.js 一致）
const handleTags = async (tags, articleId) => {
  if (!Array.isArray(tags)) {
    throw new Error("標籤格式錯誤：標籤應為陣列");
  }

  try {
    for (let tag of tags) {
      // 檢查標籤是否存在
      const { results: existingTag } = await db.query(
        "SELECT id FROM article_tag_small WHERE tag_name = ?",
        [tag]
      );

      let tagId;
      if (existingTag && existingTag.length > 0) {
        tagId = existingTag[0].id; // 使用現有標籤的 ID
      } else {
        // 插入新標籤
        const { results: tagResult } = await db.query(
          "INSERT INTO article_tag_small (tag_name) VALUES (?)",
          [tag]
        );
        if (!tagResult || !tagResult.insertId) {
          throw new Error("標籤插入失敗");
        }
        tagId = tagResult.insertId; // 獲取新插入標籤的 ID
      }

      // 將標籤與文章關聯
      await db.query(
        "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
        [articleId, tagId]
      );
    }
  } catch (error) {
    console.error("❌ 處理標籤時發生錯誤：", error);
    throw error;
  }
};

// 更新文章 API
router.put("/:id", upload.single("coverImage"), async (req, res) => {
  const { id } = req.params;
  let { title, content, article_category_small_id, tags, status, ckeditor_images } =
    req.body;

  try {
    // 解析 tags 為陣列（與 create.js 一致）
    if (typeof tags === "string") {
      tags = JSON.parse(tags);
    }
    if (!Array.isArray(tags)) {
      throw new Error("標籤應為 JSON 陣列");
    }

    // 解析 CKEditor 圖片 URL
    const ckeditorImages = JSON.parse(ckeditor_images || "[]");

    // 更新文章基本資訊
    await db.query(
      `UPDATE article 
      SET title = ?, content = ?, article_category_small_id = ?, status = ?, updated_at = NOW() 
      WHERE id = ?`,
      [title, content, article_category_small_id, status || "draft", id]
    );

    // 處理 CKEditor 圖片
    if (ckeditorImages.length > 0) {
      let updatedContent = content;

      for (const tempImageUrl of ckeditorImages) {
        const tempImagePath = path.join(process.cwd(), "public", tempImageUrl);
        const finalImagePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          "article",
          path.basename(tempImageUrl)
        );

        // 將圖片從臨時目錄移動到正式目錄
        fs.renameSync(tempImagePath, finalImagePath);

        // 插入圖片資料
        const finalImageUrl = `/uploads/article/${path.basename(tempImageUrl)}`;
        await db.insertImage(id, finalImageUrl, 0);

        // 更新文章內容中的圖片 URL
        updatedContent = updatedContent.replace(tempImageUrl, finalImageUrl);
      }

      // 更新文章內容中的圖片 URL
      await db.query("UPDATE article SET content = ? WHERE id = ?", [
        updatedContent,
        id,
      ]);
    }

    // 處理封面圖片
    if (req.file) {
      const coverImagePath = `/uploads/article/${req.file.filename}`;
      const { results: existingCover } = await db.query(
        "SELECT id FROM article_image WHERE article_id = ? AND is_main = 1",
        [id]
      );
      if (existingCover && existingCover.length > 0) {
        await db.query(
          "UPDATE article_image SET img_url = ? WHERE article_id = ? AND is_main = 1",
          [coverImagePath, id]
        );
      } else {
        await db.insertImage(id, coverImagePath, 1);
      }
    }

    // 刪除舊標籤
    await db.query("DELETE FROM article_tag_big WHERE article_id = ?", [id]);

    // 插入新標籤（使用與 create.js 相同的邏輯）
    if (tags && tags.length > 0) {
      await handleTags(tags, id);
    }

    res.json({
      status: "success",
      message: "文章已成功更新",
    });
  } catch (error) {
    console.error("❌ 更新文章失敗：", error);
    res.status(500).json({
      status: "error",
      message: "更新文章失敗",
      error: error.message,
    });
  }
});

export default router;