// routes/bundles/index.js
import express from "express";
import { pool } from "../../config/mysql.js";
const router = express.Router();

// 獲取所有組合包列表
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT pb.*, 
             SUM(pv.price * pbi.quantity) as original_total,
             (SELECT pi.image_url FROM product_images pi 
              WHERE pi.product_id = pbi.product_id AND pi.is_main = 1 
              LIMIT 1) as main_image
      FROM product_bundle pb
      JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id
      JOIN product_variant pv ON pbi.product_id = pv.product_id
      GROUP BY pb.id
    `;
    const [bundles] = await pool.execute(sql);
    res.json({ status: "success", data: bundles });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 獲取指定組合包詳情
router.get("/:id", async (req, res) => {
  try {
    // 1. 獲取組合包基本信息
    const bundleSql = `
        SELECT 
          pb.id, 
          pb.name, 
          pb.description, 
          pb.discount_price,
          SUM(pv.price * pbi.quantity) as original_total,
          b.name as brand_name
        FROM product_bundle pb
        JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id
        JOIN brand b ON pb.brand_id = b.id
        JOIN product_variant pv ON pbi.product_id = pv.product_id
        WHERE pb.id = ?
        GROUP BY pb.id
      `;
    const [bundleRows] = await pool.execute(bundleSql, [req.params.id]);

    if (bundleRows.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "找不到該組合包" });
    }

    const bundle = bundleRows[0];

    // 2. 獲取組合包內的商品詳情 - 精簡版
    const itemsSql = `
        SELECT 
          pbi.product_id,
          p.name as product_name, 
          pbi.quantity,
          pbi.variant_required,
          (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = 1 LIMIT 1) as main_image
        FROM product_bundle_items pbi
        JOIN product p ON pbi.product_id = p.id
        WHERE pbi.bundle_id = ?
      `;
    const [items] = await pool.execute(itemsSql, [req.params.id]);

    // 3. 獲取變體信息 - 精簡且結構清晰
    for (const item of items) {
      if (item.variant_required) {
        const variantsSql = `
            SELECT 
              pv.id,
              pv.price,
              pv.original_price,
              pv.stock,
              c.name as color,
              c.color_code,
              s.name as size
            FROM product_variant pv
            LEFT JOIN color c ON pv.color_id = c.id
            LEFT JOIN size s ON pv.size_id = s.id
            WHERE pv.product_id = ? AND pv.isDeleted = 0
          `;
        const [variants] = await pool.execute(variantsSql, [item.product_id]);
        item.variants = variants;
      }
    }

    bundle.items = items;
    res.json({ status: "success", data: bundle });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
