-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2025-03-10 07:35:29
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `my_project_db`
--

-- --------------------------------------------------------

--
-- 資料表結構 `article`
--

CREATE TABLE `article` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `publish_at` timestamp NULL DEFAULT NULL,
  `article_category_small_id` int(10) UNSIGNED DEFAULT NULL,
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `users_id` int(10) UNSIGNED DEFAULT NULL,
  `reply_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article`
--

INSERT INTO `article` (`id`, `title`, `content`, `created_at`, `updated_at`, `status`, `publish_at`, `article_category_small_id`, `view_count`, `users_id`, `reply_count`, `is_deleted`) VALUES
(1, '第一次潛水', '<p>第一次潛水第一次潛水第一次潛水</p>', '2025-02-16 02:19:58', '2025-03-03 23:45:40', 'published', '2025-02-15 03:37:49', 1, 150, 1, 5, 0),
(2, '如何選擇適合的體驗潛水地點', '選擇體驗潛水地點時，需要考慮水質、能見度、海洋生物種類以及教練的專業程度。例如，東南亞的潛點以珊瑚礁和豐富的海洋生物聞名，而地中海則以清澈的水質和歷史沉船吸引潛水愛好者。', '2025-02-16 02:19:58', '2025-03-01 04:20:48', 'published', '2025-02-14 02:37:49', 1, 200, 1, 8, 0),
(3, '體驗潛水前的準備工作', '在進行體驗潛水之前，需要做好充分的準備工作。首先，確保身體健康，沒有感冒或耳部問題。其次，學習基本的潛水知識和手勢，以便與教練溝通。最後，準備好適合的泳衣和毛巾，確保潛水後的舒適。', '2025-02-16 02:19:58', '2025-03-01 04:20:50', 'draft', '2025-02-13 01:37:49', 1, 180, 1, 6, 0),
(4, '體驗潛水的常見問題解答', '許多人在第一次體驗潛水時會有各種疑問，例如「我會不會呼吸困難？」或「水下會不會很冷？」其實，潛水裝備可以確保你正常呼吸，而潛水服則能保持體溫。只要放鬆心情，享受水下世界即可。', '2025-02-16 02:19:58', '2025-02-16 02:33:49', 'draft', '2025-02-12 00:37:49', 1, 220, 1, 10, 0),
(5, '體驗潛水 vs 正式潛水課程', '體驗潛水適合想要嘗試潛水的人，而正式潛水課程則適合想要深入學習並獲得潛水證書的人。體驗潛水通常由教練全程陪同，而正式課程則需要學習更多的理論知識和技巧。', '2025-02-16 02:19:58', '2025-02-16 02:33:55', 'published', '2025-02-10 23:37:49', 1, 170, 5, 7, 0),
(6, '體驗潛水的安全注意事項', '體驗潛水雖然有趣，但安全永遠是第一位的。確保聽從教練的指示，不要單獨行動，並隨時注意自己的呼吸和身體狀況。如果感到不適，應立即告知教練。', '2025-02-16 02:19:58', '2025-02-16 02:34:00', 'published', '2025-02-09 22:37:49', 1, 190, 6, 9, 0),
(7, '體驗潛水的最佳季節', '不同地區的潛水季節有所不同。例如，馬爾代夫的最佳潛水季節是11月至4月，而泰國則是12月至3月。選擇合適的季節可以確保良好的能見度和豐富的海洋生物。', '2025-02-16 02:19:58', '2025-02-16 02:34:06', 'published', '2025-02-08 21:37:49', 1, 210, 7, 12, 0),
(8, '體驗潛水的裝備介紹', '體驗潛水通常會提供全套裝備，包括潛水鏡、呼吸管、潛水服和氣瓶。這些裝備可以確保你在水下的安全和舒適。如果有特殊需求，也可以自備裝備。', '2025-02-16 02:19:58', '2025-02-16 02:34:12', 'published', '2025-02-07 20:37:49', 1, 160, 8, 5, 0),
(9, '體驗潛水的費用解析', '體驗潛水的費用因地區和服務內容而異。一般來說，費用包括裝備租借、教練指導和潛水保險。建議提前查詢並比較不同潛水中心的價格和評價。', '2025-02-16 02:19:58', '2025-02-16 02:34:18', 'published', '2025-02-06 19:37:49', 1, 230, 9, 15, 0),
(10, '體驗潛水的未來趨勢', '隨著潛水運動的普及，體驗潛水的服務也越來越多元化。未來可能會出現更多結合虛擬實境（VR）技術的潛水體驗，讓更多人能夠感受到水下世界的魅力。', '2025-02-16 02:19:58', '2025-02-16 02:34:26', 'published', '2025-02-05 18:37:49', 1, 240, 10, 18, 0),
(11, '如何選擇適合的潛水課程', '選擇潛水課程時，需要考慮課程內容、教練資質、潛水地點和費用。建議選擇有國際認證的潛水中心，並查看其他學員的評價。', '2025-02-16 02:19:58', '2025-02-16 02:34:40', 'published', '2025-02-04 17:37:49', 2, 250, 11, 20, 0),
(12, '開放水域潛水課程介紹', '開放水域潛水課程是潛水初學者的必修課程，內容包括理論知識、平靜水域練習和開放水域實習。完成課程後，可以獲得開放水域潛水員證書。', '2025-02-16 02:19:58', '2025-02-16 02:34:54', 'published', '2025-02-03 16:37:49', 2, 260, 12, 22, 0),
(13, '進階潛水課程的必要性', '進階潛水課程可以幫助你提升潛水技巧，學習更深層次的知識，例如夜潛、沉船潛水和水下導航。這些技能可以讓你的潛水體驗更加豐富。', '2025-02-16 02:19:58', '2025-02-16 02:35:00', 'published', '2025-02-02 15:37:49', 2, 270, 13, 25, 0),
(14, '潛水課程的費用比較', '潛水課程的費用因地區和課程內容而異。一般來說，開放水域課程的費用在300至500美元之間，而進階課程則需要額外支付200至300美元。', '2025-02-16 02:19:58', '2025-02-16 02:35:07', 'published', '2025-02-01 14:37:49', 2, 280, 14, 30, 0),
(15, '潛水課程的學習心得分享', '參加潛水課程是一次非常有意義的經歷。不僅學到了許多潛水知識，還結識了一群志同道合的朋友。最重要的是，獲得了探索水下世界的資格。', '2025-02-16 02:19:58', '2025-02-16 02:35:14', 'published', '2025-01-31 13:37:49', 2, 290, 15, 35, 0),
(16, '潛水課程的教練選擇指南', '選擇一位經驗豐富的潛水教練非常重要。可以通過查看教練的資質證書、教學經驗和學員評價來做出決定。', '2025-02-16 02:19:58', '2025-02-16 02:35:19', 'published', '2025-01-30 12:37:49', 2, 300, 16, 40, 0),
(17, '潛水課程的常見問題', '許多人在參加潛水課程時會有疑問，例如「課程難不難？」或「需要多長時間？」其實，只要認真學習並按照教練的指示操作，大多數人都能順利完成課程。', '2025-02-16 02:19:58', '2025-02-16 02:35:25', 'published', '2025-01-29 11:37:49', 2, 310, 17, 45, 0),
(18, '潛水課程的未來發展', '隨著潛水運動的普及，潛水課程的內容和形式也在不斷創新。未來可能會出現更多線上課程和虛擬實境教學，讓學習更加便捷。', '2025-02-16 02:19:58', '2025-03-05 20:45:25', 'published', '2025-01-28 10:37:49', 2, 320, 80, 50, 0),
(19, '潛水課程的國際認證', '國際潛水組織如PADI、SSI和NAUI提供全球認可的潛水課程和證書。選擇有國際認證的課程可以確保你的潛水資格被廣泛接受。', '2025-02-16 02:19:58', '2025-03-05 20:45:22', 'published', '2025-01-27 09:37:49', 2, 330, 80, 55, 0),
(20, '潛水課程的線上學習資源', '許多潛水中心提供線上學習資源，例如理論課程影片和模擬測驗。這些資源可以幫助你在正式上課前做好準備，提升學習效率。', '2025-02-16 02:19:58', '2025-03-05 20:45:19', 'draft', '2025-01-26 08:37:49', 2, 340, 80, 60, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `article_category_big`
--

CREATE TABLE `article_category_big` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_category_big`
--

INSERT INTO `article_category_big` (`id`, `name`) VALUES
(1, '課程與體驗'),
(2, '交流'),
(3, '知識與技術'),
(4, '新聞與活動');

-- --------------------------------------------------------

--
-- 資料表結構 `article_category_small`
--

CREATE TABLE `article_category_small` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_big_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_category_small`
--

INSERT INTO `article_category_small` (`id`, `name`, `category_big_id`) VALUES
(1, '體驗潛水', 1),
(2, '潛水課程', 1),
(3, '旅遊潛水', 1),
(4, '相片分享', 2),
(5, '設備討論', 2),
(6, '規劃行程', 2),
(7, '海洋生物', 3),
(8, '潛水技巧', 3),
(9, '海洋環境', 3),
(10, '潛水新聞', 4),
(11, '潛水活動', 4),
(12, '潛水人物', 4);

-- --------------------------------------------------------

--
-- 資料表結構 `article_image`
--

CREATE TABLE `article_image` (
  `id` int(11) NOT NULL,
  `article_id` int(11) DEFAULT NULL,
  `img_url` varchar(255) NOT NULL,
  `is_main` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_image`
--

INSERT INTO `article_image` (`id`, `article_id`, `img_url`, `is_main`, `is_deleted`) VALUES
(1, 1, '/uploads/article/001.jpg', 1, 0),
(2, 2, '/uploads/article/002.jpg', 1, 1),
(3, 3, '/uploads/article/003.jpg', 1, 1),
(4, 4, '/uploads/article/004.jpg', 1, 0),
(5, 5, '/uploads/article/005.jpg', 1, 0),
(6, 6, '/uploads/article/006.jpg', 1, 0),
(7, 7, '/uploads/article/007.jpg', 1, 0),
(8, 8, '/uploads/article/008.jpg', 1, 0),
(9, 9, '/uploads/article/009.jpg', 1, 0),
(10, 10, '/uploads/article/010.jpg', 1, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `article_likes_dislikes`
--

CREATE TABLE `article_likes_dislikes` (
  `id` int(10) UNSIGNED NOT NULL,
  `reply_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `is_like` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_likes_dislikes`
--

INSERT INTO `article_likes_dislikes` (`id`, `reply_id`, `user_id`, `is_like`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 1),
(3, 2, 3, 0),
(4, 3, 1, 1),
(5, 3, 2, 1),
(6, 4, 3, 0),
(7, 5, 1, 1),
(8, 6, 1, 1),
(9, 6, 3, 1),
(10, 7, 2, 0),
(11, 8, 1, 1),
(12, 9, 3, 1);

-- --------------------------------------------------------

--
-- 資料表結構 `article_reply`
--

CREATE TABLE `article_reply` (
  `id` int(10) UNSIGNED NOT NULL,
  `article_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_reply`
--

INSERT INTO `article_reply` (`id`, `article_id`, `user_id`, `content`, `parent_id`, `created_at`) VALUES
(1, 1, 1, '這是文章1的留言1', NULL, '2025-03-01 10:00:00'),
(2, 1, 2, '這是文章1的回覆1', 1, '2025-03-01 10:05:00'),
(3, 1, 3, '這是文章1的留言2', NULL, '2025-03-01 10:10:00'),
(4, 1, 1, '這是文章1的回覆2', 3, '2025-03-01 10:15:00'),
(5, 1, 2, '這是文章1的回覆3', 3, '2025-03-01 10:20:00'),
(6, 2, 1, '這是文章2的留言1', NULL, '2025-03-01 11:00:00'),
(7, 2, 3, '這是文章2的回覆1', 1, '2025-03-01 11:05:00'),
(8, 2, 2, '這是文章2的留言2', NULL, '2025-03-01 11:10:00'),
(9, 2, 1, '這是文章2的回覆2', 2, '2025-03-01 11:15:00'),
(10, 2, 3, '這是文章2的回覆3', 2, '2025-03-01 11:20:00');

-- --------------------------------------------------------

--
-- 資料表結構 `article_tag_big`
--

CREATE TABLE `article_tag_big` (
  `article_id` int(11) NOT NULL,
  `article_tag_small_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_tag_big`
--

INSERT INTO `article_tag_big` (`article_id`, `article_tag_small_id`) VALUES
(2, 3),
(2, 7),
(2, 8),
(3, 2),
(3, 6),
(3, 8),
(4, 3),
(4, 6),
(4, 8),
(1, 1),
(1, 2),
(1, 3);

-- --------------------------------------------------------

--
-- 資料表結構 `article_tag_small`
--

CREATE TABLE `article_tag_small` (
  `id` int(11) NOT NULL,
  `tag_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `article_tag_small`
--

INSERT INTO `article_tag_small` (`id`, `tag_name`) VALUES
(1, '初學者'),
(2, '裝備推薦'),
(3, '熱門潛點'),
(4, '安全第一'),
(5, '海洋生物'),
(6, '攝影技巧'),
(7, '旅遊攻略'),
(8, '活動分享');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `article`
--
ALTER TABLE `article`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `article_image`
--
ALTER TABLE `article_image`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `article_likes_dislikes`
--
ALTER TABLE `article_likes_dislikes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`reply_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `article_reply`
--
ALTER TABLE `article_reply`
  ADD PRIMARY KEY (`id`),
  ADD KEY `article_id` (`article_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- 資料表索引 `article_tag_small`
--
ALTER TABLE `article_tag_small`
  ADD PRIMARY KEY (`id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article`
--
ALTER TABLE `article`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article_image`
--
ALTER TABLE `article_image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article_likes_dislikes`
--
ALTER TABLE `article_likes_dislikes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article_reply`
--
ALTER TABLE `article_reply`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article_tag_small`
--
ALTER TABLE `article_tag_small`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `article_likes_dislikes`
--
ALTER TABLE `article_likes_dislikes`
  ADD CONSTRAINT `article_likes_dislikes_ibfk_1` FOREIGN KEY (`reply_id`) REFERENCES `article_reply` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_likes_dislikes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `article_reply`
--
ALTER TABLE `article_reply`
  ADD CONSTRAINT `article_reply_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `article` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_reply_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_reply_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `article_reply` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
