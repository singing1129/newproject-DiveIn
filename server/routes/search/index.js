import express from "express";
import { pool } from "../../config/mysql.js";

const router = express.Router();

// 搜索API路由
router.get("/", async (req, res) => {
  try {
    const { term } = req.query;
    console.log("搜尋關鍵字:", term);

    if (!term || term.trim() === "") {
      console.log("搜尋關鍵字為空，返回空結果");
      return res.json({
        products: [],
        activities: [],
        rentals: [],
        groups: [],
        articles: [],
      });
    }

    // 建構搜尋關鍵字
    const searchTerm = `%${term}%`;

    // 初始化結果對象
    const result = {
      products: [],
      activities: [],
      rentals: [],
      groups: [],
      articles: [],
    };

    // 搜尋商品
    try {
      const [products] = await pool.query(
        `
        SELECT p.id, p.name, pv.price, b.name as brand, pi.image_url as image
        FROM product p
        LEFT JOIN product_variant pv ON p.id = pv.product_id
        LEFT JOIN brand b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
        WHERE p.name LIKE ? OR p.description LIKE ?
        GROUP BY p.id
        LIMIT 10
      `,
        [searchTerm, searchTerm]
      );
      console.log("搜尋到的商品數量:", products.length);
      result.products = products;
    } catch (error) {
      console.error("商品搜尋錯誤:", error);
    }

    // 搜尋活動
    try {
      const [activities] = await pool.query(
        `
        SELECT a.id, a.name, ac.name as city, a.price, ai.img_url as image
        FROM activity a
        LEFT JOIN activity_city ac ON a.activity_city_id = ac.id
        LEFT JOIN activity_image ai ON a.id = ai.activity_id AND ai.is_main = 1
        WHERE a.name LIKE ? OR a.introduction LIKE ? OR a.description LIKE ?
        LIMIT 10
      `,
        [searchTerm, searchTerm, searchTerm]
      );

      // 格式化日期
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      const formattedActivities = activities.map((activity) => ({
        ...activity,
        date: activity.date ? formatDate(activity.date) : null,
      }));

      result.activities = formattedActivities;
    } catch (error) {
      console.error("活動搜尋錯誤:", error);
    }

    // 搜尋租賃
    try {
      const [rentals] = await pool.query(
        `
        SELECT ri.id, ri.name, ri.price, ri.deposit, ri.description, ri.price2, ri.stock,
               ri.created_at, ri.update_at, ri.is_like, ri.is_deleted, ri.rent_category_small_id,
               ri_img.img_url as image
        FROM rent_item ri
        LEFT JOIN rent_image ri_img ON ri.id = ri_img.rent_item_id AND ri_img.is_main = 1
        WHERE ri.name LIKE ? OR ri.description LIKE ? OR ri.description2 LIKE ?
        AND ri.is_deleted = 0
        LIMIT 10
      `,
        [searchTerm, searchTerm, searchTerm]
      );
      result.rentals = rentals;
    } catch (error) {
      console.error("租賃搜尋錯誤:", error);
    }

        // 搜尋揪團
    try {
      // 先檢查groups_city表是否存在
      const [checkGroupsCity] = await pool.query(`
        SHOW TABLES LIKE 'groups_city'
      `);

      let groupsQuery;
      if (checkGroupsCity.length > 0) {
        // 如果groups_city表存在，使用原始查詢
        groupsQuery = `
          SELECT g.id, g.name, g.description, g.date, g.status, g.max_number,
                 (SELECT COUNT(*) FROM groups_participants gp WHERE gp.groups_id = g.id) as current_participants,
                 gc.name as city, gi.img_url as image
          FROM \`groups\` g
          LEFT JOIN groups_city gc ON g.groups_city_id = gc.id
          LEFT JOIN groups_image gi ON g.id = gi.groups_id AND gi.is_main = 1
          WHERE g.name LIKE ? OR g.description LIKE ?
          AND g.status = 0
          LIMIT 10
        `;
      } else {
        // 如果groups_city表不存在，使用簡化查詢
        groupsQuery = `
          SELECT g.id, g.name, g.description, g.date, g.status, g.max_number,
                 (SELECT COUNT(*) FROM groups_participants gp WHERE gp.groups_id = g.id) as current_participants,
                 g.groups_city_id as city, gi.img_url as image
          FROM \`groups\` g
          LEFT JOIN groups_image gi ON g.id = gi.groups_id AND gi.is_main = 1
          WHERE g.name LIKE ? OR g.description LIKE ?
          AND g.status = 0
          LIMIT 10
        `;
      }

      const [groups] = await pool.query(groupsQuery, [searchTerm, searchTerm]);
      console.log("搜尋到的揪團數量:", groups.length);

      // 格式化日期
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      const formattedGroups = groups.map((group) => ({
        ...group,
        date: group.date ? formatDate(group.date) : null,
        status:
          group.status === 0
            ? "揪團中"
            : group.status === 1
            ? "已成團"
            : "已取消",
        current: group.current_participants || 0,
        max: group.max_number || 0,
      }));

      result.groups = formattedGroups;
    } catch (error) {
      console.error("揪團搜尋錯誤:", error);
      // 嘗試使用更簡單的查詢
      try {
        const [groups] = await pool.query(
          `
          SELECT g.id, g.name, g.description, g.date, g.status, g.max_number
          FROM \`groups\` g
          WHERE g.name LIKE ? OR g.description LIKE ?
          AND g.status = 0
          LIMIT 10
        `,
          [searchTerm, searchTerm]
        );

        console.log("使用簡化查詢搜尋到的揪團數量:", groups.length);

        // 格式化日期
        const formatDate = (dateString) => {
          if (!dateString) return null;
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        const formattedGroups = groups.map((group) => ({
          ...group,
          date: group.date ? formatDate(group.date) : null,
          status:
            group.status === 0
              ? "揪團中"
              : group.status === 1
              ? "已成團"
              : "已取消",
          current: 0,
          max: group.max_number || 0,
          city: "",
          image: "",
        }));

        result.groups = formattedGroups;
      } catch (fallbackError) {
        console.error("揪團備用搜尋也失敗:", fallbackError);
      }
    }

    // 搜尋文章
    try {
      const [articles] = await pool.query(
        `
        SELECT a.id, a.title as name, a.content, a.created_at as date, a.view_count as views, 
               a.reply_count as replies, ai.img_url as image
        FROM article a
        LEFT JOIN article_image ai ON a.id = ai.article_id AND ai.is_main = 1
        WHERE a.title LIKE ? OR a.content LIKE ?
        AND a.is_deleted = 0 AND a.status = 'published'
        LIMIT 10
      `,
        [searchTerm, searchTerm]
      );

      // 格式化日期
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      const formattedArticles = articles.map((article) => ({
        ...article,
        date: article.date ? formatDate(article.date) : null,
      }));

      result.articles = formattedArticles;
    } catch (error) {
      console.error("文章搜尋錯誤:", error);
    }

    // 記錄搜尋結果統計
    console.log("搜尋結果統計:", {
      products: result.products.length,
      activities: result.activities.length,
      rentals: result.rentals.length,
      groups: result.groups.length,
      articles: result.articles.length,
    });

    // 返回搜尋結果
    res.json(result);
  } catch (error) {
    console.error("搜尋錯誤:", error);
    res.status(500).json({ error: "搜尋過程中發生錯誤" });
  }
});

export default router;
