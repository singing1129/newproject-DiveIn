import mysql from "mysql2/promise";
import "dotenv/config.js";

// 資料庫連線設定
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 測試連線
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("資料庫連線成功！");
    console.log("連線配置：", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    // 測試查詢
    const [tables] = await connection.query("SHOW TABLES");
    console.log("資料庫中的資料表：", tables);

    connection.release();
    return true;
  } catch (error) {
    console.error("資料庫連線錯誤：", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    return false;
  }
};

// 執行連線測試
testConnection();

export { pool, testConnection };
