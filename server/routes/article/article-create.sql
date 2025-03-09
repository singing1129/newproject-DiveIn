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

-- =========================== 7. article_reply 表格 ===========================
CREATE TABLE article_reply (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    parent_id INT UNSIGNED DEFAULT NULL, -- 只有兩層，留言為NULL，回覆指向 article_reply.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES article(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES article_reply(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- 文章 1 留言與回覆
INSERT INTO article_reply (article_id, user_id, content, parent_id, created_at) VALUES
(1, 1, '這是文章1的留言1', NULL, '2025-03-01 10:00:00'), -- 留言1 (user1)
(1, 2, '這是文章1的回覆1', 1, '2025-03-01 10:05:00'),    -- 回覆1 (user2) 回應 留言1
(1, 3, '這是文章1的留言2', NULL, '2025-03-01 10:10:00'), -- 留言2 (user3)
(1, 1, '這是文章1的回覆2', 3, '2025-03-01 10:15:00'),    -- 回覆2 (user1) 回應 留言2
(1, 2, '這是文章1的回覆3', 3, '2025-03-01 10:20:00');    -- 回覆3 (user2) 回應 留言2

-- 文章 2 留言與回覆
INSERT INTO article_reply (article_id, user_id, content, parent_id, created_at) VALUES
(2, 1, '這是文章2的留言1', NULL, '2025-03-01 11:00:00'), -- 留言1 (user1)
(2, 3, '這是文章2的回覆1', 1, '2025-03-01 11:05:00'),    -- 回覆1 (user3) 回應 留言1
(2, 2, '這是文章2的留言2', NULL, '2025-03-01 11:10:00'), -- 留言2 (user2)
(2, 1, '這是文章2的回覆2', 2, '2025-03-01 11:15:00'),    -- 回覆2 (user1) 回應 留言2
(2, 3, '這是文章2的回覆3', 2, '2025-03-01 11:20:00');    -- 回覆3 (user3) 回應 留言2


-- =========================== 8. article_likes_dislikes 表格 ========================

--
CREATE TABLE article_likes_dislikes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reply_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    is_like BOOLEAN DEFAULT NULL, -- 允許為 NULL，表示用戶未對留言做出任何反應
    FOREIGN KEY (reply_id) REFERENCES article_reply(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 加入 UNIQUE KEY（如果表成功建立）
ALTER TABLE article_likes_dislikes ADD UNIQUE KEY unique_like (reply_id, user_id);


-- 文章 1 留言的按讚/倒讚
INSERT INTO article_likes_dislikes (reply_id, user_id, is_like) VALUES
(1, 1, 1),  -- user1 對 留言1 按讚
(1, 2, 1),  -- user2 對 留言1 按讚
(2, 3, 0),  -- user3 對 留言1 倒讚
(3, 1, 1),  -- user1 對 留言2 按讚
(3, 2, 1),  -- user2 對 留言2 按讚
(4, 3, 0),  -- user3 對 回覆2 倒讚
(5, 1, 1);  -- user1 對 回覆3 按讚

-- 文章 2 留言的按讚/倒讚
INSERT INTO article_likes_dislikes (reply_id, user_id, is_like) VALUES
(6, 1, 1),  -- user1 對 留言1 按讚
(6, 3, 1),  -- user3 對 留言1 按讚
(7, 2, 0),  -- user2 對 留言2 倒讚
(8, 1, 1),  -- user1 對 回覆2 按讚
(9, 3, 1);  -- user3 對 回覆3 按讚
