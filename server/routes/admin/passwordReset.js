// routes/admin/passwordReset.js
import express from "express";
import { sendOtpMail } from "../../lib/mail.js"; // 引入發送郵件的函式
import { pool } from "../../config/mysql.js"; // 引入資料庫連線
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = express.Router();

// 發送重設密碼郵件
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: "error", message: "請提供 Email" });
  }

  try {
    // 檢查 email 是否存在
    const [user] = await pool.execute("SELECT * FROM `users` WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(400).json({ status: "error", message: "Email 不存在" });
    }

    const otp = crypto.randomBytes(3).toString("hex"); // 產生 OTP
    const resetSecret = crypto.randomBytes(20).toString("hex"); // 產生唯一的重設密碼 secret
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // OTP 有效期為 5 分鐘

    // 儲存 OTP、resetSecret 和過期時間
    await pool.execute(
      "UPDATE `users` SET otp = ?, otp_expiration = ?, resetSecret = ? WHERE email = ?",
      [otp, otpExpiration, resetSecret, email]
    );

    // 產生重設密碼的完整 URL
    const resetUrl = `http://localhost:3000/admin/reset?secret=${resetSecret}`;

    // 發送 OTP 郵件，包含重設鏈接
    await sendOtpMail(email, otp, resetSecret);

    res.status(200).json({ status: "success", message: "重設密碼郵件已發送" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "無法處理請求" });
  }
});

// 驗證 OTP
router.post("/verify-otp", async (req, res) => {
  const { otp, secret } = req.body;

  console.log("接收到的OTP驗證請求:", { otp, secret }); // 偵錯日誌

  if (!otp || !secret) {
    return res.status(400).json({ status: "error", message: "請提供完整資訊" });
  }

  try {
    // 步驟1: 先檢查secret是否有效，而不考慮OTP和過期時間
    const [userCheck] = await pool.execute(
      "SELECT * FROM `users` WHERE resetSecret = ?",
      [secret]
    );

    console.log("找到用戶資料:", userCheck.length > 0); // 偵錯日誌

    if (userCheck.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "無效的重設請求" });
    }

    // 步驟2: 獲取用戶的OTP和過期時間，用於詳細診斷
    const userOtp = userCheck[0].otp;
    const otpExpiration = userCheck[0].otp_expiration;
    const currentTime = new Date();

    console.log("診斷資訊:", {
      用戶OTP: userOtp,
      輸入OTP: otp,
      OTP匹配: userOtp === otp,
      過期時間: otpExpiration,
      當前時間: currentTime,
      是否過期: new Date(otpExpiration) <= currentTime,
    });

    // 步驟3: 檢查OTP是否匹配
    if (userOtp !== otp) {
      return res.status(400).json({ status: "error", message: "驗證碼錯誤" });
    }

    // 步驟4: 檢查是否過期
    if (new Date(otpExpiration) <= currentTime) {
      return res.status(400).json({ status: "error", message: "驗證碼已過期" });
    }

    // 驗證通過
    res.status(200).json({ status: "success", message: "OTP 驗證成功" });
  } catch (err) {
    console.error("OTP 驗證錯誤:", err);
    res
      .status(500)
      .json({ status: "error", message: "無法驗證 OTP，伺服器錯誤" });
  }
});

// 重設密碼
router.post("/reset", async (req, res) => {
  const { newPassword, secret } = req.body;

  if (!newPassword || !secret) {
    return res.status(400).json({ status: "error", message: "請提供完整資訊" });
  }

  try {
    // 根據 secret 查詢對應的用戶
    const [user] = await pool.execute(
      "SELECT * FROM `users` WHERE resetSecret = ?",
      [secret]
    );

    if (user.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "重設連結無效或已過期" });
    }

    const email = user[0].email; // 從資料庫中取得 email
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密碼並清除 `resetSecret` 和 OTP
    await pool.execute(
      "UPDATE `users` SET password = ?, resetSecret = NULL, otp = NULL, otp_expiration = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    res
      .status(200)
      .json({ status: "success", message: "密碼已更新，請使用新密碼登入" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "無法重設密碼" });
  }
});

// 根據 secret 獲取用戶郵箱（用於前端重發 OTP）
router.get("/get-email", async (req, res) => {
  const { secret } = req.query;

  if (!secret) {
    return res.status(400).json({ status: "error", message: "缺少必要參數" });
  }

  try {
    const [user] = await pool.execute(
      "SELECT email FROM `users` WHERE resetSecret = ?",
      [secret]
    );

    if (user.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "找不到對應的用戶" });
    }

    // 只返回郵箱信息，不包含其他敏感數據
    res.status(200).json({
      status: "success",
      email: user[0].email,
    });
  } catch (err) {
    console.error("獲取用戶郵箱失敗:", err);
    res.status(500).json({ status: "error", message: "伺服器錯誤" });
  }
});

// 重發 OTP
router.post("/resend-otp", async (req, res) => {
  const { secret, email } = req.body;

  if (!secret || !email) {
    return res.status(400).json({ status: "error", message: "缺少必要參數" });
  }

  try {
    // 檢查 secret 和 email 是否匹配
    const [user] = await pool.execute(
      "SELECT * FROM `users` WHERE resetSecret = ? AND email = ?",
      [secret, email]
    );

    if (user.length === 0) {
      return res.status(404).json({ status: "error", message: "無效的請求" });
    }

    // 生成新的 OTP
    const otp = crypto.randomBytes(3).toString("hex");
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 分鐘有效期

    // 更新數據庫中的 OTP 和過期時間
    await pool.execute(
      "UPDATE `users` SET otp = ?, otp_expiration = ? WHERE email = ?",
      [otp, otpExpiration, email]
    );

    // 生成重設密碼的完整 URL - 修正 URL 中的問號
    const resetUrl = `http://localhost:3000/admin/reset?secret=${secret}`;

    // 發送新的 OTP 郵件
    await sendOtpMail(email, otp, otpExpiration, resetUrl);

    res.status(200).json({ status: "success", message: "驗證碼已重新發送" });
  } catch (err) {
    console.error("重發 OTP 失敗:", err);
    res.status(500).json({ status: "error", message: "無法重發驗證碼" });
  }
});

// 導出路由
export default router;
