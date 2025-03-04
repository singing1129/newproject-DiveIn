import express from "express";
import { pool } from "../../config/mysql.js";
import multer from "multer";
import path, { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// 設定 Multer 的儲存策略
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = resolve(__dirname, "../../../client/public/image/group");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 更新揪團資料的路由
router.put("/update", upload.single("file"), async (req, res) => {
  console.log("連接成功");
  try {
    // const { groupId } = req.params; // 從 URL 參數獲取 groupId
    const formData = req.body;
    console.log("表單資料:", formData);

    // 提取表單資料
    const {
      title,
      groupId,
      userId,
      gender,
      maxNumber,
      type,
      certificates,
      country,
      city,
      date,
      time,
      signEndDate,
      signEndTime,
      description,
    } = formData;

    // 檢查 groupId 是否有效
    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({ status: "error", message: "無效的 groupId" });
    }

    // 定義城市 ID 的映射函數
    const getCityId = () => {
      const cityMap = {
        1: { "屏東": 1, "台東": 2, "澎湖": 3, "綠島": 4, "蘭嶼": 5, "小琉球": 7, "其他": 8 },
        2: { "沖繩": 10, "石垣島": 11, "其他": 12 },
        3: { "長灘島": 13, "宿霧": 14, "薄荷島": 15, "其他": 16 },
        4: { "其他": 17 },
      };
      return cityMap[country]?.[city] || null; // 如果無匹配，返回 null
    };

    const groups_city_id = getCityId();
    if (!groups_city_id) {
      return res.status(400).json({ status: "error", message: "無效的城市選擇" });
    }

    // 組合 sign_end_date
    const sign_end_date = `${signEndDate} ${signEndTime}:00`;

    // 更新 groups 表的 SQL
    const sql = `
      UPDATE groups 
      SET 
        name = ?, 
        user_id = ?, 
        type = ?, 
        gender = ?, 
        certificates = ?, 
        groups_city_id = ?, 
        description = ?, 
        sign_end_date = ?, 
        max_number = ?, 
        date = ?, 
        time = ? 
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
      title,
      userId,
      type,
      gender,
      certificates,
      groups_city_id,
      description,
      sign_end_date,
      maxNumber,
      date,
      time,
      groupId,
    ]);

    // 檢查是否成功更新
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "未找到要更新的揪團" });
    }

    // 如果有新上傳的圖片，更新 groups_image 表
    if (req.file) {
      const imgName = req.file.filename;
      const imgUrl = `${imgName}`;

      // 檢查是否已有圖片記錄
      const [existingImg] = await pool.execute(
        "SELECT id FROM groups_image WHERE groups_id = ?",
        [groupId]
      );

      if (existingImg.length > 0) {
        // 如果已有圖片記錄，執行更新
        const sqlImgUpdate = `
          UPDATE groups_image 
          SET 
            name = ?, 
            img_url = ? 
          WHERE groups_id = ?
        `;
        await pool.execute(sqlImgUpdate, [title, imgUrl, groupId]);
      } else {
        // 如果沒有圖片記錄，插入新記錄
        const sqlImgInsert = `
          INSERT INTO groups_image (groups_id, name, img_url) 
          VALUES (?, ?, ?)
        `;
        await pool.execute(sqlImgInsert, [groupId, name, imgUrl]);
      }
    }

    res.status(200).json({
      status: "success",
      message: "揪團更新成功",
      groupId,
    });
  } catch (error) {
    console.error("更新失敗:", error);
    res.status(500).json({ status: "error", message: "伺服器錯誤", error: error.message });
  }
});

export default router;