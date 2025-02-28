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

// 使用者 Google 登入 API
// router.post("/google-login", upload.none(), async (req, res) => {
//   const { email, name, image } = req.body;

//   if (!email || !name) {
//     return res.status(400).json({
//       status: "error",
//       message: "缺少必要的 Google 使用者資訊",
//     });
//   }

//   try {
//     // 檢查是否已經有該使用者
//     const checkSql = "SELECT * FROM `users` WHERE email = ?";
//     const [existingUser] = await pool.execute(checkSql, [email]);

//     if (existingUser.length > 0) {
//       return res.status(200).json({
//         status: "success",
//         message: "使用者已存在，直接登入",
//       });
//     }

//     // 如果使用者不存在，就創建新帳號
//     const insertSql =
//       "INSERT INTO `users` (`email`, `name`, `head`) VALUES (?, ?, ?)";
//     await pool.execute(insertSql, [email, name, image]);

//     return res.status(201).json({
//       status: "success",
//       message: "Google 使用者已新增到資料庫",
//     });
//   } catch (err) {
//     console.error("Google 登入錯誤:", err);
//     res.status(500).json({
//       status: "error",
//       message: "登入過程中發生錯誤",
//     });
//   }
// });

// // 使用者 Line 登入 API
// router.post("/line-login", upload.none(), async (req, res) => {
//   const { email, name, image } = req.body;

//   if (!email || !name) {
//     return res.status(400).json({
//       status: "error",
//       message: "缺少必要的 LINE 使用者資訊",
//     });
//   }

//   try {
//     // 檢查是否已經有該使用者
//     const checkSql = "SELECT * FROM `users` WHERE email = ?";
//     const [existingUser] = await pool.execute(checkSql, [email]);

//     if (existingUser.length > 0) {
//       return res.status(200).json({
//         status: "success",
//         message: "使用者已存在，直接登入",
//       });
//     }

//     // 如果使用者不存在，就創建新帳號
//     const insertSql =
//       "INSERT INTO `users` (`email`, `name`, `head`) VALUES (?, ?, ?)";
//     await pool.execute(insertSql, [email, name, image]);

//     return res.status(201).json({
//       status: "success",
//       message: "LINE 使用者已新增到資料庫",
//     });
//   } catch (err) {
//     console.error("LINE 登入錯誤:", err);
//     res.status(500).json({
//       status: "error",
//       message: "登入過程中發生錯誤",
//     });
//   }
// });

// 使用者社交登入統一 API

// 在 index.js 中
// router.post("/social-login", upload.none(), async (req, res) => {
//   const { email, name, image, provider, provider_id } = req.body;
//   console.log("社交登錄請求數據:", req.body);

//   // 基本驗證
//   if (!provider || !provider_id) {
//     return res.status(400).json({
//       status: "error",
//       message: "缺少必要的社交登入資訊 (provider 和 provider_id)",
//     });
//   }

//   try {
//     // 第一步：檢查這個提供者ID是否已經被關聯到某個用戶
//     const [existingProviderLinks] = await pool.execute(
//       "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
//       [provider, provider_id]
//     );

//     let userId;
//     let isNewUser = false;

//     if (existingProviderLinks.length > 0) {
//       // 提供者ID已關聯到用戶 - 直接使用該用戶
//       userId = existingProviderLinks[0].user_id;
//       console.log(`提供者ID已存在，關聯到userID: ${userId}`);
//     } else {
//       // 提供者ID未關聯 - 需要確定是新用戶還是已有用戶

//       // 如果有email，嘗試通過email找到用戶
//       if (email) {
//         const [usersByEmail] = await pool.execute(
//           "SELECT id FROM users WHERE email = ?",
//           [email]
//         );

//         if (usersByEmail.length > 0) {
//           // 找到了已有用戶 - 將新提供者關聯到該用戶
//           userId = usersByEmail[0].id;
//           console.log(`通過email找到已有用戶ID: ${userId}，將添加新提供者關聯`);

//           // 添加新的提供者關聯
//           await pool.execute(
//             "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
//             [userId, provider, provider_id]
//           );
//         } else {
//           // 沒找到用戶 - 創建新用戶
//           isNewUser = true;
//         }
//       } else {
//         // 沒有email - 創建新用戶
//         isNewUser = true;
//       }

//       // 如果需要創建新用戶
//       if (isNewUser) {
//         console.log("創建新用戶");

//         // 生成一個臨時email（如果沒有提供）
//         const userEmail = email || `${provider}_${provider_id}@temporary.email`;

//         // 創建新用戶
//         const safeImage = image || null; 
//         const [newUser] = await pool.execute(
//           "INSERT INTO users (email, name, head) VALUES (?, ?, ?)",
//           [userEmail, name || `${provider}用戶`, safeImage]
//         );

//         userId = newUser.insertId;

//         // 添加提供者關聯
//         await pool.execute(
//           "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
//           [userId, provider, provider_id]
//         );
//       }
//     }

//     // 獲取用戶的所有提供者信息
//     const [userProviders] = await pool.execute(
//       "SELECT provider FROM user_providers WHERE user_id = ?",
//       [userId]
//     );

//     // 獲取用戶詳情
//     const [userDetails] = await pool.execute(
//       "SELECT id, email, name, head FROM users WHERE id = ?",
//       [userId]
//     );

//     if (userDetails.length === 0) {
//       throw new Error(`無法找到用戶詳情，用戶ID: ${userId}`);
//     }

//     // 更新用戶詳情（如果有新信息）
//     if (
//       (name && userDetails[0].name !== name) ||
//       (image && userDetails[0].head !== image)
//     ) {
//       const updates = [];
//       const params = [];

//       if (name && userDetails[0].name !== name) {
//         updates.push("name = ?");
//         params.push(name);
//       }

//       if (image && userDetails[0].head !== image) {
//         updates.push("head = ?");
//         params.push(image);
//       }

//       if (updates.length > 0) {
//         params.push(userId);
//         await pool.execute(
//           `UPDATE users SET ${updates.join(
//             ", "
//           )}, updated_at = NOW() WHERE id = ?`,
//           params
//         );
//       }
//     }

//     // 生成 JWT Token
//     const token = jwt.sign(
//       {
//         id: userId,
//         email: userDetails[0].email,
//         name: userDetails[0].name || null,
//         providers: userProviders.map((p) => p.provider),
//       },
//       secretKey,
//       { expiresIn: "30m" }
//     );

//     return res.status(200).json({
//       status: "success",
//       data: {
//         token,
//         user: {
//           id: userId,
//           email: userDetails[0].email,
//           name: userDetails[0].name,
//           head: userDetails[0].head,
//           providers: userProviders.map((p) => p.provider),
//         },
//         isNewUser,
//       },
//       message: isNewUser ? "社交登入成功，已創建新用戶" : "社交登入成功",
//     });
//   } catch (err) {
//     console.error("社交登入處理錯誤:", err);
//     res.status(500).json({
//       status: "error",
//       message: "社交登入處理失敗",
//       error: err.message,
//     });
//   }
// });

// 改進的 social-login API，更好地支持電話認證，不強制要求 email
router.post("/social-login", upload.none(), async (req, res) => {
  const { email, name, image, provider, provider_id } = req.body;
  console.log("社交登錄請求數據:", req.body);

  // 基本驗證
  if (!provider || !provider_id) {
    return res.status(400).json({
      status: "error",
      message: "缺少必要的社交登入資訊 (provider 和 provider_id)",
    });
  }

  try {
    // 手機號碼格式標準化處理
    let normalizedProviderId = provider_id;
    if (provider === 'phone') {
      // 確保手機號碼格式一致，保留+號並移除其他非數字字符
      normalizedProviderId = provider_id.startsWith('+') 
        ? '+' + provider_id.substring(1).replace(/\D/g, '')
        : provider_id.replace(/\D/g, '');
    }

    // 第一步：檢查這個提供者ID是否已經被關聯到某個用戶
    const [existingProviderLinks] = await pool.execute(
      "SELECT user_id FROM user_providers WHERE provider = ? AND provider_id = ?",
      [provider, normalizedProviderId]
    );

    let userId;
    let isNewUser = false;

    if (existingProviderLinks.length > 0) {
      // 提供者ID已關聯到用戶 - 直接使用該用戶
      userId = existingProviderLinks[0].user_id;
      console.log(`提供者ID已存在，關聯到userID: ${userId}`);
    } else {
      // 提供者ID未關聯 - 需要確定是新用戶還是已有用戶

      // 如果有email，嘗試通過email找到用戶
      if (email) {
        const [usersByEmail] = await pool.execute(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

        if (usersByEmail.length > 0) {
          // 找到了已有用戶 - 將新提供者關聯到該用戶
          userId = usersByEmail[0].id;
          console.log(`通過email找到已有用戶ID: ${userId}，將添加新提供者關聯`);

          // 添加新的提供者關聯
          await pool.execute(
            "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
            [userId, provider, normalizedProviderId]
          );
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
        console.log("創建新用戶");

        // 創建新用戶 - 注意email可以為null
        const safeImage = image || null; 
        const [newUser] = await pool.execute(
          "INSERT INTO users (email, name, head) VALUES (?, ?, ?)",
          [email || null, name || `${provider}用戶`, safeImage]
        );

        userId = newUser.insertId;

        // 添加提供者關聯
        await pool.execute(
          "INSERT INTO user_providers (user_id, provider, provider_id, created_at) VALUES (?, ?, ?, NOW())",
          [userId, provider, normalizedProviderId]
        );
      }
    }

    // 獲取用戶的所有提供者信息
    const [userProviders] = await pool.execute(
      "SELECT provider FROM user_providers WHERE user_id = ?",
      [userId]
    );

    // 獲取用戶詳情
    const [userDetails] = await pool.execute(
      "SELECT id, email, name, head FROM users WHERE id = ?",
      [userId]
    );

    if (userDetails.length === 0) {
      throw new Error(`無法找到用戶詳情，用戶ID: ${userId}`);
    }

    // 生成 JWT Token - 注意email可能為null
    const token = jwt.sign(
      {
        id: userId,
        email: userDetails[0].email || null,
        name: userDetails[0].name || null,
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
          id: userId,
          email: userDetails[0].email,
          name: userDetails[0].name,
          head: userDetails[0].head,
          providers: userProviders.map((p) => p.provider),
        },
        isNewUser,
      },
      message: isNewUser ? "登入成功，已創建新用戶" : "登入成功",
    });
  } catch (err) {
    console.error("社交登入處理錯誤:", err);
    res.status(500).json({
      status: "error",
      message: "社交登入處理失敗",
      error: err.message,
    });
  }
});

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
    // 查詢使用者資料
    const sql = "SELECT id, email, created_at FROM `users` WHERE id = ?";
    const [rows] = await pool.execute(sql, [id]);

    // 如果找不到使用者，回傳錯誤
    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "找不到使用者資料",
      });
    }

    // 回傳使用者資料
    res.status(200).json({
      status: "success",
      data: rows[0],
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

export default router;
