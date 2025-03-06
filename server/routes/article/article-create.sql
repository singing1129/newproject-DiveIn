-- =========================== 1. article_category_big 表格 ===========================
CREATE TABLE article_category_big (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 主鍵
    name VARCHAR(255) NOT NULL -- 大分類名稱
);

-- =========================== 2. article_category_small 表格 ===========================
CREATE TABLE article_category_small (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 主鍵
    name VARCHAR(255) NOT NULL, -- 小分類名稱
    category_big_id INT, -- 大分類的外鍵
    FOREIGN KEY (category_big_id) REFERENCES article_category_big (id) ON DELETE CASCADE -- 外鍵: 大分類
);

-- =========================== 3. article_tag_small 表格 ===========================
CREATE TABLE article_tag_small (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 主鍵
    tag_name VARCHAR(255) UNIQUE NOT NULL -- 標籤名稱
);

-- =========================== 4. article 表格 ===========================
CREATE TABLE article (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 主鍵
    title VARCHAR(255) NOT NULL, -- 文章標題
    content TEXT NOT NULL, -- 文章內容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 創建時間
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新時間
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft', -- 發布狀態
    publish_at TIMESTAMP NULL, -- 發布時間 (允許為NULL)
    article_category_small_id INT, -- 文章小分類的外鍵
    view_count INT DEFAULT 0, -- 文章瀏覽量
    users_id INT UNSIGNED, -- 文章作者 (users 外鍵)
    reply_count INT DEFAULT 0, -- 留言數量
    is_deleted BOOLEAN DEFAULT FALSE, -- 軟刪除標記
    FOREIGN KEY (article_category_small_id) REFERENCES article_category_small (id), -- 外鍵: 小分類
    FOREIGN KEY (users_id) REFERENCES users (id) -- 外鍵: 使用者
);

-- =========================== 5. article_image 表格 ===========================
CREATE TABLE article_image (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 主鍵
    article_id INT, -- 文章ID (文章的外鍵)
    name VARCHAR(255) NOT NULL, -- 圖片名稱
    img_url VARCHAR(255) NOT NULL, -- 圖片URL
    is_main BOOLEAN DEFAULT FALSE, -- 是否為封面縮圖
    FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE -- 外鍵: 文章
);

-- =========================== 6. article_tag_big (多對多關聯表) 表格 ===========================
CREATE TABLE article_tag_big (
    article_id INT, -- 文章ID
    article_tag_small_id INT, -- 標籤ID
    PRIMARY KEY (
        article_id,
        article_tag_small_id
    ), -- 複合主鍵
    FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE, -- 外鍵: 文章
    FOREIGN KEY (article_tag_small_id) REFERENCES article_tag_small (id) ON DELETE CASCADE -- 外鍵: 標籤
);

- =========================== 7. article_reply 表格 ===========================
CREATE TABLE article_reply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    users_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    floor_number INT NOT NULL,
    reply_number INT DEFAULT 0,
    level ENUM('1', '2') DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



INSERT INTO article_reply (article_id, users_id, content, floor_number, reply_number, level, created_at, is_deleted) VALUES

(1, 1, '這篇文章寫得很棒！', 1, 0, '1', '2025-03-06 10:00:00', FALSE),
(1, 2, '同意樓上，內容很詳細！', 2, 0, '1', '2025-03-06 10:05:00', FALSE),
(1, 3, '感覺有些地方可以補充', 3, 0, '1', '2025-03-06 10:10:00', FALSE),
(1, 4, '有些地方不太認同，不過寫得很好', 4, 0, '1', '2025-03-06 10:15:00', FALSE),
(1, 5, '請問這個技術的應用範圍有哪些？', 5, 0, '1', '2025-03-06 10:20:00', FALSE),
(1, 6, '回覆 3 樓，我覺得某些部分確實可以更細緻', 3, 1, '2', '2025-03-06 10:25:00', FALSE),
(1, 7, '回覆 5 樓，我的理解是這樣...', 5, 1, '2', '2025-03-06 10:30:00', FALSE),
(1, 8, '回覆 1 樓，我也覺得這篇文章的觀點很中肯', 1, 1, '2', '2025-03-06 10:35:00', FALSE),
(1, 9, '樓主能再提供一些數據支持嗎？', 6, 0, '1', '2025-03-06 10:40:00', FALSE),
(1, 10, '回覆 6 樓，的確可以加點數據會更好', 3, 2, '2', '2025-03-06 10:45:00', FALSE);




-- =========================== 8. article_likes_dislikes 表格 ========================

--
CREATE TABLE article_likes_dislikes (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 新增獨立主鍵
    article_id INT NOT NULL, -- 文章ID (文章的外鍵)
    reply_id INT DEFAULT NULL, -- 留言ID (留言的外鍵，可為 NULL)
    users_id INT UNSIGNED NOT NULL, -- 使用者ID (users 外鍵)
    is_like BOOLEAN NOT NULL -- 按讚為 TRUE，倒讚為 FALSE
    
);

-- 正确的 INSERT 语句
INSERT INTO article_likes_dislikes (article_id, reply_id, users_id, is_like) VALUES
(1, NULL, 1, TRUE),  -- 1號使用者對文章按讚
(1, NULL, 2, TRUE),  -- 2號使用者對文章按讚
(1, NULL, 3, FALSE), -- 3號使用者對文章倒讚
(1, 1, 4, TRUE),  -- 4號使用者對 1樓留言按讚
(1, 2, 5, TRUE),  -- 5號使用者對 2樓留言按讚
(1, 3, 6, FALSE), -- 6號使用者對 3樓留言倒讚
(1, 6, 7, TRUE),  -- 7號使用者對 3樓的 1號回覆按讚
(1, 7, 8, TRUE),  -- 8號使用者對 5樓的 1號回覆按讚
(1, 8, 9, FALSE), -- 9號使用者對 1樓的 1號回覆倒讚
(1, 10, 10, TRUE); -- 10號使用者對 3樓的 2號回覆按讚


