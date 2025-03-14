import express from "express";
import "dotenv/config.js";
import cors from "cors";
import logger from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import createError from "http-errors";
import http from "http"
import { WebSocketServer } from "ws";

// 路由模組
import homeRecommendationsRouter from "../routes/home/recommendations.js";
import productRouter from "../routes/products/index.js";
import bundleRouter from "../routes/bundle/index.js";
import favoritesRouter from "../routes/favorites/index.js";
import cartRouter from "../routes/cart/index.js";
import categoriesRouter from "../routes/categories/index.js";
import brandRouter from "../routes/brands/index.js";
// jimmy
import jimmyRouter from "../routes/jimmy/index.js";
// 評價相關路由
import reviewRouter from "../routes/reviews/index.js";
// 活動相關路由
import activityRouter from "../routes/activity/index.js";
import activityDetailRouter from "../routes/activity/detail.js";
// 揪團相關路由
import groupRouter from "../routes/group/index.js";
import groupListRouter from "../routes/group/list.js";
import groupDetailRouter from "../routes/group/detail.js";
import groupCreate from "../routes/group/create.js";
import groupJoin from "../routes/group/join.js";
import "../cron.js"; //    排程自動檢查並更新揪團狀態
import groupUpdate from "../routes/group/update.js"
import createWebsocketRoom from "../routes/webSocket/index.js";
import systemNotifications from "../routes/webSocket/notifications.js";
// 租借相關路由
import rentRouter from "../routes/rent/index.js";
import rentCategoryRouter from "../routes/rent/categories.js";
import rentBrandCategoryRouter from "../routes/rent/brandcategories.js";
import rentColorRouter from "../routes/rent/colors.js";
import rentNewRouter from "../routes/rent/new-arrivals.js";
import rentDiscountedRouter from "../routes/rent/new-discounted.js";
import rentFilterRouter from "../routes/rent/filter.js";
import rentSearchRouter from "../routes/rent/search.js";
import rentDetailRouter from "../routes/rent/detail.js";
import rentRecommendedRouter from "../routes/rent/recommended.js";
import rentIdColorRouter from "../routes/rent/idcolors.js";
// 論壇相關路由
import articleRouter from "../routes/article/index.js"; // 文章列表 & 動態文章頁
import articleCreateRouter from "../routes/article/create.js"; // 取得新建文章所需的分類/標籤 & 新增文章
import articleUpdateRouter from "../routes/article/update.js"; // 文章修改
import articleReplyRouter from "../routes/article/reply.js"; // 留言 & 回覆
import articleLikeRouter from "../routes/article/like.js"; // 文章與留言按讚
import articleUserRouter from "../routes/article/user.js"; // 獲取當前用戶的頭像資訊
// 優惠券相關路由
import myCouponRouter from "../routes/coupon/myCoupon.js";
import couponClaimRouter from "../routes/coupon/couponClaim.js";
import couponHistoryRouter from "../routes/coupon/couponHistory.js";
// 會員相關路由
import memberRouter from "../routes/admin/index.js";
import memberMyGroupRouter from "../routes/admin/mygroup.js";
import memberUpdateRouter from "../routes/admin/updateForm.js";
// import shipmentRouter from "../routes/ship/index.js"; // 運送相關路由
import searchRouter from "../routes/search/index.js"; // 搜索相关路由
import checkoutRouter from "../routes/checkout/index.js";
//ecpay
import ecpayRouter from "../routes/ecpay/index.js";
// linepay
import linepayRouter from "../routes/linepay/index.js";
// 訂單
import orderRouter from "../routes/order/index.js";
// 密碼重設
import passwordResetRouter from "../routes/admin/passwordReset.js";
// 建立 Express 應用程式
const app = express();
// websocket專用
const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true });
// 將wss傳給WebSocket模組進行設置
createWebsocketRoom(wss);
// 處理WebSocket升級請求
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request); // 觸發connection事件
  });
});
// 獲取文章當前文件的目錄路徑
// const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 設定允許的跨域來源
const whiteList = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3005",
];
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // 允許 postman 和允許的網域
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("不允許的跨域來源"));
    }
  },
};
// 應用中間件for admin
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// 中間件
app.use(logger("dev"));
app.use(express.static(path.join(process.cwd(), "../public")));
// 提供會員頭像靜態服務
app.use(
  "/uploads/avatars", // Change from "/uploads/avatar" to "/uploads/avatars"
  express.static(path.join(__dirname, "..", "public", "uploads", "avatars"))
);

// 提供文章圖片靜態服務
app.use(
  "/uploads/article",
  express.static(path.join(__dirname, "..", "public", "uploads", "article"))
); //封面縮圖 圖片預覽

app.use(
  "/uploads/temp",
  express.static(path.join(__dirname, "..", "public", "uploads", "temp"))
); //ckeditor 圖片預覽

// 測試 API
app.get("/", (req, res) => {
  res.json({ message: "Express server is running" });
});
// API 路由
const apiRouter = express.Router();
app.use("/api", apiRouter);
//首頁路由
apiRouter.use("/homeRecommendations", homeRecommendationsRouter);
// 產品相關路由
apiRouter.use("/products", productRouter);
//bundle
apiRouter.use("/bundle", bundleRouter);
// 收藏相關路由
apiRouter.use("/favorites", favoritesRouter);
// 購物車相關路由
apiRouter.use("/cart", cartRouter);
// 搜尋相關路由
apiRouter.use("/search", searchRouter);
// 分類相關路由
apiRouter.use("/categories", categoriesRouter);
// 品牌相關路由
apiRouter.use("/brands", brandRouter);
// 訂單相關路由
apiRouter.use("/checkout", checkoutRouter);
// ecpay
apiRouter.use("/ecpay", ecpayRouter);
// linepay
apiRouter.use("/linepay", linepayRouter);
//order
apiRouter.use("/order", orderRouter);
// 密碼重設
apiRouter.use("/passwordReset", passwordResetRouter);
// jimmy
apiRouter.use("/jimmy", jimmyRouter);
// 評價相關路由
apiRouter.use("/reviews", reviewRouter);
// 活動相關路由
apiRouter.use("/activity", activityRouter);
apiRouter.use("/activity", activityDetailRouter);
// 揪團相關路由
apiRouter.use("/group", groupRouter);
apiRouter.use("/group", groupListRouter);
apiRouter.use("/group", groupDetailRouter);
apiRouter.use("/group", groupCreate);
apiRouter.use("/group", groupJoin);
apiRouter.use("/group", groupUpdate);
apiRouter.use("/notifications", systemNotifications);

// 租借相關路由
apiRouter.use("/rent", rentRouter); // 負責 `/api/rent`
apiRouter.use("/rent", rentCategoryRouter); // 負責 `/api/rent/categories`
apiRouter.use("/rent", rentBrandCategoryRouter); // 負責 `/api/rent/brandcategories`
apiRouter.use("/rent", rentColorRouter); // 負責 `/api/rent/colors`
apiRouter.use("/rent", rentNewRouter); // 負責 `/api/rent/new-arrivals`
apiRouter.use("/rent", rentDiscountedRouter); // 負責 `/api/rent/new-discounted`
apiRouter.use("/rent", rentFilterRouter); // 負責 `/api/rent/filter`
apiRouter.use("/rent", rentSearchRouter); // 負責 `/api/rent/search`
apiRouter.use("/rent", rentDetailRouter); // 負責 `/api/rent/:id`
apiRouter.use("/rent", rentRecommendedRouter); // 負責 `/api/rent/:id/recommended`
apiRouter.use("/rent", rentIdColorRouter); // 負責 `/api/rent/:id/colors`

// 文章相關路由
apiRouter.use("/article", articleRouter); // `/api/article` 文章列表 & 文章內容
apiRouter.use("/article", articleCreateRouter); // `/api/article/create` 新增文章、取得新建文章所需數據
apiRouter.use("/article", articleUpdateRouter); // `/api/article/update`
apiRouter.use("/article", articleReplyRouter); // `/api/article/reply` 留言 & 回覆
apiRouter.use("/article", articleLikeRouter); // `/api/article/like` 文章 & 留言按讚
apiRouter.use("/article", articleUserRouter); // `/api/article/user` 獲取當前用戶的頭像資訊

// 優惠券相關路由
apiRouter.use("/coupon", myCouponRouter); // 負責 `/api/coupon/myCoupon`
apiRouter.use("/coupon", couponClaimRouter); // 負責 `/api/coupon/couponClaim`
apiRouter.use("/coupon", couponHistoryRouter); // 負責 `/api/coupon/couponHistory`

// 會員相關路由
apiRouter.use("/admin", memberRouter);
apiRouter.use("/admin", memberMyGroupRouter);
apiRouter.use("/admin", memberUpdateRouter);
// 捕捉 404 錯誤
app.use((req, res, next) => {
  next(createError(404));
});
// 錯誤處理
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: "error",
    message: err.message,
  });
});


// 錯誤處理
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: "error",
    message: err.message,
  });
});

// 啟動伺服器
const port = process.env.PORT || 3005;
server.listen(port, () => {
  console.log(`後端伺服器運行在 http://localhost:${port}`);
});

export default app;
