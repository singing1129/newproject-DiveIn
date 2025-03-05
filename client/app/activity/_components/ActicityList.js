"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import styles from "./products.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import { FaRegCalendar } from "react-icons/fa";
import Calendar from "react-calendar";
import "./Calendar.css";

// API 基礎 URL
const API_BASE_URL = "http://localhost:3005/api";

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();

    // 狀態管理
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
    const [selectedSort, setSelectedSort] = useState({
        text: "排序",
        value: 1,
    });
    const [selectedDisplay, setSelectedDisplay] = useState("每頁顯示24件");
    const [location, setLocation] = useState(searchParams.get("location") || "");
    const [country, setCountry] = useState(searchParams.get("country") || "");
    const [language, setLanguage] = useState(searchParams.getAll("language") || []);
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
    const [duration, setDuration] = useState(searchParams.getAll("duration") || []);
    const [type,setType] = useState(searchParams.get("type") || "")

    // 分頁
    const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
    const [limit, setLimit] = useState(parseInt(searchParams.get("limit")) || 24);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 從 URL 同步篩選條件並獲取資料
    useEffect(() => {
        fetchActivity(page, limit, selectedSort.value, location, country, language, minPrice, maxPrice, duration,type);
    }, [page, limit, selectedSort.value, location, country, language, minPrice, maxPrice, duration,type]);

    // 更新 URL 的函數
    const updateURL = (newPage, newLimit, sortValue, loc, cnt, lang, minP, maxP, dur,type) => {
        const params = new URLSearchParams();
        params.set("page", newPage);
        params.set("limit", newLimit);
        params.set("sort", sortValue);
        if (loc) params.set("location", loc);
        if (cnt) params.set("country", cnt);
        if (lang && lang.length > 0) lang.forEach(l => params.append("language", l));
        if (minP) params.set("minPrice", minP);
        if (maxP) params.set("maxPrice", maxP);
        if (dur && dur.length > 0) dur.forEach(d => params.append("duration", d));
        if (type) params.set("type", type);
        router.push(`/activity?${params.toString()}`);
    };

    // 每頁顯示按鈕
    const handleDisplayChange = (newLimit, displayText) => {
        setSelectedDisplay(displayText);
        setLimit(newLimit);
        setPage(1); // 重置為第一頁
        setShowDisplayDropdown(false);
        updateURL(1, newLimit, selectedSort.value, location, country, language, minPrice, maxPrice, duration);
    };

    // 處理排序
    const handleSort = (text, value) => {
        setSelectedSort({ text, value });
        setShowDropdown(false);
        updateURL(page, limit, value, location, country, language, minPrice, maxPrice, duration);
    };

    // 處理側邊欄篩選
    const handleFilter = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const choselanguage = formData.getAll("language");
        const minP = formData.get("minPrice");
        const maxP = formData.get("maxPrice");
        const dur = formData.getAll("duration");
        setLanguage(choselanguage);
        setMinPrice(minP);
        setMaxPrice(maxP);
        setDuration(dur);
        setPage(1); // 重置為第一頁
        updateURL(1, limit, selectedSort.value, location, country, choselanguage, minP, maxP, dur);
    };

    // 處理點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".dropdown")) {
                setShowDropdown(false);
                setShowDisplayDropdown(false);
            }
        };
        document.addEventListener("click", handleClickOutside, true);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // 獲取資料
    const fetchActivity = async (
        currentPage,
        itemsPerPage,
        sortValue,
        loc,
        cnt,
        lang,
        minP,
        maxP,
        dur,
        type
    ) => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/activity?page=${currentPage}&limit=${itemsPerPage}&sort=${sortValue}&location=${loc || ""}&country=${cnt || ""}`;
            if (lang && lang.length > 0) lang.forEach(l => url += `&language=${l}`);
            if (minP) url += `&minPrice=${minP}`;
            if (maxP) url += `&maxPrice=${maxP}`;
            if (dur && dur.length > 0) dur.forEach(d => url += `&duration=${d}`);
            if (type) url+= `&type=${type}`
            console.log(url);
            const response = await axios.get(url);
            if (response.data.status === "success") {
                setProducts(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
                setPage(response.data.pagination.currentPage);
            } else {
                setError("獲取活動資料失敗");
            }
        } catch (error) {
            console.error("Error fetching products:", error.response || error);
            setError("獲取活動資料時發生錯誤");
        } finally {
            setLoading(false);
        }
    };

    // 處理地點和國家篩選
    const handleLocationClick = (newLocation, newCountry = "") => {
        setLocation(newLocation);
        setCountry(newCountry);
        setPage(1); // 重置為第一頁
        updateURL(1, limit, selectedSort.value, newLocation, newCountry, language, minPrice, maxPrice, duration, type);
    };

    // 處理活動類型
    const handleType = (e)=>{
        setType(e)
        updateURL(1, limit, selectedSort.value, location, country, language, minPrice, maxPrice, duration, type);
    }


    // 處理分頁
    const handlePageChange = (newPage) => {
        setPage(newPage);
        updateURL(newPage, limit, selectedSort.value, location, country, language, minPrice, maxPrice, duration, type);
    };

    return (
        <div className="container py-4">
            <div className="row">
                {/* 左側邊欄 */}
                <div className="col-lg-3 col-md-4">
                    <div className="d-grid">
                        {/* 活動地點分類 */}
                        <div className={`${styles.productClassification} ${styles.sideCard} ${styles.open}`}>
                            <div className={styles.cardTitle}>
                                <h5>活動地點</h5>
                                <i className="bi bi-chevron-down"></i>
                            </div>
                            <ul className={styles.classificationMenu}>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("", "台灣"); }}>
                                        台灣
                                    </a>
                                    <ul className={styles.submenu}>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("1"); }}>屏東</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("2"); }}>台東</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("3"); }}>澎湖</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("4"); }}>綠島</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("5"); }}>蘭嶼</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("7"); }}>小琉球</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("8"); }}>其他</a></li>
                                    </ul>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("", "日本"); }}>
                                        日本
                                    </a>
                                    <ul className={styles.submenu}>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("10"); }}>沖繩</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("11"); }}>石垣島</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("12"); }}>其他</a></li>
                                    </ul>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("", "菲律賓"); }}>
                                        菲律賓
                                    </a>
                                    <ul className={styles.submenu}>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("13"); }}>長灘島</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("14"); }}>宿霧</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("15"); }}>薄荷島</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("16"); }}>其他</a></li>
                                    </ul>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleLocationClick("", ""); }}>
                                        所有活動
                                    </a>
                                </li>
                            </ul>
                        </div>
                        {/* 活動分類 */}
                        <div className={`${styles.productClassification} ${styles.sideCard} ${styles.open}`}>
                            <div className={styles.cardTitle}>
                                <h5>活動類型</h5>
                                <i className="bi bi-chevron-down"></i>
                            </div>
                            <ul className={styles.classificationMenu}>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(1); }}>
                                        浮潛
                                    </a>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(2); }}>
                                        水肺潛水
                                    </a>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(3); }}>
                                        自由潛水
                                    </a>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(""); }}>
                                        所有活動
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* 活動篩選 */}
                        <form onSubmit={handleFilter}>
                            <div className={styles.sideCard}>
                                <div className={styles.cardTitle}>
                                    <h5>活動篩選</h5>
                                </div>
                                <div className={styles.filterSection}>
                                    <div className={styles.filterTitle}>導覽語言</div>
                                    <div className={styles.checkboxGroup}>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="language-english" value="english" name="language" defaultChecked={language.includes("english")} />
                                            <label htmlFor="language-english">英文</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="language-chinese" value="中文" name="language" defaultChecked={language.includes("中文")} />
                                            <label htmlFor="language-chinese">中文</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="language-jp" value="日本語" name="language" defaultChecked={language.includes("日本語")} />
                                            <label htmlFor="language-jp">日文</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="language-korean" value="한국어" name="language" defaultChecked={language.includes("한국어")} />
                                            <label htmlFor="language-korean">韓文</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="language-cantonese" value="廣東話" name="language" defaultChecked={language.includes("廣東話")} />
                                            <label htmlFor="language-cantonese">廣東話</label>
                                        </div>
                                    </div>
                                    <div className={styles.filterTitle}>價格區間</div>
                                    <div className={styles.priceInputs}>
                                        <input type="number" placeholder="最低" className={styles.priceInput} name="minPrice" defaultValue={minPrice} />
                                        <span>-</span>
                                        <input type="number" placeholder="最高" className={styles.priceInput} name="maxPrice" defaultValue={maxPrice} />
                                    </div>
                                    <div className={styles.filterTitle}>行程時間</div>
                                    <div className={styles.checkboxGroup}>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="duration-less4" value="less4" name="duration" defaultChecked={duration.includes("less4")} />
                                            <label htmlFor="duration-less4">少於4小時</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="duration-4toDay" value="4toDay" name="duration" defaultChecked={duration.includes("4toDay")} />
                                            <label htmlFor="duration-4toDay">4小時-1日</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="oneToTwo" value="oneToTwo" name="duration" defaultChecked={duration.includes("oneToTwo")} />
                                            <label htmlFor="oneToTwo">1日-2日</label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input type="checkbox" className={styles.checkbox} id="twoDaysUp" value="twoDaysUp" name="duration" defaultChecked={duration.includes("twoDaysUp")} />
                                            <label htmlFor="twoDaysUp">2日以上</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary w-100 mb-3">套用篩選</button>
                        </form>

                         {/* 最新活動 */}
                         <div className={styles.sideCard}>
                            <div className={styles.cardTitle}>
                                <h5>最新活動</h5>
                            </div>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={`new-${item}`}
                                    className={styles.sidebarProduct}>
                                    <div className={styles.sidebarProductImg}>
                                        <Image
                                            src="/images/1.webp"
                                            alt="最新活動"
                                            fill
                                            sizes="80px"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div className={styles.sidebarProductInfo}>
                                        <div
                                            className={
                                                styles.sidebarProductBrand
                                            }>
                                            活動地點
                                        </div>
                                        <div
                                            className={
                                                styles.sidebarProductTitle
                                            }>
                                            活動名稱
                                        </div>
                                        <div
                                            className={
                                                styles.sidebarProductPrice
                                            }>
                                            NT$0000
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 特惠活動 */}
                        <div className={styles.sideCard}>
                            <div className={styles.cardTitle}>
                                <h5>特惠活動</h5>
                            </div>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={`special-${item}`}
                                    className={styles.sidebarProduct}>
                                    <div className={styles.sidebarProductImg}>
                                        <Image
                                            src="/images/1.webp"
                                            alt="特惠活動"
                                            fill
                                            sizes="80px"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div className={styles.sidebarProductInfo}>
                                        <div
                                            className={
                                                styles.sidebarProductBrand
                                            }>
                                            活動地點
                                        </div>
                                        <div
                                            className={
                                                styles.sidebarProductTitle
                                            }>
                                            活動名稱
                                        </div>
                                        <div
                                            className={
                                                styles.sidebarProductPrice
                                            }>
                                            NT$0000
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右側主要內容區 */}
                <div className="col-lg-9 col-md-8">
                    {/* 商品介紹 */}
                                        <div className="mb-4">
                                            <h3 className="mb-3">潛入藍色世界，追逐自由與夢想</h3>
                                            <p className="mb-2">
                                                歡迎來到我們的課程與活動專區，這裡匯集了潛水愛好者不可錯過的精彩體驗！從基礎潛水課程到進階技術培訓，還有刺激有趣的深海探險活動，我們為您精心設計每一項內容，確保安全與專業性兼具。無論您是剛開始接觸潛水還是已有豐富經驗，這裡都有適合您的選擇。
                                            </p>
                                            <p>
                                                現在報名，還可享受獨家優惠：單次報名滿 $3000
                                                即贈精美潛水紀念品，部分課程更有限時折扣活動！立即瀏覽，輕鬆找到專屬於您的潛水體驗，為下一次海底旅程做好準備。學習新技能、探索深海奧秘，就從這裡開始！
                                            </p>
                                        </div>
                    
                                        {/* 輪播圖 */}
                                        <div
                                            className="position-relative mb-4"
                                            style={{ height: "188px", overflow: "hidden" }}>
                                            <Image
                                                src="/image/product-top-slide.png"
                                                alt="潛水裝備橫幅"
                                                priority
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                            <div className="position-absolute top-50 end-0 translate-middle-y pe-5">
                                                <div className="text-end">
                                                    <h3 className="text-white mb-4">
                                                        專業裝備，
                                                        <br />
                                                        陪你深海冒險每一步！
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                    {/* 排序和顯示選項 */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="dropdown">
                            <button className="btn btn-outline-secondary dropdown-toggle" onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}>
                                {selectedDisplay}
                            </button>
                            <ul className={`dropdown-menu ${showDisplayDropdown ? "show" : ""}`}>
                                <li><button className="dropdown-item" onClick={() => handleDisplayChange(24, "每頁顯示24件")}>每頁顯示24件</button></li>
                                <li><button className="dropdown-item" onClick={() => handleDisplayChange(48, "每頁顯示48件")}>每頁顯示48件</button></li>
                                <li><button className="dropdown-item" onClick={() => handleDisplayChange(72, "每頁顯示72件")}>每頁顯示72件</button></li>
                            </ul>
                        </div>
                        <div className="dropdown">
                            <button className="btn btn-outline-secondary dropdown-toggle" onClick={() => setShowDropdown(!showDropdown)}>
                                <i className="bi bi-sort-down-alt me-2"></i>
                                {selectedSort.text}
                            </button>
                            <ul className={`dropdown-menu ${showDropdown ? "show" : ""}`}>
                                <li><button className="dropdown-item" onClick={() => handleSort("綜合", 1)}>綜合</button></li>
                                <li><button className="dropdown-item" onClick={() => handleSort("價格：由低到高", 3)}>價格：由低到高</button></li>
                                <li><button className="dropdown-item" onClick={() => handleSort("價格：由高到低", 4)}>價格：由高到低</button></li>
                            </ul>
                        </div>
                    </div>

                    {/* 商品列表 */}
                    <div className="row g-4">
                        {products.map((activity) => (
                            <ProductCard key={activity.id} product={activity} />
                        ))}
                    </div>

                    {/* 分頁 */}
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div>第{page}頁/共{totalPages}頁</div>
                        <nav aria-label="Page navigation">
                            <ul className="pagination mb-0">
                                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                                        <span aria-hidden="true">&laquo;</span>
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= page - 1 && pageNumber <= page + 1)
                                    ) {
                                        return (
                                            <li key={pageNumber} className={`page-item ${page === pageNumber ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                                                    {pageNumber}
                                                </button>
                                            </li>
                                        );
                                    } else if (pageNumber === page - 2 || pageNumber === page + 2) {
                                        return (
                                            <li key={pageNumber} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                                        <span aria-hidden="true">&raquo;</span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}