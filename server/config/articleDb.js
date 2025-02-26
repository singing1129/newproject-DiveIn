import { pool } from "./mysql.js"; // 使用 mysql 連線池

// 共用的 SQL 執行函數
const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results, fields] = await connection.execute(sql, params);
    return { results, fields }; // 返回完整的結果和欄位資訊
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
    const { results } = await query(
      "SELECT * FROM article WHERE isDeleted = 0 ORDER BY created_at DESC"
    );
    return results;
  },

  // 透過 ID 取得單篇文章
  getArticleById: async (id) => {
    const { results } = await query(
      "SELECT * FROM article WHERE id = ? AND isDeleted = 0",
      [id]
    );
    return results[0]; // 返回單篇文章
  },

  // 建立新文章
  createArticle: async ({ title, content, coverImage, category_id }) => {
    const { results } = await query(
      "INSERT INTO article (title, content, coverImage, category_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [title, content, coverImage, category_id]
    );
    return results.insertId; // 返回插入的文章 ID
  },

  // 更新文章
  updateArticle: async (id, { title, content, coverImage, category_id }) => {
    const { results } = await query(
      "UPDATE article SET title = ?, content = ?, coverImage = ?, category_id = ?, updated_at = NOW() WHERE id = ?",
      [title, content, coverImage, category_id, id]
    );
    return results.affectedRows > 0; // 返回是否更新成功
  },

  // 軟刪除文章
  deleteArticle: async (id) => {
    const { results } = await query(
      "UPDATE article SET isDeleted = 1 WHERE id = ?",
      [id]
    );
    return results.affectedRows > 0; // 返回是否刪除成功
  },

  // 取得所有分類
  getCategories: async () => {
    // 先查詢大分類資料
    const { results: category_big } = await query(`
      SELECT 
        id AS big_category_id,
        name AS big_category_name
      FROM 
        article_category_big
    `);

    // 然後查詢小分類資料
    const { results: category_small } = await query(`
      SELECT 
        id AS small_category_id,
        name AS small_category_name,
        category_big_id
      FROM 
        article_category_small
    `);

    // 返回整理過的資料
    return {
      category_big,
      category_small,
    };
  },

  // 取得所有標籤
  getTags: async () => {
    const { results } = await query(`
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
    return results;
  },

  // 新增：插入文章與標籤的關聯
  insertArticleTag: async (articleId, tagId) => {
    const { results } = await query(
      "INSERT INTO article_tag_big (article_id, article_tag_small_id) VALUES (?, ?)",
      [articleId, tagId]
    );
    return results.affectedRows > 0; // 返回是否插入成功
  },

  // 新增：檢查標籤是否存在
  checkTagExists: async (tagName) => {
    const { results } = await query(
      "SELECT id FROM article_tag_small WHERE tag_name = ?",
      [tagName]
    );
    return results.length > 0 ? results[0].id : null; // 返回標籤 ID 或 null
  },

  // 新增：插入新標籤
  insertTag: async (tagName) => {
    const { results } = await query(
      "INSERT INTO article_tag_small (tag_name) VALUES (?)",
      [tagName]
    );
    return results.insertId; // 返回插入的標籤 ID
  },
};