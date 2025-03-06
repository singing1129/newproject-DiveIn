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
        // 檢查 bundle 是否存在
        const [bundle] = await pool.execute(
          "SELECT * FROM product_bundle WHERE id = ?",
          [bundleId]
        );
      
        if (bundle.length === 0) {
          return res.status(400).json({
            success: false,
            message: "找不到指定套組",
          });
        }
      
        // 獲取套組中的所有商品
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
      
        // 從請求中獲取變體選擇（如果有）
        const userSelectedVariants = req.body.variants || [];
        // 創建產品ID到變體ID的映射
        const variantMap = {};
        
        if (Array.isArray(userSelectedVariants)) {
          for (const item of userSelectedVariants) {
            if (item.productId && item.variantId) {
              variantMap[item.productId] = item.variantId;
            }
          }
        }
      
        // 對於每個套組商品，添加到購物車
        for (const bundleItem of bundleItems) {
          let variantId;
          
          // 首先檢查用戶是否為這個產品指定了變體
          if (variantMap[bundleItem.product_id]) {
            // 驗證這個變體確實存在並且屬於這個產品
            const [selectedVariant] = await pool.execute(
              `SELECT pv.id 
               FROM product_variant pv 
               WHERE pv.id = ? AND pv.product_id = ? AND pv.isDeleted = 0`,
              [variantMap[bundleItem.product_id], bundleItem.product_id]
            );
            
            if (selectedVariant.length > 0) {
              variantId = selectedVariant[0].id;
            }
          }
          
          // 如果用戶沒有指定變體或指定的變體無效，使用默認變體（最低價格）
          if (!variantId) {
            const [defaultVariant] = await pool.execute(
              `SELECT pv.id 
               FROM product_variant pv 
               WHERE pv.product_id = ? AND pv.isDeleted = 0
               ORDER BY pv.price ASC
               LIMIT 1`,
              [bundleItem.product_id]
            );
      
            if (defaultVariant.length === 0) {
              continue; // 如果沒有有效變體，則跳過此產品
            }
            
            variantId = defaultVariant[0].id;
          }
      
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



// Fixed cart GET endpoint
// router.get("/:userId", async (req, res) => {
//   const { userId } = req.params;

//   try {
//     // Debugging: Check if the user has a cart
//     const [cartCheck] = await pool.execute(
//       "SELECT * FROM carts WHERE user_id = ? AND status = 'active'",
//       [userId]
//     );
    
//     console.log(`Found ${cartCheck.length} carts for user ${userId}`);
    
//     if (cartCheck.length === 0) {
//       return res.json({
//         success: true,
//         data: {
//           products: [],
//           activities: [],
//           rentals: [],
//           bundles: [],
//           total: {
//             products: 0,
//             activities: 0,
//             rentals: { rental_fee: 0, deposit: 0 },
//             bundles: 0,
//             final: 0,
//           },
//         },
//       });
//     }

//     const cartId = cartCheck[0].id;
    
//     // Debugging: Check cart items directly
//     const [cartItemsCheck] = await pool.execute(
//       "SELECT * FROM cart_items WHERE cart_id = ?",
//       [cartId]
//     );
    
//     console.log(`Found ${cartItemsCheck.length} cart items for cart ${cartId}`);

//     // 1. Get products with more lenient JOINs
//     const [products] = await pool.execute(
//       `SELECT 
//         ci.id,
//         ci.quantity,
//         ci.variant_id,
//         pv.price,
//         pv.original_price,
//         p.name AS product_name,
//         p.id AS product_id,
//         COALESCE(c.name, 'Unknown') AS color_name,
//         COALESCE(s.name, 'One Size') AS size_name,
//         pi.image_url
//       FROM cart_items ci
//       LEFT JOIN product_variant pv ON ci.variant_id = pv.id
//       LEFT JOIN product p ON pv.product_id = p.id
//       LEFT JOIN color c ON pv.color_id = c.id
//       LEFT JOIN size s ON pv.size_id = s.id
//       LEFT JOIN (
//         SELECT product_id, MIN(id) as min_id, image_url
//         FROM product_images
//         GROUP BY product_id
//       ) pi ON p.id = pi.product_id
//       WHERE ci.cart_id = ? AND ci.bundle_id IS NULL`,
//       [cartId]
//     );
    
//     console.log(`Found ${products.length} products after JOINs`);

//     // 2. Get activities
//     const [activities] = await pool.execute(
//       `SELECT 
//         cai.id,
//         cai.quantity,
//         cai.date,
//         cai.time,
//         ap.id AS project_id,
//         ap.price,
//         ap.original_price AS original_price,
//         ap.name AS project_name,
//         a.name AS activity_name,
//         a.id AS activity_id,
//         ai.img_url AS image_url
//       FROM cart_activity_items cai
//       LEFT JOIN activity_project ap ON cai.activity_project_id = ap.id
//       LEFT JOIN activity a ON ap.activity_id = a.id
//       LEFT JOIN activity_image ai ON a.id = ai.activity_id AND ai.is_main = 1
//       WHERE cai.cart_id = ?`,
//       [cartId]
//     );

//     // 3. Get rentals
//     const [rentals] = await pool.execute(
//       `SELECT 
//         cri.id,
//         cri.quantity,
//         cri.start_date,
//         cri.end_date,
//         COALESCE(rb.name, 'Unknown') AS rentalBrand,
//         ri.id AS rental_id,
//         ri.name AS rental_name,
//         ri.price,
//         ri.price2 AS discounted_price,
//         ri.deposit,
//         rim.img_url AS image_url,
//         DATEDIFF(cri.end_date, cri.start_date) + 1 AS rental_days,
//         cri.color
//       FROM cart_rental_items cri
//       LEFT JOIN rent_item ri ON cri.rental_id = ri.id
//       LEFT JOIN rent_specification rs ON ri.id = rs.rent_item_id
//       LEFT JOIN rent_brand rb ON rs.brand_id = rb.id
//       LEFT JOIN rent_image rim ON ri.id = rim.rent_item_id AND rim.is_main = 1
//       WHERE cri.cart_id = ?
//       GROUP BY cri.id`,
//       [cartId]
//     );

//     // 4. Check if there are bundle items
//     const [bundleItemsCheck] = await pool.execute(
//       "SELECT * FROM cart_items WHERE cart_id = ? AND bundle_id IS NOT NULL",
//       [cartId]
//     );
    
//     console.log(`Found ${bundleItemsCheck.length} bundle items`);
    
//     // 5. Get bundles with safer queries
//     let bundles = [];
    
//     if (bundleItemsCheck.length > 0) {
//       // Get distinct bundle IDs first
//       const [bundleIds] = await pool.execute(
//         "SELECT DISTINCT bundle_id FROM cart_items WHERE cart_id = ? AND bundle_id IS NOT NULL",
//         [cartId]
//       );
      
//       console.log(`Found ${bundleIds.length} distinct bundles`);
      
//       // Process each bundle separately to avoid complex JOIN failures
//       for (const bundleItem of bundleIds) {
//         const bundleId = bundleItem.bundle_id;
        
//         // Get basic bundle info
//         const [bundleInfo] = await pool.execute(
//           "SELECT id, name, description, discount_price FROM product_bundle WHERE id = ?",
//           [bundleId]
//         );
        
//         if (bundleInfo.length > 0) {
//           const bundle = bundleInfo[0];
          
//           // Get brand info if available
//           const [brandInfo] = await pool.execute(
//             "SELECT b.name AS brand_name FROM product_bundle pb JOIN brand b ON pb.brand_id = b.id WHERE pb.id = ?",
//             [bundleId]
//           );
          
//           if (brandInfo.length > 0) {
//             bundle.brand_name = brandInfo[0].brand_name;
//           } else {
//             bundle.brand_name = "Unknown";
//           }
          
//           // Get bundle items
//           const [bundleProducts] = await pool.execute(
//             `SELECT 
//               pbi.product_id, 
//               p.name AS product_name, 
//               pbi.quantity AS bundle_item_quantity,
//               pi.image_url
//             FROM product_bundle_items pbi
//             LEFT JOIN product p ON pbi.product_id = p.id
//             LEFT JOIN (
//               SELECT product_id, MIN(id) as min_id, image_url 
//               FROM product_images 
//               GROUP BY product_id
//             ) pi ON p.id = pi.product_id
//             WHERE pbi.bundle_id = ?`,
//             [bundleId]
//           );
          
//           // Calculate original total and bundle quantity
//           let originalTotal = 0;
//           let bundleQuantity = 1;
          
//           // Get cart item quantities for this bundle
//           const [cartBundleItems] = await pool.execute(
//             `SELECT ci.quantity, pbi.quantity AS base_quantity
//              FROM cart_items ci
//              JOIN product_variant pv ON ci.variant_id = pv.id
//              JOIN product p ON pv.product_id = p.id
//              JOIN product_bundle_items pbi ON pbi.bundle_id = ? AND pbi.product_id = p.id
//              WHERE ci.cart_id = ? AND ci.bundle_id = ?`,
//             [bundleId, cartId, bundleId]
//           );
          
//           if (cartBundleItems.length > 0) {
//             // Calculate bundle quantity based on the first item's ratio
//             bundleQuantity = Math.floor(cartBundleItems[0].quantity / cartBundleItems[0].base_quantity);
//           }
          
//           // Try to get original price total
//           try {
//             const [priceInfo] = await pool.execute(
//               `SELECT SUM(pv.price * pbi.quantity) AS original_total
//                FROM product_bundle_items pbi
//                JOIN product p ON pbi.product_id = p.id
//                JOIN product_variant pv ON pv.product_id = p.id
//                WHERE pbi.bundle_id = ?
//                GROUP BY pbi.bundle_id`,
//               [bundleId]
//             );
            
//             if (priceInfo.length > 0) {
//               originalTotal = priceInfo[0].original_total;
//             }
//           } catch (e) {
//             console.error("Error calculating bundle price:", e);
//           }
          
//           // Add to bundles array
//           bundles.push({
//             id: bundleId,
//             name: bundle.name,
//             description: bundle.description,
//             brand_name: bundle.brand_name,
//             original_total: Number(originalTotal || 0),
//             discount_price: Number(bundle.discount_price || 0),
//             quantity: bundleQuantity,
//             items: bundleProducts || []
//           });
//         }
//       }
//     }

//     // Process rentals data
//     const processedRentals = rentals.map((item) => {
//       const pricePerDay = item.discounted_price || item.price || 0;
//       const rentalDays = item.rental_days || 1;
//       const quantity = item.quantity || 1;
      
//       const rentalFee = pricePerDay * rentalDays * quantity;
//       const deposit = pricePerDay * 0.3;
//       const depositFee = deposit * quantity * rentalDays;

//       return {
//         ...item,
//         price_per_day: pricePerDay,
//         rental_fee: rentalFee,
//         deposit_fee: depositFee,
//         subtotal: rentalFee + depositFee,
//         brand_name: item.rentalBrand
//       };
//     });

//     // Calculate totals with null/undefined checks
//     const calculateProductTotal = (items) => {
//       return items.reduce((acc, curr) => {
//         const price = Number(curr.price || 0);
//         const quantity = Number(curr.quantity || 0);
//         return acc + (price * quantity);
//       }, 0);
//     };

//     const calculateBundleTotal = (items) => {
//       return items.reduce((acc, curr) => {
//         const price = Number(curr.discount_price || 0);
//         const quantity = Number(curr.quantity || 0);
//         return acc + (price * quantity);
//       }, 0);
//     };

//     const calculateRentalTotals = (items) => {
//       return items.reduce((acc, curr) => ({
//         rental_fee: acc.rental_fee + (curr.rental_fee || 0),
//         deposit: acc.deposit + (curr.deposit_fee || 0)
//       }), { rental_fee: 0, deposit: 0 });
//     };

//     const productTotal = calculateProductTotal(products);
//     const activityTotal = calculateProductTotal(activities);
//     const bundleTotal = calculateBundleTotal(bundles);
//     const rentalTotals = calculateRentalTotals(processedRentals);

//     // Build response
//     const data = {
//       products: products.map((item) => ({
//         ...item,
//         subtotal: (Number(item.price || 0) * Number(item.quantity || 0))
//       })),
//       activities: activities.map((item) => ({
//         ...item,
//         subtotal: (Number(item.price || 0) * Number(item.quantity || 0))
//       })),
//       rentals: processedRentals,
//       bundles: bundles,
//       total: {
//         products: productTotal,
//         activities: activityTotal,
//         bundles: Number(bundleTotal),
//         rentals: rentalTotals,
//         final: Number(productTotal) +
//                Number(activityTotal) +
//                Number(bundleTotal) +
//                Number(rentalTotals.rental_fee)
//       }
//     };

//     res.json({
//       success: true,
//       data
//     });
//   } catch (error) {
//     console.error("獲取購物車內容失敗:", error);
//     res.status(500).json({
//       success: false,
//       message: "獲取購物車內容失敗",
//       error: error.message
//     });
//   }
// });
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
          bundles: [],
          total: {
            products: 0,
            activities: 0,
            rentals: {
              rental_fee: 0,
              deposit: 0,
            },
            bundles: 0,
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

    // 5. 獲取所有bundle_id
    const [bundleIds] = await pool.execute(
      `SELECT DISTINCT bundle_id 
       FROM cart_items 
       WHERE cart_id = ? AND bundle_id IS NOT NULL`,
      [cartId]
    );

    const bundles = [];

    // 處理每個bundle
    for (const { bundle_id } of bundleIds) {
      // 獲取bundle基本信息
      const [bundleInfo] = await pool.execute(
        `SELECT 
          pb.id, 
          pb.name, 
          pb.description, 
          pb.discount_price,
          b.name as brand_name,
          (
            SELECT pi.image_url 
            FROM product_images pi 
            JOIN product_bundle_items pbi ON pi.product_id = pbi.product_id
            WHERE pbi.bundle_id = pb.id AND pi.is_main = 1 
            LIMIT 1
          ) as main_image
        FROM product_bundle pb
        JOIN brand b ON pb.brand_id = b.id
        WHERE pb.id = ?`,
        [bundle_id]
      );

      if (bundleInfo.length === 0) continue;

      // 計算原始總價 - 使用和bundle端點一致的計算方式
      const [originalTotalResult] = await pool.execute(
        `SELECT SUM(min_prices.min_price * pbi.quantity) as original_total
         FROM product_bundle_items pbi
         JOIN (
           SELECT product_id, MIN(price) as min_price
           FROM product_variant
           WHERE isDeleted = 0
           GROUP BY product_id
         ) as min_prices ON pbi.product_id = min_prices.product_id
         WHERE pbi.bundle_id = ?`,
        [bundle_id]
      );

      const originalTotal = originalTotalResult.length > 0 ? 
        Number(originalTotalResult[0].original_total) : 0;

      // 獲取購物車中這個bundle的所有項目 (包含實際選擇的變體)
      const [bundleCartItems] = await pool.execute(
        `SELECT 
          ci.id as cart_item_id,
          ci.quantity,
          ci.variant_id,
          pv.price,
          pv.original_price,
          p.id as product_id,
          p.name as product_name,
          c.name as color_name,
          s.name as size_name,
          pi.image_url,
          pbi.quantity as bundle_item_quantity
        FROM cart_items ci
        JOIN product_variant pv ON ci.variant_id = pv.id
        JOIN product p ON pv.product_id = p.id
        JOIN color c ON pv.color_id = c.id
        JOIN size s ON pv.size_id = s.id
        JOIN product_bundle_items pbi ON pbi.bundle_id = ? AND pbi.product_id = p.id
        LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_main = 1
        WHERE ci.cart_id = ? AND ci.bundle_id = ?`,
        [bundle_id, cartId, bundle_id]
      );

      // 計算bundle數量
      let bundleQuantity = 1;
      if (bundleCartItems.length > 0) {
        // 從第一個項目的數量和bundle項目數量計算
        bundleQuantity = Math.floor(
          bundleCartItems[0].quantity / bundleCartItems[0].bundle_item_quantity
        );
      }

      bundles.push({
        id: bundle_id,
        name: bundleInfo[0].name,
        description: bundleInfo[0].description,
        discount_price: Number(bundleInfo[0].discount_price),
        brand_name: bundleInfo[0].brand_name,
        quantity: bundleQuantity,
        original_total: originalTotal,
        image_url: bundleInfo[0].main_image,
        items: bundleCartItems.map(item => ({
          cart_item_id: item.cart_item_id,
          variant_id: item.variant_id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          original_price: item.original_price,
          color_name: item.color_name,
          size_name: item.size_name,
          quantity: item.quantity,
          bundle_item_quantity: item.bundle_item_quantity,
          image_url: item.image_url
        }))
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

    // 計算各類總價
    const calculateProductTotal = (items) => {
      return items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    };

    const calculateBundleTotal = (items) => {
      return items.reduce((acc, curr) => acc + (curr.discount_price * curr.quantity), 0);
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
      bundles: bundles,
      total: {
        products: productTotal,
        activities: activityTotal,
        bundles: Number(bundleTotal),
        rentals: rentalTotals,
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
      error: error.message
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
