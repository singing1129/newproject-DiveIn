import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 首頁推薦路由
router.get("/", async (req, res) => {
  const { category, type } = req.query;
  const limit = 4;

  try {
    let sql = "";
    let params = [limit];

    switch (category) {
      case "activity":
        sql = `
          SELECT 
            activity.id,
            activity.name,
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
          sql += ` AND activity.type = ?`;
          params.unshift(type);
        }

        sql += ` ORDER BY RAND() LIMIT ?`;
        break;

      case "product":
        sql = `
          SELECT 
            product.id,
            product.name,
            brand.name AS brand_name,
            product_images.image_url AS main_image,
            'product' AS type
          FROM product
          LEFT JOIN brand ON product.brand_id = brand.id
          LEFT JOIN product_images ON product.id = product_images.product_id AND product_images.is_main = 1
          WHERE 1=1
        `;

        if (type && type !== "all") {
          sql += ` AND product.type = ?`; // 若無 type 欄位可移除
          params.unshift(type);
        }

        sql += ` ORDER BY RAND() LIMIT ?`;
        break;

      case "rent":
        sql = `
          SELECT 
            rent_item.id,
            rent_item.name,
            rent_item.price,
            rent_item.price2,
            rent_brand.name AS brand_name,
            rent_image.img_url AS main_image,
            'rent' AS type
          FROM rent_item
          LEFT JOIN rent_specification ON rent_item.id = rent_specification.rent_item_id
          LEFT JOIN rent_brand ON rent_specification.brand_id = rent_brand.id
          LEFT JOIN rent_image ON rent_item.id = rent_image.rent_item_id AND rent_image.is_main = 1
          WHERE 1=1
        `;

        if (type && type !== "all") {
          sql += ` AND rent_item.type = ?`; // 若無 type 欄位可移除
          params.unshift(type);
        }

        sql += ` ORDER BY RAND() LIMIT ?`;
        break;

      default:
        return res.status(400).json({
          status: "error",
          message: "Invalid category. Must be 'activity', 'product', or 'rent'",
        });
    }

    console.log("Generated SQL:", sql);
    console.log("Query params:", params);

    const [rows] = await pool.execute(sql, params);
    res.status(200).json({
      status: "success",
      data: rows,
      message: "取得資料成功",
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "取得資料失敗",
    });
  }
});

export default router;