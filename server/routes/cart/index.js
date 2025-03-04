import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  const {
    userId,
    type,
    variantId,
    projectId,
    rentalId,
    bundleId, // 新增bundle ID參數
    quantity,
    startDate,
    endDate,
    date,
    time,
    color,
    rentalBrand,
  } = req.body;

  try {
    // 1. 基本驗證
    if (!["product", "activity", "rental", "bundle"].includes(type)) {
      // 添加bundle類型
      return res
        .status(400)
        .json({ success: false, message: "無效的商品類型" });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "數量必須大於0" });
    }

    // 2. 檢查購物車是否存在
    let [cart] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    let cartId = cart.length > 0 ? cart[0].id : null;

    // 如果購物車不存在，創建新的
    if (!cartId) {
      const [result] = await pool.execute(
        "INSERT INTO carts (user_id, status) VALUES (?, 'active')",
        [userId]
      );
      cartId = result.insertId;
    }

    // 3. 根據類型處理不同商品
    switch (type) {
      case "product": {
        // 檢查商品變體是否存在
        const [variant] = await pool.execute(
          "SELECT * FROM product_variant WHERE id = ? AND isDeleted = 0",
          [variantId]
        );

        // 沒有回傳 [] 所以不能用 !variant
        if (variant.length === 0) {
          return res.status(400).json({
            success: false,
            message: "找不到指定商品",
          });
        }

        // 檢查是否已在購物車中
        const [existingItem] = await pool.execute(
          "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?",
          [cartId, variantId]
        );

        //代表購物車有這個variant_id
        if (existingItem.length > 0) {
          // 直接設置為新數量，而不是累加
          await pool.execute(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [quantity, existingItem[0].id]
          );
        } else {
          // 新增項目
          await pool.execute(
            "INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)",
            [cartId, variantId, quantity]
          );
        }
        break;
      }

      case "bundle": {
        // 检查bundle是否存在
        const [bundle] = await pool.execute(
          "SELECT * FROM product_bundle WHERE id = ?",
          [bundleId]
        );

        if (bundle.length === 0) {
          return res.status(400).json({
            success: false,
            message: "找不到指定套组",
          });
        }

        // 获取套组中的所有商品
        const [bundleItems] = await pool.execute(
          "SELECT * FROM product_bundle_items WHERE bundle_id = ?",
          [bundleId]
        );

        if (bundleItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: "该套组不包含任何商品",
          });
        }

        // 对于每个套组商品，添加到购物车
        for (const bundleItem of bundleItems) {
          // 检查该商品的默认变体
          const [defaultVariant] = await pool.execute(
            `SELECT pv.id 
             FROM product_variant pv 
             WHERE pv.product_id = ? AND pv.isDeleted = 0
             LIMIT 1`,
            [bundleItem.product_id]
          );

          if (defaultVariant.length === 0) {
            continue; // 如果沒有有效變體，則跳過此產品
          }

          const variantId = defaultVariant[0].id;
          // 計算實際數量：bundle項數量 * 添加的bundle數量
          const itemQuantity = bundleItem.quantity * quantity;

          // 檢查是否已在購物車中
          const [existingItem] = await pool.execute(
            "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ? AND bundle_id = ?",
            [cartId, variantId, bundleId]
          );

          if (existingItem.length > 0) {
            // 更新現有項目
            await pool.execute(
              "UPDATE cart_items SET quantity = ? WHERE id = ?",
              [itemQuantity, existingItem[0].id]
            );
          } else {
            // 新增項目，包含bundle_id
            await pool.execute(
              "INSERT INTO cart_items (cart_id, variant_id, quantity, bundle_id) VALUES (?, ?, ?, ?)",
              [cartId, variantId, itemQuantity, bundleId]
            );
          }
        }
        break;
      }

      case "activity": {
        if (!date || !time) {
          return res.status(400).json({
            success: false,
            message: "活動必須包含日期和時間",
          });
        }
        // 驗證時間和日期格式 到時候統一

        // 檢查活動專案是否存在與有效
        const [project] = await pool.execute(
          `SELECT ap.*, a.name, a.type
           FROM activity_project ap
           JOIN activity a ON ap.activity_id = a.id
           WHERE ap.id = ?`,
          [projectId]
        );
        // console.log("查看活動", project);

        if (project.length === 0) {
          return res.status(400).json({
            success: false,
            message: "找不到指定活動",
          });
        }

        // 驗證日期範圍 建構子new Date()會比較好去比較
        const selectedDate = new Date(date);
        const earliestDate = new Date(project[0].earliestDate);
        const projectDate = new Date(project[0].date);
        console.log("selectedDate", selectedDate);
        console.log("earliestDate", earliestDate);
        console.log("projectDate", projectDate);

        if (selectedDate < earliestDate || selectedDate > projectDate) {
          return res.status(400).json({
            success: false,
            message: `活動「${project[0].name}」只能在 ${project[0].earliestDate} 到 ${project[0].date} 之間預訂`,
          });
        }

        // 檢查是否已在購物車中（相同使用者、活動、日期和時間）
        //相同使用者 = 同一台購物車
        const [existingItem] = await pool.execute(
          `SELECT cai.id, cai.quantity
           FROM cart_activity_items cai
           JOIN carts c ON cai.cart_id = c.id
           WHERE cai.cart_id = ?
           AND cai.activity_project_id = ?
           AND cai.date = ?
           AND cai.time = ?`,
          [cartId, projectId, date, time]
        );

        if (existingItem.length > 0) {
          // 更新數量
          await pool.execute(
            "UPDATE cart_activity_items SET quantity = ? WHERE id = ?",
            [quantity, existingItem[0].id]
          );
        } else {
          // 新增項目
          await pool.execute(
            `INSERT INTO cart_activity_items 
             (cart_id, activity_project_id, quantity, date, time) 
             VALUES (?, ?, ?, ?, ?)`,
            [cartId, projectId, quantity, date, time]
          );
        }
        break;
      }

      case "rental": {
        // 從請求中獲取顏色和品牌名稱
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            message: "租借商品需要起始和結束日期",
          });
        }

        // 日期有效性驗證
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "日期格式不正確",
          });
        }

        if (start < today) {
          return res.status(400).json({
            success: false,
            message: "起始日期不能早於今天",
          });
        }

        if (end <= start) {
          return res.status(400).json({
            success: false,
            message: "結束日期必須晚於起始日期",
          });
        }

        // 數量驗證
        const quantity = parseInt(req.body.quantity, 10);
        if (isNaN(quantity) || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: "數量必須是有效的正整數",
          });
        }

        // 檢查租借商品是否存在
        const [rental] = await pool.execute(
          "SELECT * FROM rent_item WHERE id = ? AND is_deleted = 0",
          [rentalId]
        );

        if (rental.length === 0) {
          return res.status(400).json({
            success: false,
            message: "找不到指定租借商品",
          });
        }

        // 簡化的庫存檢查 - 只檢查基本庫存
        const stock =
          rental[0].stock === null ? Infinity : parseInt(rental[0].stock, 10);
        if (isNaN(stock)) {
          console.error("庫存數據異常:", rental[0].stock);
          return res
            .status(500)
            .json({ success: false, message: "庫存數據異常" });
        }

        //檢查此次租借數量是否超過庫存
        if (stock < quantity) {
          return res.status(400).json({
            success: false,
            message: "商品庫存不足",
          });
        }

        // 檢查購物車內是否已有相同商品、日期以及顏色
        const [existingItem] = await pool.execute(
          `SELECT id, quantity 
           FROM cart_rental_items 
           WHERE cart_id = ? 
           AND rental_id = ? 
           AND start_date = ? 
           AND end_date = ? 
           AND color = ?`,
          [cartId, rentalId, startDate, endDate, color]
        );

        if (existingItem.length > 0) {
          // 更新數量
          await pool.execute(
            "UPDATE cart_rental_items SET quantity = ? WHERE id = ?",
            [quantity, existingItem[0].id]
          );
        } else {
          // 新增項目
          await pool.execute(
            `INSERT INTO cart_rental_items 
             (cart_id, rental_id, start_date, end_date, quantity, color) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [cartId, rentalId, startDate, endDate, quantity, color || null]
          );
        }
        break;
      }
    }

    return res.status(200).json({
      success: true,
      message: "商品已加入購物車",
    });
  } catch (error) {
    console.error("加入購物車失敗:", error);
    res.status(500).json({ success: false, message: "加入購物車失敗" });
  }
});

// 查詢特定user的購物車內容 購物車專用api
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. 檢查user是否有活動購物車
    const [cart] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    if (cart.length === 0) {
      return res.json({
        success: true,
        data: {
          products: [],
          activities: [],
          rentals: [],
          bundles: [], // 新增空的bundles陣列
          total: {
            products: 0,
            activities: 0,
            rentals: {
              rental_fee: 0,
              deposit: 0,
            },
            bundles: 0, // 新增bundles總金額
            final: 0,
          },
        },
      });
    }

    const cartId = cart[0].id;

    // 2. 獲取一般商品 (非套組的產品)
    const [products] = await pool.execute(
      `SELECT 
        ci.id,
        ci.quantity,
        pv.id AS variant_id,
        pv.price,
        pv.original_price,
        p.name AS product_name,
        p.id AS product_id,
        c.name AS color_name,
        s.name AS size_name,
        pi.image_url
      FROM cart_items ci
      JOIN product_variant pv ON ci.variant_id = pv.id
      JOIN product p ON pv.product_id = p.id
      JOIN color c ON pv.color_id = c.id
      JOIN size s ON pv.size_id = s.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      WHERE ci.cart_id = ? AND ci.bundle_id IS NULL`,
      [cartId]
    );

    // 3. 獲取活動項目
    const [activities] = await pool.execute(
      `SELECT 
        cai.id,
        cai.quantity,
        cai.date,
        cai.time,
        ap.id AS project_id,
        ap.price,
        ap.original_price AS original_price,
        ap.name AS project_name,
        a.name AS activity_name,
        a.id AS activity_id,
        ai.img_url AS image_url
      FROM cart_activity_items cai
      JOIN activity_project ap ON cai.activity_project_id = ap.id
      JOIN activity a ON ap.activity_id = a.id
      LEFT JOIN activity_image ai ON a.id = ai.activity_id AND ai.is_main = 1
      WHERE cai.cart_id = ?`,
      [cartId]
    );

    // 4. 獲取租借項目並計算租期
    const [rentals] = await pool.execute(
      `SELECT 
        cri.id,
        cri.quantity,
        cri.start_date,
        cri.end_date,
        rb.name AS rentalBrand,
        ri.id AS rental_id,
        ri.name AS rental_name,
        ri.price,
        ri.price2 AS discounted_price,
        ri.deposit,
        rim.img_url AS image_url,
        DATEDIFF(cri.end_date, cri.start_date) + 1 AS rental_days,
        cri.color
        FROM cart_rental_items cri
        JOIN rent_item ri ON cri.rental_id = ri.id
        JOIN rent_specification rs ON ri.id = rs.rent_item_id
        JOIN rent_brand rb ON rs.brand_id = rb.id
        LEFT JOIN rent_image rim ON ri.id = rim.rent_item_id AND rim.is_main = 1
        WHERE cri.cart_id = ?
        GROUP BY cri.id`,
      [cartId]
    );

    // 5. 新增: 獲取套組商品
    const [bundleGroups] = await pool.execute(
      `SELECT DISTINCT 
        ci.bundle_id,
        pb.name AS bundle_name,
        pb.description AS bundle_description,
        pb.discount_price,
        COUNT(DISTINCT ci.id) as item_count,
        MIN(ci.quantity / pbi.quantity) as bundle_quantity
      FROM cart_items ci
      JOIN product_bundle pb ON ci.bundle_id = pb.id
      JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id AND pbi.product_id = (
        SELECT product_id FROM product_variant WHERE id = ci.variant_id
      )
      WHERE ci.cart_id = ? AND ci.bundle_id IS NOT NULL
      GROUP BY ci.bundle_id`,
      [cartId]
    );

    // 6. 獲取每個套組中的所有商品
    const bundles = [];
    for (const bundle of bundleGroups) {
      const [bundleItems] = await pool.execute(
        `SELECT 
      ci.id,
      ci.quantity,
      pv.id AS variant_id,
      pv.price,
      pv.original_price,
      p.name AS product_name,
      p.id AS product_id,
      c.name AS color_name,
      s.name AS size_name,
      pi.image_url,
      pbi.quantity AS bundle_item_quantity
    FROM cart_items ci
    JOIN product_variant pv ON ci.variant_id = pv.id
    JOIN product p ON pv.product_id = p.id
    JOIN color c ON pv.color_id = c.id
    JOIN size s ON pv.size_id = s.id
    JOIN product_bundle_items pbi ON ci.bundle_id = pbi.bundle_id AND pbi.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
    WHERE ci.cart_id = ? AND ci.bundle_id = ?`,
        [cartId, bundle.bundle_id]
      );

      // 計算套組總價
      const originalTotal = bundleItems.reduce(
        (sum, item) => sum + item.price * (item.bundle_item_quantity || 1),
        0
      );

      bundles.push({
        id: bundle.bundle_id,
        name: bundle.bundle_name,
        description: bundle.bundle_description,
        items: bundleItems,
        original_total: originalTotal,
        discount_price: Number(bundle.discount_price),
        quantity: Number(bundle.bundle_quantity || 1), // 使用計算出的套組數量
      });
    }

    // 開始結構處理租借商品
    const processedRentals = rentals.map((item) => {
      // 特價允許null
      // 使用特價價格，如果沒有特價就用原價
      const pricePerDay = item.discounted_price || item.price;
      // 租借總費用=單價*數量*總天數
      const rentalFee = pricePerDay * item.rental_days * item.quantity;

      // nana新增：每日押金 = 單價的 30%
      const deposit = pricePerDay * 0.3;

      // nana新增：押金總費用 = 押金 * 數量 * 總天數
      const depositFee = deposit * item.quantity * item.rental_days;

      return {
        ...item,
        price_per_day: pricePerDay,
        rental_fee: rentalFee, //租借總費用
        deposit_fee: depositFee, // 直接使用資料庫的押金（先簡單計算，再看要不要根據天數變化去計算）
        subtotal: rentalFee + depositFee, //總押金＋租借費用=總費用
        brand_name: item.brand_name,
      };
    });

    // 7. 計算各類總價
    const calculateProductTotal = (items) => {
      return items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    };

    const calculateBundleTotal = (items) => {
      return items.reduce((acc, curr) => acc + curr.discount_price, 0);
    };

    const calculateRentalTotals = (items) => {
      return items.reduce(
        (acc, curr) => ({
          rental_fee: acc.rental_fee + curr.rental_fee,
          deposit: acc.deposit + curr.deposit_fee,
        }),
        { rental_fee: 0, deposit: 0 }
      );
    };

    const productTotal = calculateProductTotal(products);
    const activityTotal = calculateProductTotal(activities);
    const bundleTotal = calculateBundleTotal(bundles);
    const rentalTotals = calculateRentalTotals(processedRentals);

    // 全部組裝起來
    const data = {
      products: products.map((item) => ({
        ...item,
        subtotal: item.price * item.quantity,
      })),
      activities: activities.map((item) => ({
        ...item,
        subtotal: item.price * item.quantity,
      })),
      rentals: processedRentals,
      bundles: bundles, // 新增bundles數組
      total: {
        products: productTotal,
        activities: activityTotal,
        bundles: Number(bundleTotal), // 確保是數字
        rentals: rentalTotals,
        // 最終總金額（包含套組價格和租借費用但不包含押金）
        final:
          Number(productTotal) +
          Number(activityTotal) +
          Number(bundleTotal) +
          Number(rentalTotals.rental_fee),
      },
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("獲取購物車內容失敗:", error);
    res.status(500).json({
      success: false,
      message: "獲取購物車內容失敗",
    });
  }
});

// 在刪除的路由中也需要處理bundle類型
router.delete("/remove", async (req, res) => {
  const { userId, type, itemIds } = req.body;

  try {
    // 1. 基本驗證
    if (
      !userId ||
      !type ||
      !itemIds ||
      !Array.isArray(itemIds) ||
      itemIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "無效的請求參數",
      });
    }

    // 2. 檢查購物車是否存在
    const [cart] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "找不到購物車",
      });
    }

    const cartId = cart[0].id;

    // 3. 根據類型刪除不同表格中的項目
    let tableName;
    switch (type) {
      case "product":
        tableName = "cart_items";
        break;
      case "activity":
        tableName = "cart_activity_items";
        break;
      case "rental":
        tableName = "cart_rental_items";
        break;
      case "bundle":
        // 對於bundle，我們需要刪除所有相關的cart_items
        for (const bundleId of itemIds) {
          await pool.execute(
            "DELETE FROM cart_items WHERE cart_id = ? AND bundle_id = ?",
            [cartId, bundleId]
          );
        }
        return res.json({
          success: true,
          message: "套組已從購物車中移除",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "無效的商品類型",
        });
    }

    // 4. 刪除選中的項目
    const placeholders = itemIds.map(() => "?").join(",");
    const query = `DELETE FROM ${tableName} WHERE cart_id = ? AND id IN (${placeholders})`;

    await pool.execute(query, [cartId, ...itemIds]);

    res.json({
      success: true,
      message: "商品已從購物車中移除",
    });
  } catch (error) {
    console.error("刪除購物車項目失敗:", error);
    res.status(500).json({
      success: false,
      message: "刪除購物車項目失敗",
    });
  }
});

// 更新購物車內容也需要處理bundle
router.put("/update", async (req, res) => {
  const {
    userId,
    type,
    itemId,
    quantity,
    variantId,
    date,
    time,
    startDate,
    endDate,
  } = req.body;

  try {
    // 1. 基本驗證
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "未提供使用者ID",
      });
    }

    if (!["product", "activity", "rental", "bundle"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "無效的商品類型",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "數量必須大於0",
      });
    }

    // 2. 檢查user的購物車是否存在
    const [cart] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "無權限操作",
      });
    }

    const cartId = cart[0].id;

    // 3. 根據類型更新不同表格
    switch (type) {
      case "bundle": {
        // 獲取套組中的所有項目
        const [bundleItems] = await pool.execute(
          `SELECT ci.id, ci.quantity, pbi.quantity AS base_quantity
           FROM cart_items ci
           JOIN product_variant pv ON ci.variant_id = pv.id
           JOIN product p ON pv.product_id = p.id
           JOIN product_bundle_items pbi ON pbi.bundle_id = ci.bundle_id AND pbi.product_id = p.id
           WHERE ci.cart_id = ? AND ci.bundle_id = ?`,
          [cartId, itemId]
        );

        if (bundleItems.length === 0) {
          return res.status(404).json({
            success: false,
            message: "找不到套組",
          });
        }

        // 對套組中的每一項更新數量
        for (const item of bundleItems) {
          // 計算新數量：基礎數量 * 要求的套組數量
          const newQuantity = item.base_quantity * quantity;

          await pool.execute(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [newQuantity, item.id]
          );
        }
        break;
      }

      case "product": {
        // 檢查商品是否存在於該user的購物車
        const [existingItem] = await pool.execute(
          `SELECT ci.*, pv.stock, pv.product_id
           FROM cart_items ci
           JOIN product_variant pv ON ci.variant_id = pv.id
           WHERE ci.id = ? AND ci.cart_id = ?`,
          [itemId, cartId]
        );
        console.log("existingItem", existingItem);

        if (existingItem.length === 0) {
          return res.status(404).json({
            success: false,
            message: "找不到購物車商品",
          });
        }

        // 更換變體
        if (variantId) {
          // 檢查新變體是否存在
          const [newVariant] = await pool.execute(
            `SELECT pv.id, pv.stock, pv.product_id, pv.price, p.name
             FROM product_variant pv
             JOIN product p ON pv.product_id = p.id
             WHERE pv.id = ? AND pv.isDeleted = 0`,
            [variantId]
          );

          if (newVariant.length === 0) {
            return res.status(400).json({
              success: false,
              message: "找不到指定商品變體",
            });
          }

          // 確保是同一個商品的變體
          if (newVariant[0].product_id !== existingItem[0].product_id) {
            return res.status(400).json({
              success: false,
              message: "無法更換不同商品的變體",
            });
          }

          // 檢查新變體庫存
          if (quantity > newVariant[0].stock) {
            return res.status(400).json({
              success: false,
              message: "商品庫存不足",
            });
          }

          // 更新變體和數量
          await pool.execute(
            "UPDATE cart_items SET variant_id = ?, quantity = ? WHERE id = ?",
            [variantId, quantity, itemId]
          );
        } else {
          // 只更新數量
          if (quantity > existingItem[0].stock) {
            return res.status(400).json({
              success: false,
              message: "商品庫存不足",
            });
          }

          await pool.execute(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [quantity, itemId]
          );
        }
        break;
      }

      case "activity": {
        // 檢查活動是否存在於該user的購物車
        const [existingItem] = await pool.execute(
          `SELECT cai.*, ap.earliest_date, ap.date as projectDate, a.name
           FROM cart_activity_items cai
           JOIN activity_project ap ON cai.activity_project_id = ap.id
           JOIN activity a ON ap.activity_id = a.id
           WHERE cai.id = ? AND cai.cart_id = ?`,
          [itemId, cartId]
        );

        if (existingItem.length === 0) {
          return res.status(404).json({
            success: false,
            message: "找不到活動項目",
          });
        }

        // 如果要更換日期時間
        if (date && time) {
          const selectedDate = new Date(date);
          const earliestDate = new Date(existingItem[0].earliestDate);
          const projectDate = new Date(existingItem[0].projectDate);

          if (selectedDate < earliestDate || selectedDate > projectDate) {
            return res.status(400).json({
              success: false,
              message: `活動「${existingItem[0].name}」只能在 ${existingItem[0].earliestDate} 到 ${existingItem[0].projectDate} 之間預訂`,
            });
          }

          await pool.execute(
            "UPDATE cart_activity_items SET quantity = ?, date = ?, time = ? WHERE id = ?",
            [quantity, date, time, itemId]
          );
        } else {
          // 只更新數量
          await pool.execute(
            "UPDATE cart_activity_items SET quantity = ? WHERE id = ?",
            [quantity, itemId]
          );
        }
        break;
      }

      case "rental": {
        // 檢查租借項目是否存在於該user的購物車
        const [existingItem] = await pool.execute(
          `SELECT cri.*, ri.stock
           FROM cart_rental_items cri
           JOIN rent_item ri ON cri.rental_id = ri.id
           WHERE cri.id = ? AND cri.cart_id = ?`,
          [itemId, cartId]
        );

        if (existingItem.length === 0) {
          return res.status(404).json({
            success: false,
            message: "找不到租借項目",
          });
        }

        // 檢查基本庫存 - 簡化版
        const stock =
          existingItem[0].stock === null
            ? Infinity
            : parseInt(existingItem[0].stock, 10);
        if (quantity > stock) {
          return res.status(400).json({
            success: false,
            message: "商品庫存不足",
          });
        }

        // 如果要更換租期
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
              success: false,
              message: "日期格式不正確",
            });
          }

          if (start < today) {
            return res.status(400).json({
              success: false,
              message: "起始日期不能早於今天",
            });
          }

          if (end <= start) {
            return res.status(400).json({
              success: false,
              message: "結束日期必須晚於起始日期",
            });
          }

          // 更新租期和數量
          if (req.body.color) {
            // 如果同時更新顏色
            await pool.execute(
              "UPDATE cart_rental_items SET quantity = ?, start_date = ?, end_date = ?, color = ? WHERE id = ?",
              [quantity, startDate, endDate, req.body.color, itemId]
            );
          } else {
            // 只更新租期和數量
            await pool.execute(
              "UPDATE cart_rental_items SET quantity = ?, start_date = ?, end_date = ? WHERE id = ?",
              [quantity, startDate, endDate, itemId]
            );
          }
        } else {
          // 只更新數量
          await pool.execute(
            "UPDATE cart_rental_items SET quantity = ? WHERE id = ?",
            [quantity, itemId]
          );
        }
        break;
      }
    }

    res.status(200).json({
      data: {
        cartId,
      },
      success: true,
      message: "購物車已更新",
    });
  } catch (error) {
    console.error("更新購物車失敗:", error);
    res.status(500).json({
      success: false,
      message: "更新購物車失敗",
    });
  }
});

export default router;
