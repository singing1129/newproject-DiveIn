// auth.js - JWT 驗證中間件
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// JWT 密鑰（在實際應用中應該存放在環境變數中）
const secretKey = process.env.JWT_SECRET_KEY;

// 檢查 API 請求的 JWT Token 是否有效
export function checkToken(req, res, next) {
  // 從請求標頭取得 Authorization 值
  let token = req.get("Authorization");

  // 如果沒有提供 token，返回錯誤
  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "無驗證資料，請重新登入",
    });
  }

  // 檢查 token 格式是否正確 (必須以 "Bearer " 開頭)
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "驗證資料格式錯誤，請重新登入",
    });
  }

  // 切割 token，移除 "Bearer " 前綴
  token = token.slice(7);

  // 使用 JWT 驗證 token 是否有效
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      // token 無效或已過期，返回錯誤
      return res.status(401).json({
        status: "error",
        message: "驗證資料已失效，請重新登入",
      });
    }

    // token 有效，將解碼後的使用者資訊存到 req.decoded
    req.decoded = decoded;

    // 繼續處理下一個中間件或路由處理器
    next();
  });
}