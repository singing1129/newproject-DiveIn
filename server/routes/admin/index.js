// userRoutes.js - 會員相關 API 路由
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../config/mysql.js";
import { checkToken } from "../../middleware/auth.js";
import path from "path";
import fs from "fs";

// 載入環境變數
dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY;

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
    const userId = req.headers.authorization
      ? jwt.verify(req.headers.authorization.split(" ")[1], secretKey).id
      : "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || ".jpg";
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
});

// 建立路由器
const router = express.Router();

// 使用者登出 API
router.post("/logout", checkToken, (req, res) => {
  // 直接返回成功訊息，前端會清除 token
  res.status(200).json({
    status: "success",
    message: "登出成功",
  });
});

// 使用者註冊 API
router.post("/register", upload.none(), async (req, res) => {
  // 從請求主體取得 email 和密碼
  const { email, password } = req.body;

  // 驗證是否提供了所需資料
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "請提供 Email 和密碼",
    });
  }

  try {
    // 檢查 email 是否已存在
    const checkSql = "SELECT * FROM `users` WHERE email = ?";
    const [existingUser] = await pool.execute(checkSql, [email]);

    // 如果 email 已存在，回傳錯誤
    if (existingUser.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "此 Email 已被註冊",
      });
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 儲存新使用者到資料庫
    const sql = "INSERT INTO `users` (`email`, `password`) VALUES (?, ?)";
    const [result] = await pool.execute(sql, [email, hashedPassword]);

    // 添加 email 提供者記錄
    await pool.execute(
      "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, 'email', ?, NOW())",
      [result.insertId, email]
    );

    // 回傳成功訊息
    res.status(201).json({
      status: "success",
      message: "註冊成功",
      data: { userId: result.insertId },
    });
  } catch (err) {
    console.error("註冊錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "註冊失敗，請稍後再試",
    });
  }
});

// 用戶狀態檢查 API (檢查用戶是否已登入)
router.post("/status", checkToken, async (req, res) => {
  const { decoded } = req;

  try {
    // 獲取該用戶的所有登入提供者
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [decoded.id]
    );

    // 生成新的 JWT Token，延長有效期，包含提供者資訊
    const token = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        providers: providers.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );

    console.log("🔍 檢查 decoded:", decoded);
    // 回傳成功訊息和更新後的 token
    res.status(200).json({
      status: "success",
      data: { token, providers: providers.map((p) => p.provider) },
      message: "狀態：登入中",
    });
  } catch (err) {
    console.error("狀態檢查錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "狀態檢查失敗",
    });
  }
});

// 改進的 social-login API，添加帳號連結支援
// 社交登入 API - 處理 Google、LINE 和手機登入，以及帳號連結
router.post("/social-login", upload.none(), async (req, res) => {
  console.log("收到社交登入請求");
  console.log("請求路徑:", req.path);
  console.log("請求方法:", req.method);
  console.log("請求頭:", req.headers);
  console.log("請求體:", req.body);

  try {
    // 1. 獲取並驗證請求參數
    const {
      email,
      name,
      image,
      provider,
      provider_id,
      link_to_user_id,
      stay_on_account_page,
      force_link,
    } = req.body;

    // 驗證必要參數
    if (!provider || !provider_id) {
      console.error("缺少必要參數:", { provider, provider_id });
      return res.status(400).json({
        status: "error",
        message: "缺少必要參數: provider 和 provider_id",
      });
    }

    // 2. 檢查是否為連結操作
    if (link_to_user_id) {
      console.log(`檢測到連結操作，連結到用戶ID: ${link_to_user_id}`);
      return await handleAccountLinking(
        res,
        provider,
        provider_id,
        link_to_user_id,
        email,
        name,
        image,
        force_link === "true" || force_link === true,
        stay_on_account_page === "true" || stay_on_account_page === true
      );
    }

    // 3. 如果不是連結操作，則進行正常的社交登入流程
    return await handleSocialLogin(
      res,
      provider,
      provider_id,
      email,
      name,
      image
    );
  } catch (err) {
    console.error("社交登入處理錯誤:", err);
    console.error("錯誤詳情:", {
      code: err.code,
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      status: "error",
      message: "社交登入處理失敗: " + err.message,
      error: err.message,
    });
  }
});

// 處理帳號連結
async function handleAccountLinking(
  res,
  provider,
  providerId,
  linkToUserId,
  email,
  name,
  image,
  forceLink = true, // 默認使用強制覆蓋
  stayOnAccountPage = false // 是否保持在會員中心頁面
) {
  try {
    console.log(`處理帳號連結: ${provider} 連結到用戶ID ${linkToUserId}`);
    console.log(`強制覆蓋: ${forceLink}`);
    console.log(`保持在會員中心頁面: ${stayOnAccountPage}`);

    // 1. 檢查用戶是否存在
    const [userRows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      linkToUserId,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "要連結的用戶不存在",
      });
    }

    // 2. 檢查提供者是否已經被其他用戶使用
    const [providerRows] = await pool.execute(
      "SELECT * FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );

    if (providerRows.length > 0 && providerRows[0].user_id != linkToUserId) {
      if (!forceLink) {
        return res.status(409).json({
          status: "error",
          message: "此登入方式已被其他帳號使用",
          conflictUserId: providerRows[0].user_id,
        });
      }

      // 如果強制覆蓋，則刪除現有的連結
      console.log(
        `強制覆蓋: 刪除用戶 ${providerRows[0].user_id} 的 ${provider} 連結`
      );
      await pool.execute(
        "DELETE FROM user_providers WHERE provider = ? AND provider_id = ?",
        [provider, providerId]
      );
    }

    // 3. 檢查用戶是否已經連結了此提供者
    const [existingProviderRows] = await pool.execute(
      "SELECT * FROM user_providers WHERE user_id = ? AND provider = ?",
      [linkToUserId, provider]
    );

    if (existingProviderRows.length > 0) {
      // 更新現有的連結
      console.log(`更新用戶 ${linkToUserId} 的 ${provider} 連結`);
      await pool.execute(
        "UPDATE user_providers SET provider_id = ? WHERE user_id = ? AND provider = ?",
        [providerId, linkToUserId, provider]
      );
    } else {
      // 新增連結
      console.log(`新增用戶 ${linkToUserId} 的 ${provider} 連結`);
      await pool.execute(
        "INSERT INTO user_providers (user_id, provider, provider_id) VALUES (?, ?, ?)",
        [linkToUserId, provider, providerId]
      );
    }

    // 4. 如果是 Google 或 LINE 登入，且用戶沒有自定義頭像，則更新頭像
    if ((provider === "google" || provider === "line") && image) {
      const [userHeadRows] = await pool.execute(
        "SELECT head, is_custom_head FROM users WHERE id = ?",
        [linkToUserId]
      );

      // 如果用戶沒有頭像或沒有自定義頭像，則更新頭像
      if (
        userHeadRows.length > 0 &&
        (!userHeadRows[0].head || userHeadRows[0].is_custom_head === 0)
      ) {
        console.log(`更新用戶 ${linkToUserId} 的頭像`);
        await pool.execute(
          "UPDATE users SET head = ?, is_custom_head = 0 WHERE id = ?",
          [image, linkToUserId]
        );
      }
    }

    // 5. 獲取用戶的所有登入方式
    const [updatedProviderRows] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [linkToUserId]
    );

    const providers = updatedProviderRows.map((row) => row.provider);

    // 6. 獲取用戶資料
    const [updatedUserRows] = await pool.execute(
      `SELECT u.*, 
              COALESCE(u.total_points, 0) as total_points,
              ul.level_name
       FROM users u
       LEFT JOIN users_level ul ON u.level_id = ul.id
       WHERE u.id = ?`,
      [linkToUserId]
    );

    const user = updatedUserRows[0];

    // 處理頭像路徑
    let headPath = user.head;
    if (user.is_custom_head === 1 && headPath) {
      // 自定義頭像，確保路徑正確
      if (!headPath.startsWith("http")) {
        headPath = `/uploads/user/${headPath}`;
      }
    }

    // 7. 生成 JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        head: headPath,
        is_custom_head: user.is_custom_head,
        level: user.level_id,
        level_name: user.level_name,
        total_points: user.total_points,
        providers: providers,
      },
      secretKey,
      { expiresIn: "30d" }
    );

    // 8. 返回成功訊息和 token
    return res.status(200).json({
      status: "success",
      message: `${getProviderDisplayName(provider)}帳號連結成功`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birthday: user.birthday,
          head: headPath,
          is_custom_head: user.is_custom_head,
          level: user.level_id,
          level_name: user.level_name,
          total_points: user.total_points,
          providers: providers,
        },
      },
      stayOnAccountPage: stayOnAccountPage,
    });
  } catch (err) {
    console.error("帳號連結處理錯誤:", err);
    console.error("錯誤詳情:", {
      code: err.code,
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      status: "error",
      message: "帳號連結處理失敗: " + err.message,
      error: err.message,
    });
  }
}

// 處理社交登入
async function handleSocialLogin(
  res,
  provider,
  providerId,
  email,
  name,
  image,
  link_to_user_id
) {
  try {
    console.log(`處理社交登入: ${provider}`);
    console.log("提供者ID:", providerId);
    console.log("電子郵件:", email);
    console.log("姓名:", name);
    console.log("頭像:", image ? "有" : "無");

    // 1. 檢查提供者是否已經被使用
    const [providerRows] = await pool.execute(
      "SELECT * FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );

    console.log("查詢提供者結果:", providerRows);

    if (providerRows.length > 0) {
      // 提供者已經被使用，獲取對應的用戶
      const userId = providerRows[0].user_id;
      console.log(`找到現有用戶: ${userId}`);

      // 獲取用戶資料
      const [userRows] = await pool.execute(
        `SELECT u.*, 
                COALESCE(u.total_points, 0) as total_points,
                ul.level_name
         FROM users u
         LEFT JOIN users_level ul ON u.level_id = ul.id
         WHERE u.id = ?`,
        [userId]
      );

      if (userRows.length === 0) {
        console.error(`用戶不存在: ${userId}`);
        return res.status(404).json({
          status: "error",
          message: "用戶不存在",
        });
      }

      const user = userRows[0];
      console.log("找到用戶:", user);

      // 獲取用戶的所有登入方式
      const [userProviderRows] = await pool.execute(
        "SELECT provider FROM user_providers WHERE user_id = ?",
        [userId]
      );

      const providers = userProviderRows.map((row) => row.provider);
      console.log("用戶的登入方式:", providers);

      // 處理頭像路徑
      let headPath = user.head;
      if (user.is_custom_head === 1 && headPath) {
        // 自定義頭像，確保路徑正確
        if (!headPath.startsWith("http")) {
          headPath = `/uploads/user/${headPath}`;
        }
      }

      // 如果是 Google 或 LINE 登入，且用戶沒有自定義頭像，則更新頭像
      if (
        (provider === "google" || provider === "line") &&
        image &&
        user.is_custom_head === 0
      ) {
        console.log(`更新用戶 ${userId} 的頭像`);
        await pool.execute("UPDATE users SET head = ? WHERE id = ?", [
          image,
          userId,
        ]);
        headPath = image;
      }

      // 生成 JWT token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birthday: user.birthday,
          head: headPath,
          is_custom_head: user.is_custom_head,
          level: user.level_id,
          level_name: user.level_name,
          total_points: user.total_points,
          providers: providers,
        },
        secretKey,
        { expiresIn: "30d" }
      );

      console.log("登入成功，生成token");
      return res.status(200).json({
        status: "success",
        message: "登入成功",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            birthday: user.birthday,
            head: headPath,
            is_custom_head: user.is_custom_head,
            level: user.level_id,
            level_name: user.level_name,
            total_points: user.total_points,
            providers: providers,
          },
        },
      });
    } else {
      // 提供者尚未被使用，創建新用戶
      console.log(`創建新用戶: ${provider}`);

      // 確保 email 不為空
      let userEmail = email;
      if (!userEmail && provider === "line") {
        userEmail = `${providerId}@line.temporary.email`;
      } else if (!userEmail) {
        userEmail = `${providerId}@${provider}.temporary.email`;
      }

      console.log("使用電子郵件:", userEmail);

      // 檢查 email 是否已被使用
      const [emailRows] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [userEmail]
      );

      console.log("檢查電子郵件是否已被使用:", emailRows.length > 0);

      let userId;

      if (emailRows.length > 0) {
        // email 已被使用，使用現有用戶
        userId = emailRows[0].id;
        console.log(`使用現有用戶 (email): ${userId}`);

        // 新增提供者連結
        await pool.execute(
          "INSERT INTO user_providers (user_id, provider, provider_id) VALUES (?, ?, ?)",
          [userId, provider, providerId]
        );
        console.log("新增提供者連結成功");
      } else {
        // 創建新用戶
        try {
          const [result] = await pool.execute(
            "INSERT INTO users (name, email, head, is_custom_head, level_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            [name || `${provider}用戶`, userEmail, image, image ? 0 : null, 1]
          );

          userId = result.insertId;
          console.log(`創建新用戶成功: ${userId}`);

          // 新增提供者連結
          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id) VALUES (?, ?, ?)",
            [userId, provider, providerId]
          );
          console.log("新增提供者連結成功");

          // 新用戶獎勵 100 點
          await pool.execute(
            "UPDATE users SET total_points = 100 WHERE id = ?",
            [userId]
          );
          console.log("新增新用戶獎勵 100 點");

          // 記錄點數歷史
          await pool.execute(
            "INSERT INTO points_history (user_id, points, action, description, created_at) VALUES (?, ?, ?, ?, NOW())",
            [userId, 100, "new_user", "新用戶註冊獎勵"]
          );
          console.log("記錄點數歷史成功");
        } catch (err) {
          console.error("創建新用戶失敗:", err);
          throw err;
        }
      }

      // 獲取用戶資料
      const [userRows] = await pool.execute(
        `SELECT u.*, 
                COALESCE(u.total_points, 0) as total_points,
                ul.level_name
         FROM users u
         LEFT JOIN users_level ul ON u.level_id = ul.id
         WHERE u.id = ?`,
        [userId]
      );

      const user = userRows[0];
      console.log("獲取用戶資料成功:", user);

      // 獲取用戶的所有登入方式
      const [userProviderRows] = await pool.execute(
        "SELECT provider FROM user_providers WHERE user_id = ?",
        [userId]
      );

      const providers = userProviderRows.map((row) => row.provider);
      console.log("用戶的登入方式:", providers);

      // 處理頭像路徑
      let headPath = user.head;
      if (user.is_custom_head === 1 && headPath) {
        // 自定義頭像，確保路徑正確
        if (!headPath.startsWith("http")) {
          headPath = `/uploads/user/${headPath}`;
        }
      }

      // 生成 JWT token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          birthday: user.birthday,
          head: headPath,
          is_custom_head: user.is_custom_head,
          level: user.level_id,
          level_name: user.level_name,
          total_points: user.total_points,
          providers: providers,
        },
        secretKey,
        { expiresIn: "30d" }
      );

      console.log("註冊並登入成功，生成token");
      return res.status(200).json({
        status: "success",
        message: "註冊並登入成功",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            birthday: user.birthday,
            head: headPath,
            is_custom_head: user.is_custom_head,
            level: user.level_id,
            level_name: user.level_name,
            total_points: user.total_points,
            providers: providers,
          },
        },
      });
    }
  } catch (err) {
    console.error("社交登入處理錯誤:", err);
    console.error("錯誤詳情:", {
      code: err.code,
      message: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

// 獲取提供者顯示名稱
function getProviderDisplayName(provider) {
  const displayNames = {
    google: "Google",
    line: "LINE",
    phone: "手機號碼",
    email: "電子郵件",
  };

  return displayNames[provider] || provider;
}

// 使用者登入 API
router.post("/login", upload.none(), async (req, res) => {
  // 從請求主體取得 email 和密碼
  const { email, password } = req.body;

  // 驗證是否提供了所需資料
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "請提供 Email 和密碼",
    });
  }

  try {
    // 查詢資料庫中是否存在該 email
    const sql = "SELECT * FROM `users` WHERE email = ?";
    const [rows] = await pool.execute(sql, [email]);

    // 如果找不到使用者，回傳錯誤
    if (rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Email 不存在",
      });
    }

    const user = rows[0];

    // 比對密碼是否正確
    const isMatch = await bcrypt.compare(password, user.password);

    // 如果密碼不正確，回傳錯誤
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "帳號或密碼錯誤",
      });
    }

    // 驗證成功後，查詢用戶的所有提供者
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [user.id]
    );

    // 確保用戶至少有 email 提供者（對於舊用戶可能沒有）
    if (providers.length === 0) {
      await pool.execute(
        "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, 'email', ?, NOW())",
        [user.id, user.email]
      );
      providers.push({ provider: "email" });
    }

    // 生成 JWT Token，有效期為 30 分鐘
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        providers: providers.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );

    // 回傳成功訊息和 token
    res.status(200).json({
      status: "success",
      data: { token, providers: providers.map((p) => p.provider) },
      message: "登入成功",
    });
  } catch (err) {
    console.log("登入錯誤:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "登入失敗",
    });
  }
});

// 獲取使用者資料 API
router.get("/profile", checkToken, async (req, res) => {
  const { id } = req.decoded;

  try {
    // 查詢使用者詳細資料（略過密碼欄位）
    const sql =
      "SELECT id, email, name, phone, head, level_id as level, birthday, is_custom_head FROM `users` WHERE id = ?";
    const [rows] = await pool.execute(sql, [id]);

    // 如果找不到使用者，回傳錯誤
    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到使用者資料",
      });
    }

    // 查詢用戶的登入提供者
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [id]
    );

    // 回傳使用者資料，包含提供者資訊
    res.status(200).json({
      status: "success",
      data: {
        ...rows[0],
        providers: providers.map((p) => p.provider),
      },
      message: "獲取使用者資料成功",
    });
  } catch (err) {
    console.log("取得使用者資料錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "取得使用者資料失敗",
    });
  }
});

router.get("/providers", checkToken, async (req, res) => {
  try {
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [req.decoded.id]
    );

    res.status(200).json({
      status: "success",
      data: { providers: providers.map((p) => p.provider) },
      message: "獲取提供者列表成功",
    });
  } catch (err) {
    console.error("獲取提供者列表錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "獲取提供者列表失敗",
    });
  }
});

router.delete("/provider/:provider", checkToken, async (req, res) => {
  const provider = req.params.provider;

  try {
    // 檢查用戶是否至少還有另一種登入方式
    const [providers] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [req.decoded.id]
    );

    if (providers.length <= 1) {
      return res.status(400).json({
        status: "error",
        message: "無法移除唯一的登入方式，至少需要保留一種登入方式",
      });
    }

    // 移除提供者
    await pool.execute(
      "DELETE FROM user_providers WHERE user_id = ? AND provider = ?",
      [req.decoded.id, provider]
    );

    // 獲取更新後的提供者列表
    const [updatedProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [req.decoded.id]
    );

    res.status(200).json({
      status: "success",
      data: { providers: updatedProviders.map((p) => p.provider) },
      message: "提供者移除成功",
    });
  } catch (err) {
    console.error("移除提供者錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "移除提供者失敗",
    });
  }
});

// 在 index.js 中確保這個路由設置正確
router.post("/get-user-id", async (req, res) => {
  console.log("收到 get-user-id 請求:", req.body);
  const { provider, provider_id } = req.body;

  if (!provider || !provider_id) {
    console.log("缺少必要參數:", { provider, provider_id });
    return res
      .status(400)
      .json({ status: "error", message: "缺少 provider 或 provider_id" });
  }

  try {
    console.log("查詢參數:", { provider, provider_id });

    // 確保 SQL 查詢正確
    const [user] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, provider_id]
    );

    console.log("查詢結果:", user);

    if (user.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "找不到對應的 user_id" });
    }

    console.log("返回 user_id:", user[0].user_id);
    return res.json({ status: "success", data: { user_id: user[0].user_id } });
  } catch (error) {
    console.error("查詢 user_id 錯誤:", error);
    return res.status(500).json({
      status: "error",
      message: "伺服器錯誤",
      details: error.message,
    });
  }
});

// 使用者資料更新 API
router.post("/update", upload.single("avatar"), async (req, res) => {
  try {
    // 從 token 獲取用戶 ID
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "未提供授權令牌",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "無效的授權令牌",
      });
    }

    const userId = decoded.id;
    console.log(`更新用戶資料，ID: ${userId}`);

    // 獲取表單數據
    const { name, email, phone, birthday } = req.body;
    console.log("更新數據:", { name, email, phone, birthday });

    // 準備更新數據
    const updateData = [];
    const updateParams = [];

    if (name) {
      updateData.push("name = ?");
      updateParams.push(name);
    }

    if (email) {
      updateData.push("email = ?");
      updateParams.push(email);
    }

    if (phone) {
      updateData.push("phone = ?");
      updateParams.push(phone);
    }

    if (birthday) {
      // 確保生日格式正確
      const birthdayDate = new Date(birthday);
      if (!isNaN(birthdayDate.getTime())) {
        // 格式化為 YYYY-MM-DD
        const formattedBirthday = birthdayDate.toISOString().split("T")[0];
        updateData.push("birthday = ?");
        updateParams.push(formattedBirthday);
        console.log(`格式化生日: ${birthday} -> ${formattedBirthday}`);
      } else {
        console.error(`無效的生日格式: ${birthday}`);
      }
    }

    // 處理頭像上傳
    if (req.file) {
      console.log("上傳的頭像文件:", req.file);

      // 使用multer生成的文件名
      const filename = req.file.filename;
      // 保存文件名到数据库，不包含路径前缀
      updateData.push("head = ?");
      updateParams.push(filename);
      updateData.push("is_custom_head = ?");
      updateParams.push(1); // 標記為自定義頭像

      console.log(`保存頭像文件名: ${filename}`);
    }

    // 如果沒有要更新的數據，返回錯誤
    if (updateData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "沒有提供要更新的數據",
      });
    }

    // 添加用戶ID到參數列表
    updateParams.push(userId);

    // 構建更新SQL
    const updateSQL = `UPDATE users SET ${updateData.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;

    console.log("執行SQL:", updateSQL);
    console.log("SQL參數:", updateParams);

    // 執行更新
    await pool.execute(updateSQL, updateParams);

    // 獲取更新後的用戶數據
    const [updatedUser] = await pool.execute(
      "SELECT id, name, email, phone, head, birthday FROM users WHERE id = ?",
      [userId]
    );

    console.log("更新後的用戶數據:", updatedUser[0]);

    // 獲取用戶的所有提供者
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );

    // 生成新的 JWT
    const newToken = jwt.sign(
      {
        id: userId,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        providers: userProviders.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );

    return res.status(200).json({
      status: "success",
      data: {
        token: newToken,
        user: {
          ...updatedUser[0],
          providers: userProviders.map((p) => p.provider),
        },
      },
      message: "用戶資料更新成功",
    });
  } catch (err) {
    console.error("更新用戶資料錯誤:", err);
    return res.status(500).json({
      status: "error",
      message: "更新用戶資料時發生錯誤",
      error: err.message,
    });
  }
});

// 獲取會員資料 API
router.get("/user", checkToken, async (req, res) => {
  const { id } = req.decoded;
  console.log("獲取用戶資料，ID:", id);
  try {
    // 查詢使用者詳細資料（略過密碼欄位）
    const [rows] = await pool.execute(
      "SELECT id, name, email, phone, head, level_id as level, birthday, is_custom_head FROM `users` WHERE id = ?",
      [id]
    );

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

    // 處理頭像路徑
    let userData = { ...rows[0] };
    if (userData.head) {
      // 如果是自定義頭像，添加服務器路徑前綴
      if (userData.is_custom_head === 1) {
        // 检查是否已经包含路径前缀，避免重复
        if (!userData.head.startsWith("/uploads/")) {
          userData.head = `/uploads/avatars/${userData.head}`;
        }
        console.log("处理后的头像路径:", userData.head);
      }
      // 社交媒體頭像已經是完整URL，不需要修改
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

// 获取会员资料
router.get("/member", async (req, res) => {
  try {
    // 从请求头中获取 token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "未提供授权令牌",
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.id;

    // 查询用户信息
    const [userRows] = await pool.execute(
      `SELECT u.*, 
              COALESCE(u.total_points, 0) as total_points,
              ul.level_name
       FROM users u
       LEFT JOIN users_level ul ON u.level = ul.id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "用户不存在",
      });
    }

    const user = userRows[0];

    // 查询用户的登录方式
    const [providerRows] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );

    const providers = providerRows.map((row) => row.provider);

    // 处理头像路径
    let headPath = user.head;
    if (user.is_custom_head === 1 && headPath) {
      // 自定义头像，确保路径正确
      if (!headPath.startsWith("http")) {
        headPath = `/uploads/user/${headPath}`;
      }
    }

    // 返回用户信息
    res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        head: headPath,
        is_custom_head: user.is_custom_head,
        level: user.level,
        level_name: user.level_name,
        total_points: user.total_points,
        providers: providers,
      },
    });
  } catch (err) {
    console.error("获取会员资料错误:", err);
    res.status(500).json({
      status: "error",
      message: "获取会员资料失败",
    });
  }
});

// 获取用户点数历史
router.get("/points-history", async (req, res) => {
  try {
    // 从请求头中获取 token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "未提供授权令牌",
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.id;

    // 查询用户点数历史
    const [historyRows] = await pool.execute(
      `SELECT ph.*, DATE_FORMAT(ph.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
       FROM points_history ph
       WHERE ph.user_id = ?
       ORDER BY ph.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 查询用户当前等级和下一等级
    const [userRows] = await pool.execute(
      `SELECT u.total_points, u.level_id as level, ul.level_name, ul.min_points,
              (SELECT MIN(min_points) FROM users_level WHERE min_points > u.total_points) as next_level_points
       FROM users u
       JOIN users_level ul ON u.level_id = ul.id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "用户不存在",
      });
    }

    const user = userRows[0];
    const nextLevelPoints = user.next_level_points || user.min_points * 2;
    const pointsToNextLevel = nextLevelPoints - user.total_points;

    // 查询下一等级信息
    const [nextLevelRows] = await pool.execute(
      `SELECT * FROM users_level WHERE min_points = ?`,
      [nextLevelPoints]
    );

    // 查询所有会员等级
    const [allLevelsRows] = await pool.execute(
      `SELECT id, level_name, min_points FROM users_level ORDER BY min_points ASC`
    );

    const nextLevel =
      nextLevelRows.length > 0
        ? {
            level: nextLevelRows[0].id,
            name: nextLevelRows[0].level_name,
            points_required: nextLevelRows[0].min_points,
            points_to_next_level: pointsToNextLevel,
          }
        : null;

    // 返回点数历史和等级信息
    res.status(200).json({
      status: "success",
      data: {
        history: historyRows,
        current_level: {
          level: user.level,
          name: user.level_name,
          points_required: user.min_points,
          total_points: user.total_points,
        },
        next_level: nextLevel,
        all_levels: allLevelsRows,
      },
    });
  } catch (err) {
    console.error("获取点数历史错误:", err);
    res.status(500).json({
      status: "error",
      message: "获取点数历史失败",
    });
  }
});

// 添加填写资料奖励
router.post("/complete-profile", async (req, res) => {
  try {
    // 从请求头中获取 token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "未提供授权令牌",
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.id;

    // 检查用户是否已经获得过填写资料奖励
    const [historyRows] = await pool.execute(
      "SELECT * FROM points_history WHERE user_id = ? AND action = ?",
      [userId, "profile_completion"]
    );

    if (historyRows.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "已經獲得過填寫資料獎勵",
      });
    }

    // 检查用户资料是否完整
    const [userRows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "用户不存在",
      });
    }

    const user = userRows[0];

    // 检查必要字段是否已填写
    if (!user.name || !user.email || !user.phone || !user.birthday) {
      return res.status(400).json({
        status: "error",
        message: "個人資料不完整，無法獲得獎勵",
      });
    }

    // 添加奖励点数
    const rewardPoints = 100;
    await pool.execute(
      "UPDATE users SET total_points = total_points + ? WHERE id = ?",
      [rewardPoints, userId]
    );

    // 记录点数历史
    await pool.execute(
      "INSERT INTO points_history (user_id, points, action, description, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, rewardPoints, "profile_completion", "完善個人資料獎勵"]
    );

    // 更新用户等级
    await pool.execute(
      `UPDATE users u
       JOIN users_level ul ON ul.min_points <= (u.total_points)
       SET u.level_id = ul.id
       WHERE u.id = ?
       ORDER BY ul.min_points DESC
       LIMIT 1`,
      [userId]
    );

    // 获取更新后的用户信息
    const [updatedUserRows] = await pool.execute(
      `SELECT u.*, 
              COALESCE(u.total_points, 0) as total_points,
              ul.level_name
       FROM users u
       LEFT JOIN users_level ul ON u.level_id = ul.id
       WHERE u.id = ?`,
      [userId]
    );

    const updatedUser = updatedUserRows[0];

    // 获取用户的所有登录方式
    const [providerRows] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );

    const providers = providerRows.map((row) => row.provider);

    // 处理头像路径
    let headPath = updatedUser.head;
    if (updatedUser.is_custom_head === 1 && headPath) {
      // 自定义头像，确保路径正确
      if (!headPath.startsWith("http")) {
        headPath = `/uploads/user/${headPath}`;
      }
    }

    // 生成新的 token
    const newToken = jwt.sign(
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        birthday: updatedUser.birthday,
        head: headPath,
        is_custom_head: updatedUser.is_custom_head,
        level: updatedUser.level_id,
        level_name: updatedUser.level_name,
        total_points: updatedUser.total_points,
        providers: providers,
      },
      secretKey,
      { expiresIn: "30d" }
    );

    // 返回奖励结果
    res.status(200).json({
      status: "success",
      message: `恭喜獲得 ${rewardPoints} 點獎勵！`,
      data: {
        token: newToken,
        points_added: rewardPoints,
        total_points: updatedUser.total_points,
        level: updatedUser.level_id,
        level_name: updatedUser.level_name,
      },
    });
  } catch (err) {
    console.error("添加填写资料奖励错误:", err);
    res.status(500).json({
      status: "error",
      message: "添加填写资料奖励失败",
    });
  }
});

// 标准化手机号码格式
function standardizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;

  // 移除所有非数字字符
  let cleaned = phoneNumber.replace(/\D/g, "");

  // 如果以 0 开头，移除第一个 0 并添加 +886
  if (cleaned.startsWith("0")) {
    cleaned = "0" + cleaned.substring(1);
  }

  return cleaned;
}

// 確保這個路由被導出和掛載
export default router;
