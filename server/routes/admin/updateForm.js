// adminRoutes.js - Fix the file handling logic

import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { pool } from "../../config/mysql.js";
import { checkToken } from "../../middleware/auth.js";

// 建立路由器
const router = express.Router();

// 設定檔案上傳目錄和命名規則
const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

// 確保上傳目錄存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created directory: ${uploadDir}`);
}

// 設定 multer 儲存設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Saving file to: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用用戶 ID 和時間戳命名，確保唯一
    const userId = req.decoded.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `user_${userId}_${timestamp}${ext}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  },
});

// 檔案類型過濾
const fileFilter = (req, file, cb) => {
  // 只接受圖片類型
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("只允許上傳圖片檔案"), false);
  }
};

// 設定 multer 上傳
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制 5MB
  },
});

// 獲取會員資料 API - 修改頭像路徑處理
router.get("/user", checkToken, async (req, res) => {
  const { id } = req.decoded;
  console.log("獲取用戶資料，ID:", id);
  try {
    // 查詢使用者詳細資料（略過密碼欄位）
    const sql =
      "SELECT id, name, email, phone, head as avatar, level_id as level FROM `users` WHERE id = ?";
    const [rows] = await pool.execute(sql, [id]);

    // 如果找不到使用者，回傳錯誤
    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到使用者資料",
      });
    }

    // 查詢用戶的登入方式
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [id]
    );

    // 如果 avatar 是檔案路徑，轉換為完整 URL
    let userData = { ...rows[0] };
    if (userData.avatar && !userData.avatar.startsWith("data:")) {
      // 確保使用正確的路徑格式 - 一律使用 /uploads/avatars/
      userData.avatar = `/uploads/avatars/${userData.avatar}`;
      console.log("用戶頭像路徑:", userData.avatar);
    }

    // 回傳使用者資料，包含登入方式
    res.status(200).json({
      status: "success",
      data: {
        ...userData,
        providers: providers.map((p) => p.provider),
      },
      message: "獲取使用者資料成功",
    });
  } catch (err) {
    console.error("取得使用者資料錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "取得使用者資料失敗",
    });
  }
});

// 更新會員資料 API - 使用 multer 處理檔案上傳
router.put("/user", checkToken, upload.single("avatar"), async (req, res) => {
  const { id } = req.decoded;
  const { name, email, password, phone } = req.body;
  const avatarFile = req.file;

  console.log("收到更新請求:", {
    userId: id,
    name,
    email,
    hasPassword: !!password,
    phone,
    hasAvatar: !!avatarFile,
  });

  if (avatarFile) {
    console.log("接收到頭像檔案:", avatarFile.filename);
  }

  try {
    // 開始一個事務 (transaction)
    await pool.query("START TRANSACTION");

    // 獲取用戶當前資料
    const [currentUser] = await pool.execute(
      "SELECT email, head FROM users WHERE id = ?",
      [id]
    );

    if (currentUser.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "error",
        message: "找不到使用者資料",
      });
    }

    const currentEmail = currentUser[0].email;
    const currentAvatar = currentUser[0].head;

    // 查詢用戶的登入方式
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [id]
    );

    const usesEmailLogin = providers.some((p) => p.provider === "email");

    // 如果用戶要修改 email 且使用 email 登入，需要檢查新 email 是否已被使用
    if (email && email !== currentEmail) {
      // 檢查新 email 是否已被其他用戶使用
      const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );

      if (existingUsers.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(409).json({
          status: "error",
          message: "此電子郵件已被其他用戶使用",
        });
      }
    }

    // 準備更新數據
    let updateFields = [];
    let values = [];

    // 添加需要更新的欄位
    if (name) {
      updateFields.push("name = ?");
      values.push(name);
    }

    if (email) {
      updateFields.push("email = ?");
      values.push(email);
    }

    if (phone) {
      updateFields.push("phone = ?");
      values.push(phone);
    }

    // 處理頭像檔案
    if (avatarFile) {
      updateFields.push("head = ?");
      values.push(avatarFile.filename);
      console.log("更新頭像為:", avatarFile.filename);

      // 如果有舊頭像且不是 base64 格式，刪除舊檔案
      if (currentAvatar && !currentAvatar.startsWith("data:")) {
        const oldFilePath = path.join(uploadDir, currentAvatar);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log("刪除舊頭像:", oldFilePath);
        }
      }
    }

    // 如果提供了新密碼，則加密後更新
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    // 如果沒有任何欄位需要更新，則返回成功
    if (updateFields.length === 0) {
      await pool.query("COMMIT");
      return res.status(200).json({
        status: "success",
        message: "資料保持不變",
      });
    }

    // 添加 id 作為 WHERE 條件
    values.push(id);

    // 執行更新 users 表操作
    const sql = `UPDATE users SET ${updateFields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;

    console.log("執行的 SQL:", sql);
    console.log("SQL 參數:", values);

    const [result] = await pool.execute(sql, values);

    // 如果用戶修改了 email 且使用 email 登入，同時更新 user_providers 表
    if (email && email !== currentEmail && usesEmailLogin) {
      await pool.execute(
        "UPDATE user_providers SET provider_id = ? WHERE user_id = ? AND provider = 'email'",
        [email, id]
      );
      console.log("已更新 user_providers 表中的 email 登入記錄");
    }

    // 提交事務
    await pool.query("COMMIT");

    // 檢查是否成功更新
    if (result.affectedRows > 0) {
      res.status(200).json({
        status: "success",
        message: "會員資料更新成功",
      });
    } else {
      res.status(404).json({
        status: "error",
        message: "找不到會員資料",
      });
    }
  } catch (err) {
    // 發生錯誤時回滾事務
    await pool.query("ROLLBACK");
    console.error("更新會員資料錯誤:", err);

    // 處理電子郵件衝突的情況
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "此電子郵件已被使用",
      });
    }

    res.status(500).json({
      status: "error",
      message: "更新會員資料失敗: " + err.message,
    });
  }
});

export default router;
