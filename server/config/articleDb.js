import { pool } from "./mysql.js"; // 使用 mysql 連線池

// 共用的 SQL 執行函數
const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error("資料庫錯誤：", error);
    throw error;
  } finally {
    connection.release();
  }
};

// 文章相關的資料庫操作
export const db = {
  query, // 讓 db 也能使用 query()

  // 取得所有文章
  getArticles: async () => {
    return query(
      "SELECT * FROM article WHERE isDeleted = 0 ORDER BY created_at DESC"
    );
  },

  // 透過 ID 取得單篇文章
  getArticleById: async (id) => {
    return query("SELECT * FROM article WHERE id = ? AND isDeleted = 0", [id]);
  },

  // 建立新文章
  createArticle: async ({ title, content, coverImage, category_id }) => {
    return query(
      "INSERT INTO article (title, content, coverImage, category_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [title, content, coverImage, category_id]
    );
  },

  // 更新文章
  updateArticle: async (id, { title, content, coverImage, category_id }) => {
    return query(
      "UPDATE article SET title = ?, content = ?, coverImage = ?, category_id = ?, updated_at = NOW() WHERE id = ?",
      [title, content, coverImage, category_id, id]
    );
  },

  // 軟刪除文章
  deleteArticle: async (id) => {
    return query("UPDATE article SET isDeleted = 1 WHERE id = ?", [id]);
  },

  // 取得所有分類
  getCategories: async () => {
    // 先查詢大分類資料
    const category_big = await query(`
      SELECT 
        id AS big_category_id,
        name AS big_category_name
      FROM 
        article_category_big
    `);

    // 然後查詢小分類資料
    const category_small = await query(`
      SELECT 
        id AS small_category_id,
        name AS small_category_name,
        category_big_id
      FROM 
        article_category_small
    `);
    // 返回整理過的資料
    return {
      category_big: category_big,
      category_small: category_small,
    };
  },

  // 取得所有標籤
  // 取得文章與標籤的相關資訊
  getTags: async () => {
    return query(`
    SELECT 
      atb.article_id,
      atb.article_tag_small_id,
      ats.id AS tag_id,
      ats.tag_name,
      a.id AS article_id
    FROM 
      article_tag_big atb
    LEFT JOIN 
      article_tag_small ats ON atb.article_tag_small_id = ats.id
    LEFT JOIN 
      article a ON atb.article_id = a.id
  `);
  },
};
