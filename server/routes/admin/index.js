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
    } = req.body;

    console.log("社交登入請求數據:", {
      email,
      name,
      provider,
      provider_id,
      link_to_user_id,
      stay_on_account_page,
      hasImage: !!image,
    });

    // 基本驗證
    if (!provider || !provider_id) {
      console.error("缺少必要參數:", { provider, provider_id });
      return res.status(400).json({
        status: "error",
        message: "缺少必要參數: provider 和 provider_id 是必須的",
      });
    }

    // 2. 標準化數據
    // 轉換 provider 為小寫，確保大小寫一致性
    const normalizedProvider = provider.toLowerCase();
    console.log(`標準化提供者: ${provider} -> ${normalizedProvider}`);

    // 標準化 provider_id
    let normalizedProviderId = provider_id;

    // 針對手機號碼標準化 (確保格式為 +國碼電話號碼)
    if (normalizedProvider === "phone") {
      normalizedProviderId = standardizePhoneNumber(provider_id);
      console.log(`標準化手機號碼: ${provider_id} -> ${normalizedProviderId}`);
    }

    // 針對LINE標準化 (如果是空值或undefined，使用時間戳)
    if (
      normalizedProvider === "line" &&
      (!provider_id || provider_id === "undefined")
    ) {
      normalizedProviderId = `line_${Date.now()}`;
      console.log(`LINE provider_id 為空，使用替代ID: ${normalizedProviderId}`);
    }

    // 3. 處理帳號連結流程 - 只有在明確提供link_to_user_id時才執行
    if (link_to_user_id) {
      console.log(`檢測到帳號連結請求，link_to_user_id = ${link_to_user_id}`);

      // 檢查連結目標用戶是否存在
      console.log(`檢查連結目標用戶是否存在: ${link_to_user_id}`);
      const [targetUser] = await pool.execute(
        "SELECT id FROM users WHERE id = ?",
        [link_to_user_id]
      );
      console.log(`查詢結果:`, targetUser);

      if (targetUser.length === 0) {
        console.error(`連結目標用戶不存在: ${link_to_user_id}`);
        return res.status(404).json({
          status: "error",
          message: "連結目標用戶不存在",
        });
      }

      // 默認使用強制覆蓋
      console.log(`默認使用強制覆蓋現有連結`);

      // 檢查是否需要保持在會員中心頁面
      const stayOnAccountPage =
        stay_on_account_page === true || stay_on_account_page === "true";
      console.log(`是否保持在會員中心頁面: ${stayOnAccountPage}`);

      return await handleAccountLinking(
        res,
        normalizedProvider,
        normalizedProviderId,
        link_to_user_id,
        email,
        name,
        image,
        true, // 默認使用強制覆蓋
        stayOnAccountPage // 是否保持在會員中心頁面
      );
    }

    // 4. 處理常規社交登入流程
    console.log(`處理常規社交登入流程`);
    return await handleSocialLogin(
      res,
      normalizedProvider,
      normalizedProviderId,
      email,
      name,
      image,
      null // 明確傳遞null，表示這不是連結操作
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
  image,
  forceLink = true, // 默認使用強制覆蓋
  stayOnAccountPage = false // 是否保持在會員中心頁面
) {
  console.log(
    `處理帳號連結: 將 ${provider}(${providerId}) 連結到用戶ID ${linkToUserId}`
  );
  console.log(`是否強制覆蓋現有連結: ${forceLink}`);
  console.log(`是否保持在會員中心頁面: ${stayOnAccountPage}`);

  try {
    // 檢查連結目標用戶是否存在
    console.log(`檢查連結目標用戶是否存在: ${linkToUserId}`);
    const [targetUser] = await pool.execute(
      "SELECT id, email, name, phone, head FROM users WHERE id = ?",
      [linkToUserId]
    );
    console.log(`查詢結果:`, targetUser);

    if (targetUser.length === 0) {
      console.error(`連結目標用戶不存在: ${linkToUserId}`);
      return res.status(404).json({
        status: "error",
        message: "連結目標用戶不存在",
      });
    }

    // 檢查此提供者ID是否已被其他用戶使用
    console.log(`檢查提供者ID是否已被使用: ${provider}, ${providerId}`);
    const [existingProvider] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );
    console.log(`查詢結果:`, existingProvider);

    if (existingProvider.length > 0) {
      const existingUserId = existingProvider[0].user_id;
      console.log(`提供者ID已被用戶使用: ${existingUserId}`);

      // 已連結到目標用戶，視為成功
      if (existingUserId == linkToUserId) {
        console.log(`提供者ID已連結到目標用戶，視為成功`);

        // 獲取用戶的所有提供者
        const [userProviders] = await pool.execute(
          "SELECT provider FROM user_providers WHERE user_id = ?",
          [linkToUserId]
        );

        // 生成 JWT，使用現有用戶的信息
        const token = jwt.sign(
          {
            id: linkToUserId,
            email: targetUser[0].email,
            name: targetUser[0].name,
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
              ...targetUser[0],
              providers: userProviders.map((p) => p.provider),
            },
          },
          message: `此${getProviderDisplayName(
            provider
          )}帳號已經連結到您的帳戶`,
          stayOnAccountPage: stayOnAccountPage, // 返回是否保持在會員中心頁面
        });
      }
      // 已連結到其他用戶，但我們默認使用強制覆蓋
      else if (forceLink) {
        console.log(`強制覆蓋現有連結，從用戶 ${existingUserId} 移除連結`);
        // 刪除現有連結
        await pool.execute(
          "DELETE FROM user_providers WHERE provider = ? AND provider_id = ?",
          [provider, providerId]
        );
        console.log(`已刪除現有連結`);
      } else {
        // 不允許覆蓋
        return res.status(409).json({
          status: "error",
          message: `此${getProviderDisplayName(provider)}帳號已連結到其他用戶`,
        });
      }
    }

    // 建立新的提供者關聯
    console.log(
      `建立新的提供者關聯: ${linkToUserId}, ${provider}, ${providerId}`
    );
    await pool.execute(
      "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
      [linkToUserId, provider, providerId]
    );
    console.log(`提供者關聯建立成功`);

    // 如果是手機登入，同時更新用戶的手機號碼
    if (provider === "phone") {
      console.log(`更新用戶手機號碼: ${linkToUserId}, ${providerId}`);
      await pool.execute("UPDATE users SET phone = ? WHERE id = ?", [
        providerId,
        linkToUserId,
      ]);
      console.log(`手機號碼更新成功`);
    }

    // 獲取用戶的所有提供者
    console.log(`獲取用戶的所有提供者: ${linkToUserId}`);
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [linkToUserId]
    );
    console.log(`用戶提供者:`, userProviders);

    // 生成 JWT，使用現有用戶的信息
    console.log(`生成JWT: ${linkToUserId}`);
    const token = jwt.sign(
      {
        id: linkToUserId,
        email: targetUser[0].email,
        name: targetUser[0].name,
        providers: userProviders.map((p) => p.provider),
      },
      secretKey,
      { expiresIn: "30m" }
    );
    console.log(`JWT生成成功`);

    return res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          ...targetUser[0],
          providers: userProviders.map((p) => p.provider),
        },
      },
      message: `${getProviderDisplayName(provider)}帳號連結成功`,
      stayOnAccountPage: stayOnAccountPage, // 返回是否保持在會員中心頁面
    });
  } catch (err) {
    console.error("帳號連結處理錯誤:", err);
    throw err;
  }
}

// 處理常規社交登入邏輯
async function handleSocialLogin(
  res,
  provider,
  providerId,
  email,
  name,
  image,
  link_to_user_id
) {
  console.log(
    `處理社交登入: ${provider}(${providerId}), email: ${email || "none"}`
  );
  console.log(`link_to_user_id: ${link_to_user_id || "無，這是普通登入"}`);
  console.log(`頭像: ${image || "無"}`);

  try {
    // 檢查提供者ID是否已關聯到用戶
    console.log(`檢查提供者ID是否已關聯到用戶: ${provider}, ${providerId}`);
    const [existingProviderLinks] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, providerId]
    );
    console.log(`查詢結果:`, existingProviderLinks);

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
      console.log(`檢查用戶是否存在: ${userId}`, userExists);

      if (userExists.length === 0) {
        // 用戶不存在，清理孤立記錄
        console.log(`警告: 找到孤立的提供者記錄，用戶ID ${userId} 不存在`);
        await pool.execute("DELETE FROM user_providers WHERE user_id = ?", [
          userId,
        ]);
        console.log(`已刪除孤立記錄`);

        // 將其視為新用戶
        isNewUser = true;
      } else {
        // 用戶存在，更新基本信息
        if (name) {
          console.log(`更新用戶名稱: ${userId}, ${name}`);
          await pool.execute(
            "UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = '' OR name LIKE ?)",
            [name, userId, `${provider}%`]
          );
        }

        // 如果是手機登入，確保手機號碼已更新
        if (provider === "phone" && providerId) {
          console.log(`更新用戶手機號碼: ${userId}, ${providerId}`);
          await pool.execute(
            "UPDATE users SET phone = ? WHERE id = ? AND (phone IS NULL OR phone = '')",
            [providerId, userId]
          );
        }

        // 如果提供了頭像且用戶沒有頭像，更新頭像
        if (image) {
          console.log(`檢查用戶是否有頭像: ${userId}`);
          const [userHead] = await pool.execute(
            "SELECT head FROM users WHERE id = ?",
            [userId]
          );

          if (!userHead[0].head) {
            console.log(`更新用戶頭像: ${userId}, ${image}`);
            await pool.execute("UPDATE users SET head = ? WHERE id = ?", [
              image,
              userId,
            ]);
          }
        }
      }
    } else {
      // 提供者ID未關聯 - 檢查是否可以通過email找到用戶
      if (email) {
        console.log(`通過email查找用戶: ${email}`);
        const [usersByEmail] = await pool.execute(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );
        console.log(`通過email查找結果:`, usersByEmail);

        if (usersByEmail.length > 0) {
          // 通過email找到已有用戶 - 添加新的提供者關聯
          userId = usersByEmail[0].id;
          console.log(`通過email找到用戶ID: ${userId}，將添加新提供者關聯`);

          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
            [userId, provider, providerId]
          );
          console.log(
            `已添加新提供者關聯: ${userId}, ${provider}, ${providerId}`
          );

          // 如果是手機登入，更新手機號碼
          if (provider === "phone") {
            console.log(`更新用戶手機號碼: ${userId}, ${providerId}`);
            await pool.execute(
              "UPDATE users SET phone = ? WHERE id = ? AND (phone IS NULL OR phone = '')",
              [providerId, userId]
            );
          }

          // 如果提供了頭像且用戶沒有頭像，更新頭像
          if (image) {
            console.log(`檢查用戶是否有頭像: ${userId}`);
            const [userHead] = await pool.execute(
              "SELECT head FROM users WHERE id = ?",
              [userId]
            );

            if (!userHead[0].head) {
              console.log(`更新用戶頭像: ${userId}, ${image}`);
              await pool.execute("UPDATE users SET head = ? WHERE id = ?", [
                image,
                userId,
              ]);
            }
          }
        } else {
          // 沒找到用戶 - 創建新用戶
          isNewUser = true;
          console.log(`通過email未找到用戶，將創建新用戶`);
        }
      } else {
        // 沒有email - 創建新用戶
        isNewUser = true;
        console.log(`沒有email，將創建新用戶`);
      }

      // 如果需要創建新用戶
      if (isNewUser) {
        // 常規新用戶創建流程
        console.log("創建新用戶");

        // 準備用戶數據
        const userData = [
          email || null,
          name || `${provider}用戶`,
          image || null,
        ];
        console.log(`新用戶數據:`, userData);

        // 如果是手機登入，同時設置手機號碼
        if (provider === "phone") {
          console.log(`創建帶手機號碼的新用戶: ${providerId}`);
          const [newUser] = await pool.execute(
            "INSERT INTO users (email, name, head, phone) VALUES (?, ?, ?, ?)",
            [...userData, providerId]
          );
          userId = newUser.insertId;
          console.log(`創建成功，新用戶ID: ${userId}`);
        } else {
          console.log(`創建常規新用戶`);
          const [newUser] = await pool.execute(
            "INSERT INTO users (email, name, head) VALUES (?, ?, ?)",
            userData
          );
          userId = newUser.insertId;
          console.log(`創建成功，新用戶ID: ${userId}`);
        }

        // 添加提供者關聯
        console.log(`添加提供者關聯: ${userId}, ${provider}, ${providerId}`);
        await pool.execute(
          "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
          [userId, provider, providerId]
        );
      }
    }

    // 獲取用戶詳情
    console.log(`獲取用戶詳情: userId = ${userId}`);
    const [userDetails] = await pool.execute(
      "SELECT id, email, name, phone, head, level_id FROM users WHERE id = ?",
      [userId]
    );
    console.log(`用戶詳情:`, userDetails);

    if (userDetails.length === 0) {
      throw new Error(`嚴重錯誤: 用戶ID ${userId} 在數據庫中不存在`);
    }

    // 獲取用戶的所有提供者
    console.log(`獲取用戶的所有提供者: userId = ${userId}`);
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );
    console.log(`用戶提供者:`, userProviders);

    // 生成 JWT
    console.log(
      `生成 JWT: userId = ${userId}, email = ${userDetails[0].email}, name = ${userDetails[0].name}`
    );
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
    console.log(`JWT生成成功`);

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
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      updateData.push("head = ?");
      updateParams.push(avatarPath);
      updateData.push("is_custom_head = ?");
      updateParams.push(1); // 標記為自定義頭像
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

// 獲取用戶資料 API
router.get("/user", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(`獲取用戶資料，ID: ${id}`);

    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "缺少用戶ID參數",
      });
    }

    // 獲取用戶基本資料
    const [userDetails] = await pool.execute(
      "SELECT id, name, email, phone, head, level_id, birthday FROM users WHERE id = ?",
      [id]
    );

    if (userDetails.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到用戶資料",
      });
    }

    // 獲取用戶的登入方式
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [id]
    );

    // 處理頭像路徑
    if (userDetails[0].head) {
      console.log(`用戶頭像路徑: ${userDetails[0].head}`);
    }

    return res.status(200).json({
      status: "success",
      data: {
        ...userDetails[0],
        providers: userProviders.map((p) => p.provider),
      },
    });
  } catch (err) {
    console.error("獲取用戶資料錯誤:", err);
    return res.status(500).json({
      status: "error",
      message: "獲取用戶資料時發生錯誤",
      error: err.message,
    });
  }
});

// 確保這個路由被導出和掛載
export default router;
