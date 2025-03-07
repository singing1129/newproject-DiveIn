// userRoutes.js - 會員相關 API 路由
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../../config/mysql.js";
import { checkToken } from "../../middleware/auth.js";

// 載入環境變數
dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY;

// 創建檔案上傳中間件
const upload = multer();

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
  try {
    // 1. 獲取並驗證請求參數
    const { email, name, image, provider, provider_id, link_to_user_id } =
      req.body;

    console.log("社交登入請求數據:", {
      email,
      name,
      provider,
      provider_id,
      link_to_user_id,
      hasImage: !!image,
    });

    // 基本驗證
    if (!provider || !provider_id) {
      return res.status(400).json({
        status: "error",
        message: "缺少必要參數: provider 和 provider_id 是必須的",
      });
    }

    // 2. 標準化數據
    // 轉換 provider 為小寫，確保大小寫一致性
    const normalizedProvider = provider.toLowerCase();

    // 標準化 provider_id
    let normalizedProviderId = provider_id;

    // 針對手機號碼標準化 (確保格式為 +國碼電話號碼)
    if (normalizedProvider === "phone") {
      normalizedProviderId = standardizePhoneNumber(provider_id);
    }

    // 針對LINE標準化 (如果是空值或undefined，使用時間戳)
    if (
      normalizedProvider === "line" &&
      (!provider_id || provider_id === "undefined")
    ) {
      normalizedProviderId = `line_${Date.now()}`;
      console.log(`LINE provider_id 為空，使用替代ID: ${normalizedProviderId}`);
    }

    // 3. 處理帳號連結流程
    if (link_to_user_id) {
      return await handleAccountLinking(
        res,
        normalizedProvider,
        normalizedProviderId,
        link_to_user_id,
        email,
        name,
        image
      );
    }

    // 4. 處理常規社交登入流程
    return await handleSocialLogin(
      res,
      normalizedProvider,
      normalizedProviderId,
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

    return res.status(500).json({
      status: "error",
      message: "處理社交登入時發生錯誤",
      errorDetail: err.message,
    });
  }
});

// 輔助函數: 標準化手機號碼
function standardizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

  // 如果已經是標準格式 (+國碼...)，則直接返回
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  // 假設是台灣號碼，處理開頭為0的情況
  if (phoneNumber.startsWith("0") && phoneNumber.length === 10) {
    return "+886" + phoneNumber.substring(1);
  }

  // 其他情況，移除非數字字符並加上+號
  const digits = phoneNumber.replace(/\D/g, "");
  return "+" + digits;
}

// 處理帳號連結邏輯
async function handleAccountLinking(
  res,
  provider,
  providerId,
  linkToUserId,
  email,
  name,
  image
) {
  console.log(
    `處理帳號連結: 將 ${provider}(${providerId}) 連結到用戶ID ${linkToUserId}`
  );

  try {
    // 檢查連結目標用戶是否存在
    const [targetUser] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [linkToUserId]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "連結目標用戶不存在",
      });
    }

    // 檢查此提供者ID是否已被其他用戶使用
    const [existingProvider] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );

    if (existingProvider.length > 0) {
      const existingUserId = existingProvider[0].user_id;

      // 已連結到目標用戶，視為成功
      if (existingUserId == linkToUserId) {
        return res.status(200).json({
          status: "success",
          message: `此${getProviderDisplayName(
            provider
          )}帳號已經連結到您的帳戶`,
        });
      }
      // 已連結到其他用戶，返回錯誤
      else {
        return res.status(409).json({
          status: "error",
          message: `此${getProviderDisplayName(provider)}帳號已連結到其他用戶`,
        });
      }
    }

    // 建立新的提供者關聯
    await pool.execute(
      "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
      [linkToUserId, provider, providerId]
    );

    // 如果是手機登入，同時更新用戶的手機號碼
    if (provider === "phone") {
      await pool.execute("UPDATE users SET phone = ? WHERE id = ?", [
        providerId,
        linkToUserId,
      ]);
    }

    // 查詢用戶信息
    const [userDetails] = await pool.execute(
      "SELECT id, email, name, phone, head FROM users WHERE id = ?",
      [linkToUserId]
    );

    // 獲取用戶的所有提供者
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [linkToUserId]
    );

    // 生成 JWT
    const token = jwt.sign(
      {
        id: linkToUserId,
        email: userDetails[0].email,
        name: userDetails[0].name,
        providers: userProviders.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );

    return res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          ...userDetails[0],
          providers: userProviders.map((p) => p.provider),
        },
      },
      message: `${getProviderDisplayName(provider)}連結成功`,
    });
  } catch (err) {
    console.error("帳號連結處理錯誤:", err);
    throw err;
  }
}

// 處理常規社交登入邏輯
// 處理常規社交登入邏輯
async function handleSocialLogin(
  res,
  provider,
  providerId,
  email,
  name,
  image,
  link_to_user_id // 新增參數，接收要連結的用戶ID
) {
  console.log(
    `處理社交登入: ${provider}(${providerId}), email: ${email || "none"}`
  );

  try {
    // 檢查提供者ID是否已關聯到用戶
    const [existingProviderLinks] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );

    let userId;
    let isNewUser = false;

    if (existingProviderLinks.length > 0) {
      // 提供者ID已關聯到用戶 - 使用現有用戶
      userId = existingProviderLinks[0].user_id;
      console.log(`提供者ID已存在，關聯到用戶ID: ${userId}`);

      // 檢查用戶是否實際存在
      const [userExists] = await pool.execute(
        "SELECT id FROM users WHERE id = ?",
        [userId]
      );

      if (userExists.length === 0) {
        // 用戶不存在，清理孤立記錄
        console.log(`警告: 找到孤立的提供者記錄，用戶ID ${userId} 不存在`);
        await pool.execute("DELETE FROM user_providers WHERE user_id = ?", [
          userId,
        ]);

        // 將其視為新用戶
        isNewUser = true;
      } else {
        // 用戶存在，更新基本信息
        if (name) {
          await pool.execute(
            "UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = '' OR name LIKE ?)",
            [name, userId, `${provider}%`]
          );
        }

        // 如果是手機登入，確保手機號碼已更新
        if (provider === "phone" && providerId) {
          await pool.execute(
            "UPDATE users SET phone = ? WHERE id = ? AND (phone IS NULL OR phone = '')",
            [providerId, userId]
          );
        }
      }
    } else {
      // 提供者ID未關聯 - 檢查是否可以通過email找到用戶
      if (email) {
        const [usersByEmail] = await pool.execute(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

        if (usersByEmail.length > 0) {
          // 通過email找到已有用戶 - 添加新的提供者關聯
          userId = usersByEmail[0].id;
          console.log(`通過email找到用戶ID: ${userId}，將添加新提供者關聯`);

          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
            [userId, provider, providerId]
          );

          // 如果是手機登入，更新手機號碼
          if (provider === "phone") {
            await pool.execute(
              "UPDATE users SET phone = ? WHERE id = ? AND (phone IS NULL OR phone = '')",
              [providerId, userId]
            );
          }
        } else {
          // 沒找到用戶 - 創建新用戶
          isNewUser = true;
        }
      } else {
        // 沒有email - 創建新用戶
        isNewUser = true;
      }

      // 如果需要創建新用戶
      if (isNewUser) {
        // 關鍵修改：如果有 link_to_user_id 參數，這是一個帳號連結操作，不應創建新用戶
        if (link_to_user_id) {
          console.log(
            `這是帳號連結操作，將 ${provider} 連結到用戶ID: ${link_to_user_id}`
          );
          isNewUser = false;
          userId = link_to_user_id;

          // 添加提供者關聯到指定用戶
          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
            [userId, provider, providerId]
          );

          // 如果是手機登入，更新用戶的手機號碼
          if (provider === "phone") {
            await pool.execute("UPDATE users SET phone = ? WHERE id = ?", [
              providerId,
              userId,
            ]);
          }
        } else {
          // 常規新用戶創建流程
          console.log("創建新用戶");

          // 準備用戶數據
          const userData = [
            email || null,
            name || `${provider}用戶`,
            image || null,
          ];

          // 如果是手機登入，同時設置手機號碼
          if (provider === "phone") {
            const [newUser] = await pool.execute(
              "INSERT INTO users (email, name, head, phone) VALUES (?, ?, ?, ?)",
              [...userData, providerId]
            );
            userId = newUser.insertId;
          } else {
            const [newUser] = await pool.execute(
              "INSERT INTO users (email, name, head) VALUES (?, ?, ?)",
              userData
            );
            userId = newUser.insertId;
          }

          // 添加提供者關聯
          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
            [userId, provider, providerId]
          );
        }
      }
    }

    // 獲取用戶詳情
    const [userDetails] = await pool.execute(
      "SELECT id, email, name, phone, head, level_id FROM users WHERE id = ?",
      [userId]
    );

    if (userDetails.length === 0) {
      throw new Error(`嚴重錯誤: 用戶ID ${userId} 在數據庫中不存在`);
    }

    // 獲取用戶的所有提供者
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );

    // 生成 JWT
    const token = jwt.sign(
      {
        id: userId,
        email: userDetails[0].email,
        name: userDetails[0].name,
        providers: userProviders.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );

    return res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          ...userDetails[0],
          providers: userProviders.map((p) => p.provider),
        },
        isNewUser,
      },
      message: isNewUser ? "登入成功，已創建新用戶" : "登入成功",
    });
  } catch (err) {
    console.error("社交登入處理錯誤:", err);
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
    // 查詢使用者更完整的資料
    const sql =
      "SELECT id, email, name, phone, head, level_id, created_at FROM `users` WHERE id = ?";
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

// 確保這個路由被導出和掛載
export default router;
