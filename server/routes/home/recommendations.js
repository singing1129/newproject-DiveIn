import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 首頁推薦路由
router.get("/", async (req, res) => {
    const { category, type } = req.query;
    const limit = 4;

    try {
        let sql = "";
        switch (category) {
            case "activity":
                sql = `
                    SELECT 
                        activity.*, 
                        activity_country.name AS country,
                        activity_city.name AS city_name, 
                        activity_image.img_url AS main_image
                    FROM activity
                    LEFT JOIN activity_city ON activity.activity_city_id = activity_city.id
                    LEFT JOIN activity_image ON activity.id = activity_image.activity_id AND activity_image.is_main = 1
                    LEFT JOIN activity_country ON activity_city.activity_country_id = activity_country.id
                    WHERE 1=1
                `;

                if (type && type !== "all") {
                    sql += ` AND activity.type = ${type}`;
                }

                // 隨機排序並限制 4 筆資料
                sql += ` ORDER BY RAND() LIMIT ?`;
                break;

            default:
                return res.status(400).json({
                    status: "error",
                    message: "Invalid category",
                });
        }

        console.log("Generated SQL:", sql); // 調試訊息：輸出生成的 SQL 語句

        const [rows] = await pool.execute(sql, [limit]);
        res.status(200).json({
            status: "success",
            data: rows,
            message: "取得資料成功",
        });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({
            status: "error",
            message: error.message ? error.message : "取得資料失敗",
        });
    }
});

export default router;