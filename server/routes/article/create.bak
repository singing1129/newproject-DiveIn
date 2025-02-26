  import express from "express";
  import multer from "multer"; // 继续使用 multer
  import fs from "fs";
  import path from "path";
  import Article from "../../article/models/article.js";
  import { v4 as uuidv4 } from "uuid";
  import { pool } from "../../config/mysql.js";
  import { db } from "../../config/articleDb.js";

  const router = express.Router();

  // Multer 設定 設定上傳檔案儲存
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "server/public/uploads/article/"); // 設定正確的儲存路徑
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  // 限制文件格式
  const fileFilter = (req, file, cb) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/gif"]);
    cb(null, allowedTypes.has(file.mimetype));
  };

  // 設定 multer 上傳
  const upload = multer({ storage, fileFilter });

  // 文章創建 API 路由
  router.post("/", upload.single("new_coverImage"), async (req, res) => {
    const {
      new_title,
      new_content,
      new_categorySmall,
      new_tags,
      new_status = 1, // 預設狀態為已發表
    } = req.body;

    const coverImagePath = req.file ? `/uploads/${req.file.filename}` : null;
    console.log("🔍 接收到的请求数据:", req.body);

    try {
      // 檢查必要的字段
      if (!new_title || !new_content || !new_categorySmall || !new_tags) {
        return res.status(400).json({ message: "所有字段都是必需的！" });
      }

      // 插入文章資料
      const [articleResult] = await pool.query(
        "INSERT INTO article (title, content, article_category_small_id, users_id, status, cover_image) VALUES (?, ?, ?, ?, ?, ?)",
        [
          new_title,
          new_content,
          new_categorySmall,
          // new_users_id,
          new_status,
          coverImagePath,
        ]
      );
      const articleId = articleResult.insertId;

      // 插入並關聯標籤
      const tagArray = JSON.parse(new_tags);
      for (let tag of tagArray) {
        const [existingTag] = await pool.query(
          "SELECT id FROM article_tag_small WHERE tag_name = ?",
          [tag]
        );
        let tagId;

        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const [tagResult] = await pool.query(
            "INSERT INTO article_tag_small (tag_name) VALUES (?)",
            [tag]
          );
          tagId = tagResult.insertId;
        }

        // 關聯標籤與文章
        await pool.query(
          "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
          [articleId, tagId]
        );
      }

      res.status(200).json({ message: "文章創建成功！", articleId });
    } catch (error) {
      console.error("❌ 文章創建失敗：", error);
      res.status(500).json({ message: "創建文章時發生錯誤" });
    }
  });

  // 處理文章封面圖片上傳
  router.post("/upload-image", upload.single("coverImage"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "請選擇圖片" });
    }

    const imageUrl = `/uploads/article/${req.file.filename}`;
    console.log("🔍 接收到的请求数据:", req.body); // 打印请求数据
    res.status(200).json({ success: true, imageUrl });
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
    let coverImagePath = req.file ? `/uploads/${req.file.filename}` : null;

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
          const [oldCover] = await pool.query(
            "SELECT cover_image FROM article WHERE id = ?",
            [articleId]
          );
          return oldCover.length > 0 ? oldCover[0].cover_image : null;
        }
        return coverImagePath;
      }

      // 更新文章資料
      await pool.query(
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
      await pool.query("DELETE FROM article_tag_big WHERE article_id = ?", [
        articleId,
      ]);

      // 重新關聯標籤
      const tagArray = JSON.parse(new_tags);
      for (let tag of tagArray) {
        const [existingTag] = await pool.query(
          "SELECT id FROM article_tag_small WHERE tag_name = ?",
          [tag]
        );
        let tagId;

        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const [tagResult] = await pool.query(
            "INSERT INTO article_tag_small (tag_name) VALUES (?)",
            [tag]
          );
          tagId = tagResult.insertId;
        }

        // 關聯標籤與文章
        await pool.query(
          "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
          [articleId, tagId]
        );
      }

      res.status(200).json({ message: "文章更新成功！", articleId });
    } catch (error) {
      console.error("❌ 文章更新失敗：", error);
      res.status(500).json({ message: "更新文章時發生錯誤" });
    }
  });

  // 草稿儲存 API
  router.post("/save-draft", async (req, res) => {
    const {
      new_title,
      new_content,
      new_article_category_small_id,
      new_tags,
    } = req.body;
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
      const [draftResult] = await pool.query(
        'INSERT INTO article (title, content, article_category_small_id, status) VALUES (?, ?, ?, "draft")',
        [new_title, new_content, new_article_category_small_id]
      );
      const draftId = draftResult.insertId;

      // 插入並關聯標籤
      const tagArray = JSON.parse(new_tags);
      for (let tag of tagArray) {
        const [tagResult] = await pool.query(
          "INSERT IGNORE INTO article_tag_small (tag_name) VALUES (?)",
          [tag]
        );
        const tagId = tagResult.insertId;

        // 關聯標籤與草稿文章
        await pool.query(
          "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
          [draftId, tagId]
        );
      }

      res.status(200).json({ message: "草稿儲存成功！", draftId });
    } catch (error) {
      console.error("❌ 草稿儲存失敗：", error);
      res.status(500).json({ message: "儲存草稿時發生錯誤" });
    }
  });

  // 新建文章所需分類與標籤資料 API (GET)
  router.get("/data", async (req, res) => {
    try {
      // 取得分類
      const [category_big] = await pool.query(
        "SELECT id, name FROM article_category_big"
      );
      const [category_small] = await pool.query(
        "SELECT name, category_big_id FROM article_category_small"
      );

      // 取得標籤
      const [tags] = await pool.query(
        "SELECT id, tag_name FROM article_tag_small"
      );

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

  export default router;
