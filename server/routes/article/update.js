import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../config/articleDb.js";

const router = express.Router();

// multer设置
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

// CKEditor临时文件上传路由
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

// CKEditor临时图片上传路由
router.post("/upload-ckeditor-image-temp", tempUpload.single("articleImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "未接收到图片文件" });
    }

    const tempImageUrl = `/uploads/temp/${req.file.filename}`;
    res.status(200).json({ success: true, url: tempImageUrl });
  } catch (error) {
    console.error("❌ 临时图片上传失败：", error);
    res.status(500).json({ success: false, message: "临时图片上传失败" });
  }
});

// 更新文章 API
router.put("/:id", upload.single("coverImage"), async (req, res) => {
  const { id } = req.params;
  const { title, content, article_category_small_id, tags, status, ckeditor_images } = req.body;

  try {
    // 解析CKEditor图片 URL
    const ckeditorImages = JSON.parse(ckeditor_images || "[]");

    // 更新文章基本信息
    await db.query(
      `UPDATE article 
      SET title = ?, content = ?, article_category_small_id = ?, status = ?, updated_at = NOW() 
      WHERE id = ?`,
      [title, content, article_category_small_id, status || "draft", id]
    );

    // 处理CKEditor图片
    if (ckeditorImages.length > 0) {
      let updatedContent = content;

      for (const tempImageUrl of ckeditorImages) {
        const tempImagePath = path.join(process.cwd(), "public", tempImageUrl);
        const finalImagePath = path.join(process.cwd(), "public", "uploads", "article", path.basename(tempImageUrl));

        // 将图片从临时目录移动到正式目录
        fs.renameSync(tempImagePath, finalImagePath);

        // 插入图片数据
        const finalImageUrl = `/uploads/article/${path.basename(tempImageUrl)}`;
        await db.insertImage(id, finalImageUrl, 0);

        // 更新文章内容中的图片 URL
        updatedContent = updatedContent.replace(tempImageUrl, finalImageUrl);
      }

      // 更新文章内容中的图片 URL
      await db.query("UPDATE article SET content = ? WHERE id = ?", [updatedContent, id]);
    }

    // 处理封面图片
    if (req.file) {
      const coverImagePath = `/uploads/article/${req.file.filename}`;
      await db.query(
        "UPDATE article_image SET img_url = ? WHERE article_id = ? AND is_main = 1",
        [coverImagePath, id]
      );
    }

    // 删除旧标签
    await db.query("DELETE FROM article_tag_big WHERE article_id = ?", [id]);

    // 插入新标签
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await db.query(
          "INSERT INTO article_tag_big (article_id, article_tag_small_id) SELECT ?, id FROM article_tag_small WHERE tag_name = ?",
          [id, tag]
        );
      }
    }

    res.json({
      status: "success",
      message: "文章已成功更新",
    });
  } catch (error) {
    console.error("❌ 更新文章失败：", error);
    res.status(500).json({
      status: "error",
      message: "更新文章失败",
      error: error.message,
    });
  }
});

export default router;
