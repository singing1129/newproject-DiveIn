import express from "express";
import { pool } from "../../config/mysql.js";
const router = express.Router();

router.get("/list", async (req, res) => {
    console.log(req.query);
    // 從前端送來的網址抓取的篩選條件
    // 頁數
    const page = parseInt(req.query.page) || 1;
    // 每頁幾筆
    const limit = parseInt(req.query.limit) || 24;
    // 城市
    const location = parseInt(req.query.location);
    // 國家
    const country = req.query.country;
    // 證照資格
    const certificates = req.query.certificates;
    // 揪團狀態
    const status = req.query.status ;
    // 查詢區間
    const startDate = req.query.startDate
    const endDate = req.query.endDate 
    // 查詢揪團類型
    const type = req.query.type


    // 設定當頁第一項資料
    const firstGroup = (page - 1) * limit;
    // 取得產品總數
    const [[{ totalCount }]] = await pool.execute(`
        SELECT COUNT(*) AS totalCount FROM groups
      `);
      const totalPages = Math.ceil(totalCount / limit);


    // 設定排序
    const sort = parseInt(req.query.sort) || 1;
    let orderBy = "id ASC";
    if (sort === 2) orderBy = "created_at DESC";
    if (sort === 3) orderBy = "max_number ASC";
    if (sort === 4) orderBy = "max_number DESC";
    if (sort === 5) orderBy = "date ASC";
    try {
        // res.json({message:"連接成功"})
        let sql = `SELECT groups.*, activity_city.name AS city_name, groups_image.img_url AS group_img , COUNT(groups_participants.id) AS participant_number FROM groups
        LEFT JOIN activity_city ON groups.groups_city_id = activity_city.id
        LEFT JOIN groups_image ON groups.id = groups_image.groups_id
        LEFT JOIN groups_participants ON groups_participants.groups_id = groups.id
        JOIN activity_country ON activity_city.activity_country_id = activity_country.id
        WHERE 1 
         `;
         if (location) {
            sql += ` AND groups.groups_city_id = ${location} `
        }
        if (country) {
            sql += ` AND activity_country.name LIKE '%${country}%' `;
        }
        if (certificates) {
            // 確保 certificates 是陣列，如果不是，就轉換成陣列
            const certificatesArray = Array.isArray(certificates)
                ? certificates
                : [certificates];
            if (certificatesArray.length > 1) {
                const certificatesCondition = certificatesArray
                    .map((v) => {
                        return `groups.certificates = ${v}`;
                    })
                    .join(" OR ");
                sql += ` AND (${certificatesCondition}) `;
                console.log(sql);
            } else {
                sql += ` AND groups.certificates = ${certificatesArray[0]} `;
            }
        }
        if (status) {
            // 確保 status 是陣列，如果不是，就轉換成陣列
            const statusArray = Array.isArray(status)
                ? status
                : [status];
            if (statusArray.length > 1) {
                const statusCondition =statusArray
                    .map((v) => {
                        return `groups.status = ${v}`;
                    })
                    .join(" OR ");
                sql += ` AND (${statusCondition}) `;
                console.log(sql);
            } else {
                sql += ` AND groups.status = ${statusArray[0]} `;
            }
        }
        if(startDate && endDate){
            sql += ` AND groups.date BETWEEN '${startDate}' AND '${endDate}' `
        }
        if(type){
            sql += ` AND groups.type = ${type} `
        }

        sql += ` 
        GROUP BY groups.id, activity_city.name, groups_image.img_url
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${firstGroup} `

        console.log(sql);
        const [rows] = await pool.execute(sql);
        // console.log(rows[0]);
        res.status(200).json({
            status: "success",
            message: "成功獲取資料",
            data: rows,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message ? error.message : "取得資料失敗",
        });
    }
});

export default router;
