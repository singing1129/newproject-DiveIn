// routes/products/all.js
import express from "express";
import { pool } from "../../config/mysql.js";
import {
  buildProductQuery,
  parseProductColors,
} from "../../helpers/productQuery.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;
    const sort = parseInt(req.query.sort) || 1;

    // 默認就包含 bundles，除非明確指定不包含
    const excludeBundles = req.query.exclude === "bundles";

    // 建立查詢條件
    const { sql, queryParams } = buildProductQuery({
      brandId: req.query.brand_id,
      categoryId: req.query.category_id,
      bigCategoryId: req.query.big_category_id,
      colorIds: req.query.color_id
        ? req.query.color_id.split(",").map(Number)
        : [],
      minPrice: req.query.min_price,
      maxPrice: req.query.max_price,
      sort,
      offset,
      limit: excludeBundles ? limit : Math.floor(limit * 0.7), // 如果包含組合包，則產品數量減少
    });

    const [rows] = await pool.execute(sql, queryParams);
    const products = parseProductColors(rows).map((product) => ({
      ...product,
      item_type: "product",
    }));

    let items = products;
    let totalItems = products.length;
    let bundlesCount = 0;

    // 默認包含組合包
    if (!excludeBundles) {
      let bundleWhereClause = "WHERE 1=1";
      const bundleParams = [];

      // 品牌篩選
      if (req.query.brand_id) {
        bundleWhereClause += " AND pb.brand_id = ?";
        bundleParams.push(req.query.brand_id);
      }

      // 價格篩選
      if (req.query.min_price) {
        bundleWhereClause += " AND pb.discount_price >= ?";
        bundleParams.push(parseFloat(req.query.min_price));
      }

      if (req.query.max_price) {
        bundleWhereClause += " AND pb.discount_price <= ?";
        bundleParams.push(parseFloat(req.query.max_price));
      }

      // 顏色篩選 - 篩選包含指定顏色產品的套裝
      const colorIds = req.query.color_id
        ? req.query.color_id.split(",").map(Number)
        : [];
      if (colorIds.length > 0) {
        bundleWhereClause += ` AND EXISTS (
          SELECT 1 FROM product_bundle_items pbi2
          JOIN product_variant pv2 ON pbi2.product_id = pv2.product_id
          WHERE pbi2.bundle_id = pb.id 
          AND pv2.color_id IN (${colorIds.map(() => "?").join(",")})
        )`;
        bundleParams.push(...colorIds);
      }

      // 排序
      let bundleOrderBy = "pb.id DESC"; // 默認排序
      switch (parseInt(req.query.sort) || 1) {
        case 2: // 最新上架
          bundleOrderBy = "pb.createdAt ASC";
          break;
        case 3: // 價格由低到高
          bundleOrderBy = "pb.discount_price ASC";
          break;
        case 4: // 價格由高到低
          bundleOrderBy = "pb.discount_price DESC";
          break;
      }

      const bundlesSql = `
        SELECT 
          pb.id, 
          pb.name, 
          pb.description,
          b.name as brand_name,
          pb.discount_price AS price,
           (
          SELECT SUM(min_prices.min_price * pbi.quantity)
          FROM product_bundle_items pbi
          JOIN (
            -- 為每個商品找到最低價格的變體
            SELECT product_id, MIN(price) as min_price
            FROM product_variant
            WHERE isDeleted = 0
            GROUP BY product_id
          ) as min_prices ON pbi.product_id = min_prices.product_id
          WHERE pbi.bundle_id = pb.id
        ) as original_price,
          (SELECT pi.image_url FROM product_images pi 
           JOIN product_bundle_items pbi2 ON pi.product_id = pbi2.product_id
           WHERE pbi2.bundle_id = pb.id AND pi.is_main = 1 
           LIMIT 1) AS main_image,
          'bundle' AS item_type
        FROM product_bundle pb
        JOIN brand b ON pb.brand_id = b.id
        JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id
        JOIN product_variant pv ON pbi.product_id = pv.product_id
        ${bundleWhereClause}
        GROUP BY pb.id
        ORDER BY ${bundleOrderBy}
        LIMIT ? OFFSET ?
      `;

      // 添加分頁參數
      bundleParams.push(Math.ceil(limit * 0.3), offset);

      const [bundles] = await pool.execute(bundlesSql, bundleParams);

      // 計算符合條件的bundle總數
      const bundlesCountSql = `
        SELECT COUNT(DISTINCT pb.id) AS count
        FROM product_bundle pb
        JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id
        JOIN product_variant pv ON pbi.product_id = pv.product_id
        ${bundleWhereClause}
      `;

      const [bundlesCountResult] = await pool.execute(
        bundlesCountSql,
        bundleParams.slice(0, -2) // 移除LIMIT和OFFSET參數
      );

      bundlesCount = bundlesCountResult[0].count;

      // 合併產品和組合包
      items = [...products, ...bundles];
      totalItems = products.length + bundlesCount;

      // 手動排序合併後的結果（如果使用價格排序）
      if (sort === 3 || sort === 4) {
        items.sort((a, b) => {
          const priceA = parseFloat(a.price || 0);
          const priceB = parseFloat(b.price || 0);
          return sort === 3 ? priceA - priceB : priceB - priceA;
        });
      }
    }

    // 計算總項目數和分頁
    // 在 all.js 文件的相關部分添加這行代碼，定義 colorIds 變量
    const colorIds = req.query.color_id
      ? req.query.color_id.split(",").map(Number)
      : [];

    // 然後修改 countSql 構建邏輯
    const countSql = `
  SELECT COUNT(DISTINCT p.id) AS count
  FROM product p
  LEFT JOIN product_variant pv ON p.id = pv.product_id AND pv.isDeleted = 0
  LEFT JOIN color c ON pv.color_id = c.id
  WHERE 1=1
  ${req.query.brand_id ? " AND p.brand_id = ?" : ""}
  ${req.query.category_id ? " AND p.category_id = ?" : ""}
  ${
    req.query.big_category_id
      ? " AND p.category_id IN (SELECT id FROM category_small WHERE category_big_id = ?)"
      : ""
  }
  ${
    colorIds.length > 0
      ? ` AND p.id IN (SELECT pv.product_id FROM product_variant pv WHERE pv.color_id IN (${colorIds
          .map(() => "?")
          .join(",")}) AND pv.isDeleted = 0)`
      : ""
  }
  ${
    req.query.min_price
      ? " AND EXISTS (SELECT 1 FROM product_variant pv2 WHERE pv2.product_id = p.id AND pv2.price >= ? AND pv2.isDeleted = 0)"
      : ""
  }
  ${
    req.query.max_price
      ? " AND EXISTS (SELECT 1 FROM product_variant pv3 WHERE pv3.product_id = p.id AND pv3.price <= ? AND pv3.isDeleted = 0)"
      : ""
  }
`;

    // 構建新的參數數組
    const countParams = [];
    if (req.query.brand_id) countParams.push(req.query.brand_id);
    if (req.query.category_id) countParams.push(req.query.category_id);
    if (req.query.big_category_id) countParams.push(req.query.big_category_id);
    if (colorIds.length > 0) countParams.push(...colorIds);
    if (req.query.min_price) countParams.push(parseFloat(req.query.min_price));
    if (req.query.max_price) countParams.push(parseFloat(req.query.max_price));

    const [countResult] = await pool.execute(countSql, countParams);

    const productCount = countResult[0].count;
    const totalPages = Math.ceil(
      (productCount + (excludeBundles ? 0 : bundlesCount)) / limit
    );

    res.json({
      status: "success",
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
