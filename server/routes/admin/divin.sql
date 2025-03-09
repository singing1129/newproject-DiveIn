-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： localhost
-- 產生時間： 2025 年 03 月 09 日 11:33
-- 伺服器版本： 10.4.28-MariaDB
-- PHP 版本： 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `divin`
--

-- --------------------------------------------------------

--
-- 資料表結構 `activity`
--

CREATE TABLE `activity` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `activity_city_id` int(10) UNSIGNED DEFAULT NULL,
  `introduction` text NOT NULL,
  `description` text NOT NULL,
  `journey` text DEFAULT NULL,
  `meeting_point` text DEFAULT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `language` varchar(255) DEFAULT NULL,
  `type` int(11) NOT NULL COMMENT '1.浮潛\r\n2.水肺潛水\r\n3.自由潛水\r\n4.其他',
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `activity_city`
--

CREATE TABLE `activity_city` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `activity_country_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `activity_country`
--

CREATE TABLE `activity_country` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `activity_image`
--

CREATE TABLE `activity_image` (
  `id` int(10) UNSIGNED NOT NULL,
  `activity_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `img_url` varchar(255) DEFAULT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0: 非主圖, 1: 是主圖'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `activity_project`
--

CREATE TABLE `activity_project` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `earliest_date` date NOT NULL COMMENT '最早預定日',
  `date` date NOT NULL COMMENT '最晚預定日',
  `time` varchar(255) NOT NULL,
  `s​pecification` varchar(255) DEFAULT NULL,
  `original_price` varchar(50) NOT NULL,
  `price` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `activity_reviews`
--

CREATE TABLE `activity_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `activity_id` int(10) UNSIGNED NOT NULL,
  `activity_project_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- 資料表結構 `article_category_big`
--

CREATE TABLE `article_category_big` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `article_category_small`
--

CREATE TABLE `article_category_small` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_big_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- 資料表結構 `article_likes_dislikes`
--

CREATE TABLE `article_likes_dislikes` (
  `article_id` int(11) NOT NULL,
  `users_id` int(10) UNSIGNED NOT NULL,
  `is_like` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `article_reply`
--

CREATE TABLE `article_reply` (
  `id` int(11) NOT NULL,
  `article_id` int(11) DEFAULT NULL,
  `users_id` int(10) UNSIGNED DEFAULT NULL,
  `content` text NOT NULL,
  `floor_number` int(11) DEFAULT NULL,
  `reply_number` int(11) DEFAULT 0,
  `level` enum('1','2') DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `article_tag_big`
--

CREATE TABLE `article_tag_big` (
  `article_id` int(11) NOT NULL,
  `article_tag_small_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `article_tag_small`
--

CREATE TABLE `article_tag_small` (
  `id` int(11) NOT NULL,
  `tag_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `brand`
--

CREATE TABLE `brand` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `img_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `bundle_reviews`
--

CREATE TABLE `bundle_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `bundle_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `carts`
--

CREATE TABLE `carts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `status` enum('active','checked_out','abandoned') NOT NULL DEFAULT 'active',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `cart_activity_items`
--

CREATE TABLE `cart_activity_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `cart_id` int(10) UNSIGNED NOT NULL,
  `activity_project_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `cart_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bundle_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `cart_rental_items`
--

CREATE TABLE `cart_rental_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `cart_id` int(10) UNSIGNED NOT NULL,
  `rental_id` int(10) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `color` varchar(255) DEFAULT NULL,
  `rentalBrand` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `category_big`
--

CREATE TABLE `category_big` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `category_small`
--

CREATE TABLE `category_small` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_big_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `color`
--

CREATE TABLE `color` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `color_code` varchar(7) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `coupon`
--

CREATE TABLE `coupon` (
  `id` int(11) NOT NULL COMMENT '優惠券唯一識別碼',
  `code` varchar(50) NOT NULL COMMENT '優惠券代碼',
  `name` varchar(255) NOT NULL COMMENT '優惠券名稱',
  `campaign_name` varchar(255) DEFAULT NULL COMMENT '檔期活動名稱',
  `discount_type` enum('金額','折扣 %') NOT NULL COMMENT '折扣類型（金額或折扣 %）',
  `discount` decimal(10,0) NOT NULL COMMENT '折扣數值（依折扣類型而定）',
  `min_spent` decimal(10,0) NOT NULL COMMENT '最低消費金額（滿額使用）',
  `start_date` datetime NOT NULL COMMENT '優惠券開始時間',
  `end_date` datetime NOT NULL COMMENT '優惠券結束時間',
  `total_issued` int(11) NOT NULL COMMENT '總發放數量',
  `max_per_user` int(11) NOT NULL COMMENT '每人可領取數量',
  `status` enum('啟用','停用') NOT NULL COMMENT '優惠券狀態',
  `description` text DEFAULT NULL COMMENT '優惠券描述',
  `image_url` varchar(255) DEFAULT NULL COMMENT '優惠券圖片 URL',
  `is_deleted` tinyint(1) DEFAULT 0 COMMENT '是否刪除（邏輯刪除）',
  `is_exclusive` tinyint(1) DEFAULT 0 COMMENT '是否為不可與其他優惠同時使用',
  `is_target` tinyint(1) DEFAULT 0 COMMENT '是否需適用範圍 (若 TRUE 則需關聯 coupon_targets)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `coupon_targets`
--

CREATE TABLE `coupon_targets` (
  `id` int(11) NOT NULL COMMENT '唯一識別碼',
  `coupon_id` int(11) NOT NULL COMMENT '對應 coupon.id，優惠券的 ID',
  `variant_id` int(11) DEFAULT NULL COMMENT '目標商品的 ID（適用於商品類型）',
  `rent_item_id` int(11) DEFAULT NULL COMMENT '目標租賃的 ID（適用於租賃類型）',
  `activity_id` int(11) DEFAULT NULL COMMENT '目標活動的 ID（適用於活動類型）',
  `apply_to_all` tinyint(1) DEFAULT 0 COMMENT '是否適用於所有商品/租賃/活動（不包含會員）',
  `apply_to_product` tinyint(1) DEFAULT 0 COMMENT '是否適用所有商品',
  `apply_to_rent` tinyint(1) DEFAULT 0 COMMENT '是否適用所有租賃',
  `apply_to_activity` tinyint(1) DEFAULT 0 COMMENT '是否適用所有活動',
  `apply_to_users` tinyint(1) DEFAULT 0 COMMENT '是否適用於所有會員',
  `condition_type` enum('生日月份','會員等級') DEFAULT NULL COMMENT '附加條件類型（生日月份或會員等級）',
  `condition_value` varchar(255) DEFAULT NULL COMMENT '附加條件值（例如：生日月份或等級編號）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `coupon_type`
--

CREATE TABLE `coupon_type` (
  `id` int(11) NOT NULL COMMENT '唯一識別碼',
  `coupon_id` int(11) NOT NULL COMMENT '對應 coupon.id，優惠券的 ID',
  `applicable_type` enum('全館','商品','租賃','活動','會員專屬') NOT NULL COMMENT '優惠券適用範圍（全館、商品、租賃、活動、會員專屬）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL COMMENT '唯一識別碼',
  `coupon_id` int(11) NOT NULL COMMENT '對應 coupon.id',
  `users_id` int(11) NOT NULL COMMENT '用戶 ID',
  `used_at` datetime DEFAULT NULL,
  `status` enum('已領取','已使用','已過期') NOT NULL COMMENT '優惠券狀態',
  `is_deleted` tinyint(1) DEFAULT 0 COMMENT '是否刪除（若取消優惠券使用）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `favorites`
--

CREATE TABLE `favorites` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `bundle_id` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '團主',
  `type` int(11) NOT NULL COMMENT '1:浮潛、2:自由潛水、3:水肺潛水、4:其他',
  `gender` int(11) NOT NULL COMMENT '1、不限性別，2、限男性，3、限女性',
  `certificates` int(11) DEFAULT NULL COMMENT '1:無須證照,2:需OWD證照,3:需AOWD證照',
  `groups_city_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sign_end_date` datetime NOT NULL,
  `max_number` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0:揪團中、1:已成團、2:已取消'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `groups_image`
--

CREATE TABLE `groups_image` (
  `id` int(11) NOT NULL,
  `groups_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `img_url` varchar(20) NOT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `groups_participants`
--

CREATE TABLE `groups_participants` (
  `id` int(11) NOT NULL,
  `groups_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `total_price` decimal(10,0) NOT NULL,
  `status` enum('pending','paid','shipped','delivered','canceled') NOT NULL DEFAULT 'pending',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `payment_time` datetime DEFAULT NULL,
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `points` int(100) DEFAULT NULL,
  `coupon_usage_id` int(10) UNSIGNED DEFAULT NULL,
  `coupon_discount` decimal(10,2) DEFAULT 0.00,
  `is_reviewed` tinyint(1) NOT NULL DEFAULT 0,
  `reviewed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `order_activity_items`
--

CREATE TABLE `order_activity_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `activity_project_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `order_activity_travelers`
--

CREATE TABLE `order_activity_travelers` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_activity_id` int(10) UNSIGNED NOT NULL,
  `is_representative` tinyint(1) NOT NULL DEFAULT 0,
  `traveler_cn_name` varchar(255) NOT NULL,
  `traveler_en_name` varchar(255) NOT NULL,
  `traveler_id_number` varchar(50) NOT NULL,
  `traveler_phone` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,0) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `bundle_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `order_rental_items`
--

CREATE TABLE `order_rental_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `rental_id` int(10) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_per_day` decimal(10,0) NOT NULL,
  `total_price` decimal(10,0) NOT NULL,
  `deposit` decimal(10,0) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `order_shipping_info`
--

CREATE TABLE `order_shipping_info` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `shipping_address` text NOT NULL,
  `shipping_method` enum('home_delivery','convenience_store') NOT NULL,
  `store_id` varchar(50) DEFAULT NULL,
  `store_name` varchar(100) DEFAULT NULL,
  `store_address` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `points_history`
--

CREATE TABLE `points_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED DEFAULT NULL,
  `points` int(11) NOT NULL,
  `action` varchar(50) NOT NULL COMMENT '積分來源: review_reward, purchase, event, etc.',
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product`
--

CREATE TABLE `product` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `brand_id` int(10) UNSIGNED DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_accessories`
--

CREATE TABLE `product_accessories` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `accessory_product_id` int(10) UNSIGNED NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_bundle`
--

CREATE TABLE `product_bundle` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `brand_id` int(11) NOT NULL,
  `discount_price` decimal(10,0) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_bundle_items`
--

CREATE TABLE `product_bundle_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `bundle_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variant_required` tinyint(1) DEFAULT 0,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_details`
--

CREATE TABLE `product_details` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_images`
--

CREATE TABLE `product_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `image_type` enum('main','detail') NOT NULL DEFAULT 'main',
  `description` text DEFAULT NULL,
  `is_main` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `product_variant`
--

CREATE TABLE `product_variant` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `color_id` int(10) UNSIGNED DEFAULT NULL,
  `size_id` int(10) UNSIGNED DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 1000,
  `original_price` decimal(10,0) NOT NULL,
  `price` decimal(10,0) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rental_reviews`
--

CREATE TABLE `rental_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `rental_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_brand`
--

CREATE TABLE `rent_brand` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `imgUrl` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_category_big`
--

CREATE TABLE `rent_category_big` (
  `id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_category_small`
--

CREATE TABLE `rent_category_small` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `rent_category_big_id` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_color`
--

CREATE TABLE `rent_color` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `rgb` varchar(20) NOT NULL COMMENT '色碼'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_image`
--

CREATE TABLE `rent_image` (
  `id` int(10) UNSIGNED NOT NULL,
  `rent_item_id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `img_url` varchar(255) NOT NULL,
  `is_main` tinyint(1) NOT NULL COMMENT '是否為主要展示圖片',
  `is_deleted` tinyint(1) NOT NULL COMMENT '0: 未刪除, 1: 已刪除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_item`
--

CREATE TABLE `rent_item` (
  `id` int(10) UNSIGNED NOT NULL,
  `rent_category_small_id` int(10) NOT NULL COMMENT '關聯小分類表',
  `name` varchar(255) NOT NULL COMMENT '產品名稱',
  `price` decimal(10,0) NOT NULL COMMENT '原價',
  `price2` decimal(10,0) DEFAULT NULL COMMENT '特價',
  `description` varchar(255) DEFAULT NULL COMMENT '上方簡單描述',
  `description2` varchar(255) DEFAULT NULL COMMENT '下方詳細描述',
  `stock` int(10) UNSIGNED DEFAULT NULL COMMENT '庫存量',
  `created_at` datetime NOT NULL COMMENT '創建時間',
  `update_at` datetime DEFAULT NULL COMMENT '最後更新時間',
  `deposit` decimal(10,0) DEFAULT NULL COMMENT '押金',
  `is_like` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0:未收藏;1:已收藏',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0: 未刪除, 1: 已刪除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_material`
--

CREATE TABLE `rent_material` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_size`
--

CREATE TABLE `rent_size` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_specification`
--

CREATE TABLE `rent_specification` (
  `id` int(11) NOT NULL,
  `rent_item_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `color_id` int(11) DEFAULT NULL,
  `size_id` int(11) DEFAULT NULL,
  `thickness_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:未刪除;1:已刪除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `rent_thickness`
--

CREATE TABLE `rent_thickness` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `reviews`
--

CREATE TABLE `reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `useful_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `review_attributes`
--

CREATE TABLE `review_attributes` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `attribute_name` varchar(50) NOT NULL COMMENT '如：品質、配送速度、服務等',
  `rating` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `review_helpfulness`
--

CREATE TABLE `review_helpfulness` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `is_helpful` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `review_images`
--

CREATE TABLE `review_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `size`
--

CREATE TABLE `size` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `account` varchar(50) DEFAULT NULL,
  `password` varchar(250) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `created_at` varchar(50) NOT NULL DEFAULT current_timestamp(),
  `updated_at` varchar(50) DEFAULT NULL,
  `level_id` int(11) NOT NULL DEFAULT 0,
  `total_points` int(11) DEFAULT 0,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `head` varchar(250) DEFAULT NULL,
  `resetSecret` varchar(255) DEFAULT NULL,
  `resetExpires` datetime DEFAULT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `otp_expiration` datetime DEFAULT NULL,
  `is_custom_head` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `users_level`
--

CREATE TABLE `users_level` (
  `id` int(11) NOT NULL,
  `level_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `min_points` int(11) DEFAULT 0 COMMENT '該等級所需的最低積分',
  `max_points` int(11) DEFAULT NULL COMMENT '該等級的最高積分（NULL 表示無上限）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `user_providers`
--

CREATE TABLE `user_providers` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `activity`
--
ALTER TABLE `activity`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `activity_city`
--
ALTER TABLE `activity_city`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `activity_country`
--
ALTER TABLE `activity_country`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `activity_image`
--
ALTER TABLE `activity_image`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `activity_project`
--
ALTER TABLE `activity_project`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `activity_reviews`
--
ALTER TABLE `activity_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`),
  ADD KEY `activity_id` (`activity_id`);

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
-- 資料表索引 `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `bundle_reviews`
--
ALTER TABLE `bundle_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`),
  ADD KEY `bundle_id` (`bundle_id`);

--
-- 資料表索引 `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `cart_activity_items`
--
ALTER TABLE `cart_activity_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`);

--
-- 資料表索引 `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `varient_id` (`variant_id`),
  ADD KEY `fk_cart_items_bundle` (`bundle_id`);

--
-- 資料表索引 `cart_rental_items`
--
ALTER TABLE `cart_rental_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`);

--
-- 資料表索引 `category_big`
--
ALTER TABLE `category_big`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `category_small`
--
ALTER TABLE `category_small`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_big_id` (`category_big_id`);

--
-- 資料表索引 `color`
--
ALTER TABLE `color`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `coupon`
--
ALTER TABLE `coupon`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- 資料表索引 `coupon_targets`
--
ALTER TABLE `coupon_targets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_coupon_targets_coupon` (`coupon_id`);

--
-- 資料表索引 `coupon_type`
--
ALTER TABLE `coupon_type`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_coupon_type_coupon` (`coupon_id`);

--
-- 資料表索引 `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_coupon_usage_coupon` (`coupon_id`);

--
-- 資料表索引 `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `groups_image`
--
ALTER TABLE `groups_image`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `groups_participants`
--
ALTER TABLE `groups_participants`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_orders_coupon_usage` (`coupon_usage_id`);

--
-- 資料表索引 `order_activity_items`
--
ALTER TABLE `order_activity_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- 資料表索引 `order_activity_travelers`
--
ALTER TABLE `order_activity_travelers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_activity_id` (`order_activity_id`);

--
-- 資料表索引 `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `varient_id` (`variant_id`),
  ADD KEY `fk_order_items_bundle` (`bundle_id`);

--
-- 資料表索引 `order_rental_items`
--
ALTER TABLE `order_rental_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- 資料表索引 `order_shipping_info`
--
ALTER TABLE `order_shipping_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- 資料表索引 `points_history`
--
ALTER TABLE `points_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- 資料表索引 `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brand_id` (`brand_id`),
  ADD KEY `category_id` (`category_id`);

--
-- 資料表索引 `product_accessories`
--
ALTER TABLE `product_accessories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `accessory_product_id` (`accessory_product_id`);

--
-- 資料表索引 `product_bundle`
--
ALTER TABLE `product_bundle`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `product_bundle_items`
--
ALTER TABLE `product_bundle_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bundle_id` (`bundle_id`),
  ADD KEY `product_id` (`product_id`);

--
-- 資料表索引 `product_details`
--
ALTER TABLE `product_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- 資料表索引 `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `varient_id` (`variant_id`);

--
-- 資料表索引 `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`),
  ADD KEY `product_id` (`product_id`);

--
-- 資料表索引 `product_variant`
--
ALTER TABLE `product_variant`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `color_id` (`color_id`),
  ADD KEY `size_id` (`size_id`);

--
-- 資料表索引 `rental_reviews`
--
ALTER TABLE `rental_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`),
  ADD KEY `rental_id` (`rental_id`);

--
-- 資料表索引 `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- 資料表索引 `review_attributes`
--
ALTER TABLE `review_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`);

--
-- 資料表索引 `review_helpfulness`
--
ALTER TABLE `review_helpfulness`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_review` (`user_id`,`review_id`),
  ADD KEY `review_id` (`review_id`);

--
-- 資料表索引 `review_images`
--
ALTER TABLE `review_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`);

--
-- 資料表索引 `size`
--
ALTER TABLE `size`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `users_level`
--
ALTER TABLE `users_level`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `levelName` (`level_name`);

--
-- 資料表索引 `user_providers`
--
ALTER TABLE `user_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_provider_providerId` (`provider`,`provider_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity`
--
ALTER TABLE `activity`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity_city`
--
ALTER TABLE `activity_city`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity_country`
--
ALTER TABLE `activity_country`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity_image`
--
ALTER TABLE `activity_image`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity_project`
--
ALTER TABLE `activity_project`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `activity_reviews`
--
ALTER TABLE `activity_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article`
--
ALTER TABLE `article`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `article_image`
--
ALTER TABLE `article_image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `brand`
--
ALTER TABLE `brand`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `bundle_reviews`
--
ALTER TABLE `bundle_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `cart_activity_items`
--
ALTER TABLE `cart_activity_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `cart_rental_items`
--
ALTER TABLE `cart_rental_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `category_big`
--
ALTER TABLE `category_big`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `category_small`
--
ALTER TABLE `category_small`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `color`
--
ALTER TABLE `color`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `coupon`
--
ALTER TABLE `coupon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '優惠券唯一識別碼';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `coupon_targets`
--
ALTER TABLE `coupon_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '唯一識別碼';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `coupon_type`
--
ALTER TABLE `coupon_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '唯一識別碼';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `coupon_usage`
--
ALTER TABLE `coupon_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '唯一識別碼';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `groups_image`
--
ALTER TABLE `groups_image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `groups_participants`
--
ALTER TABLE `groups_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_activity_items`
--
ALTER TABLE `order_activity_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_activity_travelers`
--
ALTER TABLE `order_activity_travelers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_rental_items`
--
ALTER TABLE `order_rental_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_shipping_info`
--
ALTER TABLE `order_shipping_info`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `points_history`
--
ALTER TABLE `points_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product`
--
ALTER TABLE `product`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_accessories`
--
ALTER TABLE `product_accessories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_bundle`
--
ALTER TABLE `product_bundle`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_bundle_items`
--
ALTER TABLE `product_bundle_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_details`
--
ALTER TABLE `product_details`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `product_variant`
--
ALTER TABLE `product_variant`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `rental_reviews`
--
ALTER TABLE `rental_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `review_attributes`
--
ALTER TABLE `review_attributes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `review_helpfulness`
--
ALTER TABLE `review_helpfulness`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `review_images`
--
ALTER TABLE `review_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `size`
--
ALTER TABLE `size`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users_level`
--
ALTER TABLE `users_level`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_providers`
--
ALTER TABLE `user_providers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `activity_reviews`
--
ALTER TABLE `activity_reviews`
  ADD CONSTRAINT `activity_reviews_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_reviews_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `bundle_reviews`
--
ALTER TABLE `bundle_reviews`
  ADD CONSTRAINT `bundle_reviews_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bundle_reviews_ibfk_2` FOREIGN KEY (`bundle_id`) REFERENCES `product_bundle` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `cart_activity_items`
--
ALTER TABLE `cart_activity_items`
  ADD CONSTRAINT `cart_activity_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variant` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_items_bundle` FOREIGN KEY (`bundle_id`) REFERENCES `product_bundle` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `cart_rental_items`
--
ALTER TABLE `cart_rental_items`
  ADD CONSTRAINT `cart_rental_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `category_small`
--
ALTER TABLE `category_small`
  ADD CONSTRAINT `category_small_ibfk_1` FOREIGN KEY (`category_big_id`) REFERENCES `category_big` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_activity_items`
--
ALTER TABLE `order_activity_items`
  ADD CONSTRAINT `order_activity_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_activity_travelers`
--
ALTER TABLE `order_activity_travelers`
  ADD CONSTRAINT `order_activity_travelers_ibfk_1` FOREIGN KEY (`order_activity_id`) REFERENCES `order_activity_items` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_bundle` FOREIGN KEY (`bundle_id`) REFERENCES `product_bundle` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variant` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_shipping_info`
--
ALTER TABLE `order_shipping_info`
  ADD CONSTRAINT `order_shipping_info_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `points_history`
--
ALTER TABLE `points_history`
  ADD CONSTRAINT `points_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `points_history_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brand` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `product_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category_small` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `product_accessories`
--
ALTER TABLE `product_accessories`
  ADD CONSTRAINT `product_accessories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_accessories_ibfk_2` FOREIGN KEY (`accessory_product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `product_bundle_items`
--
ALTER TABLE `product_bundle_items`
  ADD CONSTRAINT `product_bundle_items_ibfk_1` FOREIGN KEY (`bundle_id`) REFERENCES `product_bundle` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_bundle_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `product_details`
--
ALTER TABLE `product_details`
  ADD CONSTRAINT `product_details_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_images_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variant` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variant` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `product_variant`
--
ALTER TABLE `product_variant`
  ADD CONSTRAINT `product_variant_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_variant_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `color` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_variant_ibfk_3` FOREIGN KEY (`size_id`) REFERENCES `size` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `review_attributes`
--
ALTER TABLE `review_attributes`
  ADD CONSTRAINT `review_attributes_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `review_helpfulness`
--
ALTER TABLE `review_helpfulness`
  ADD CONSTRAINT `review_helpfulness_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_helpfulness_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `review_images`
--
ALTER TABLE `review_images`
  ADD CONSTRAINT `review_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
