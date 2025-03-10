"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import styles from "./products.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import GroupCard from "../_components/GroupCard";
import Calendar from "react-calendar";
import { useRef } from "react";
// 選擇用的日曆
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { FaRegCalendar } from "react-icons/fa";

export default function GroupListPage() {
    // 設定揪團資料
    const [groups, setGroups] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
    const [selectedSort, setSelectedSort] = useState({
        text: "排序",
        value: 1,
    });
    const [showClassification, setShowClassification] = useState(false);
    const [selectedDisplay, setSelectedDisplay] = useState("每頁顯示24件");
    const [location, setLocation] = useState(searchParams.get("location") || "");
    const [country, setCountry] = useState(searchParams.get("country") || "");
    const [type, setType] = useState(searchParams.get("type") || "");
    const [certificates, setCertificates] = useState(searchParams.getAll("certificates") || []);
    const [status, setStatus] = useState(searchParams.getAll("status") || []);
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || null)
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || null);


    // 分頁
    // parseInt 把字串轉成數字    || 負責設定預設值
    const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
    const [limit, setLimit] = useState(
        parseInt(searchParams.get("limit")) || 24
    );
    const [totalPages, setTotalPages] = useState(1);
    // 可以放動畫 先不動
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 更新 URL 的函數
    const updateURL = (newPage, newLimit, sortValue, loc, cnt, type, certificates, status, startDate, endDate) => {
        const params = new URLSearchParams();
        params.set("page", newPage);
        params.set("limit", newLimit);
        params.set("sort", sortValue);
        if (loc) params.set("location", loc);
        if (cnt) params.set("country", cnt);
        if (type) params.set("type", type);
        if (certificates && certificates.length > 0) certificates.forEach(certificate => params.append("certificates", certificate));
        if (status && status.length > 0) status.forEach(s => params.append("status", s));
        if (startDate && endDate) {
            params.set("startDate", startDate)
            params.set("endDate", endDate)
        };
        router.push(`/group/list?${params.toString()}`);
    };
    // 處理排序
    const handleSort = (text, value) => {
        console.log("text:" + text, "value:" + value);
        setSelectedSort({ text, value });
        setShowDropdown(false); // 關閉下拉選單

        const sortedGroups = [...groups];
        switch (value) {
            case 1: // 綜合
                sortedGroups.sort((a, b) => a.id - b.id);
                break;
            case 2: // 最新上架
                sortedGroups.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                break;
            case 3: // 揪團人數：由低到高
                sortedGroups.sort((a, b) => a.price - b.price);
                break;
            case 4: // 揪團人數：由高到低
                sortedGroups.sort((a, b) => b.price - a.price);
                break;
            default:
                break;
        }
    };

    // 處理地點和國家篩選
    const handleLocationClick = (newLocation, newCountry = "") => {
        setLocation(newLocation);
        setCountry(newCountry);
        setPage(1); // 重置為第一頁
        updateURL(1, limit, selectedSort.value, newLocation, newCountry, type, certificates);
    };

    // 處理類型
    const handleType = (e) => {
        setType(e)
        updateURL(1, limit, selectedSort.value, location, country, type, certificates);
    }

    // 處理側邊欄篩選
    const handleFilter = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const choseCertificates = formData.getAll("certificates");
        const choseStatus = formData.getAll("status");
        setCertificates(choseCertificates)
        setStatus(choseStatus)
        setPage(1); // 重置為第一頁
        updateURL(1, limit, selectedSort.value, location, country, type, choseCertificates, choseStatus, startDate, endDate);
    };

    // 處理分頁
    const handlePageChange = (newPage) => {
        setPage(newPage);
        updateURL(newPage, limit, selectedSort.value, location, country, type, certificates, status, startDate, endDate);
    };


    // 每頁顯示按鈕
    const handleDisplayChange = (newLimit, displayText) => {
        setSelectedDisplay(displayText);
        setLimit(newLimit);
        setPage(1); // 切換顯示數量時重置為第一頁
        setShowDisplayDropdown(false); //關閉下拉選單
    };

    // 設定api路徑
    const api = "http://localhost:3005/api";

    // 連接後端獲取揪團資料
    // useEffect(() => {
    //     const getList = async () => {
    //         await axios
    //             .get(api + "/group")
    //             .then((res) => {
    //                 // console.log(res.data.data);
    //                 setGroups(res.data.data);
    //             })
    //             .catch((error) => {
    //                 console.log(error);
    //             });
    //     };
    //     getList();
    // }, []);

    // 送出條件獲取資料的function
    const fetchGroups = async (
        currentPage,
        itemsPerPage,
        sortValue,
        loc,
        cnt,
        type,
        certificates,
        status,
        startDate,
        endDate
    ) => {
        try {
            setLoading(true);
            let url = `${api}/group/list?page=${currentPage}&limit=${itemsPerPage}&sort=${sortValue}&location=${loc || ""}&country=${cnt || ""}`;
            if (certificates && certificates.length > 0) certificates.forEach(certificate => url += `&certificates=${certificate}`);
            if (status && status.length > 0) status.forEach(s => url += `&status=${s}`);
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;
            if (type) url += `&type=${type}`
            console.log(url);
            const response = await axios.get(url);
            if (response.data.status === "success") {
                setGroups(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
                setPage(response.data.pagination.currentPage);
            } else {
                setError("獲取揪團資料失敗");
            }
        } catch (error) {
            console.error("Error fetching groups:", error.response || error);
            setError("獲取揪團資料時發生錯誤");
        } finally {
            setLoading(false);
        }
    };
    // 從 URL 同步篩選條件並獲取資料
    useEffect(() => {
        fetchGroups(page, limit, selectedSort.value, location, country, type, certificates, status, startDate, endDate);
    }, [page, limit, selectedSort.value, location, country, type, certificates, status, startDate, endDate]);


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

    // 設定flatpickr日曆
    const calendarRef = useRef(null);
    useEffect(() => {
        if (calendarRef.current) {
            flatpickr(calendarRef.current, {
                mode: "range",
                dateFormat: "Y-m-d", // 日期格式
                inline: true, // 直接顯示日曆
                locale: {
                    firstDayOfWeek: 1, // 星期一為一周的第一天
                    weekdays: {
                        shorthand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
                        longhand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
                    },
                    months: {
                        shorthand: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
                        longhand: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
                    },
                },
                disableMobile: true, // 禁用移動端原生選擇器
                onChange: (selectedDates, dateStr) => {
                    console.log("選中的日期範圍1:", dateStr); // 檢查選擇結果
                    console.log("選中的日期範圍2:", selectedDates); // 檢查選擇結果
                    if ((dateStr.split(" to ")).length > 1) {
                        setStartDate(dateStr.split(" to ")[0])
                        setEndDate(dateStr.split(" to ")[1])
                    }
                },
            });
        }
    }, []);
    useEffect(() => {
        console.log("開始日:" + startDate);
        console.log("結束日:" + endDate);
    }, [startDate, endDate])

    return (
        <div className="container py-4">
            <div className="row">
                {/* 左側邊欄 */}
                <div className="col-lg-3 col-md-4">
                    <div className="d-grid ">
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(3); }}>
                                        水肺潛水
                                    </a>
                                </li>
                                <li className={`${styles.categoryItem} ${styles.hasSubmenu}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleType(2); }}>
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
                        {/* 揪團篩選 */}
                        <form action="" onSubmit={handleFilter}>
                            <div className={styles.sideCard}>
                                <div className={styles.cardTitle}>
                                    <h5>揪團篩選</h5>
                                </div>
                                <div className={styles.filterSection}>
                                    <div className={styles.filterTitle}>
                                        證照資格
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="noCertificates"
                                                name="certificates"
                                                value={1}
                                            />
                                            <label htmlFor="noCertificates">
                                                無須證照
                                            </label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="owd"
                                                name="certificates"
                                                value={2}
                                            />
                                            <label htmlFor="owd">
                                                需OWD證照
                                            </label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="aowd"
                                                name="certificates"
                                                value={3}
                                            />
                                            <label htmlFor="aowd">
                                                需AOWD證照
                                            </label>
                                        </div>
                                    </div>
                                    <div className={styles.filterTitle}>
                                        揪團狀態
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="status0"
                                                name="status"
                                                value={0}
                                            />
                                            <label htmlFor="status0">
                                                揪團中
                                            </label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="status1"
                                                name="status"
                                                value={1}
                                            />
                                            <label htmlFor="status1">
                                                已成團
                                            </label>
                                        </div>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                id="status2"
                                                name="status"
                                                value={2}
                                            />
                                            <label htmlFor="status2">
                                                已取消
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* 活動日期選擇 */}
                            <div className={styles.sideCard}>
                                <div className={styles.cardTitle}>
                                    <h5 className="d-flex gap-2 align-items-center">
                                        <FaRegCalendar />
                                        選擇出發日期
                                    </h5>
                                </div>
                                <div className="">
                                    <div ref={calendarRef}></div>

                                </div>
                            </div>
                            <button className="btn btn-primary w-100 mb-3">
                                套用篩選
                            </button>
                        </form>




                        {/* 最新揪團 */}
                        {/* <div className={styles.sideCard}>
                            <div className={styles.cardTitle}>
                                <h5>最新揪團</h5>
                            </div>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={`new-${item}`}
                                    className={styles.sidebarProduct}>
                                    <div className={styles.sidebarProductImg}>
                                        <Image
                                            src="/image/1.webp"
                                            alt="最新揪團"
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
                                            揪團地點
                                        </div>
                                        <div
                                            className={
                                                styles.sidebarProductTitle
                                            }>
                                            揪團名稱
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
                        </div> */}

                    </div>
                </div>

                {/* 右側主要內容區 */}
                <div className="col-lg-9 col-md-8">
                    {/* 商品介紹 */}
                    <div className="mb-4">
                        <h3 className="mb-3">開團或參團就是這麼簡單</h3>
                        <p className="mb-2">
                            選擇喜歡的行程、確認細節，快速加入。從初次潛水的新手團，到進階技術挑戰和深海探險，隨時都有精彩行程等您來參與。
                        </p>
                        <p>
                            快來加入揪團，和志同道合的夥伴一起探索深藍世界吧！
                        </p>
                    </div>

                    {/* 輪播圖 */}
                    <div
                        className="position-relative mb-4"
                        style={{ height: "188px", overflow: "hidden" }}>
                        <Image
                            src="/image/group/product-top-slide.png"
                            alt="揪團橫幅"
                            priority
                            fill
                            style={{ objectFit: "cover" }}
                        />
                        <div className="position-absolute top-50 end-0 translate-middle-y pe-5">
                            <div className="text-end">
                                <h3 className="text-white mb-4">
                                    揪團出發，
                                    <br />
                                    一起開啟深海冒險新旅程！
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* 排序和顯示選項 */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                onClick={() =>
                                    setShowDisplayDropdown(!showDisplayDropdown)
                                }>
                                {selectedDisplay}
                            </button>
                            <ul
                                className={`dropdown-menu ${showDisplayDropdown ? "show" : ""
                                    }`}>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleDisplayChange(
                                                24,
                                                "每頁顯示24件"
                                            )
                                        }>
                                        每頁顯示24件
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleDisplayChange(
                                                48,
                                                "每頁顯示48件"
                                            )
                                        }>
                                        每頁顯示48件
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleDisplayChange(
                                                72,
                                                "每頁顯示72件"
                                            )
                                        }>
                                        每頁顯示72件
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                onClick={() => setShowDropdown(!showDropdown)}>
                                <i className="bi bi-sort-down-alt me-2"></i>
                                {selectedSort.text}
                            </button>
                            <ul
                                className={`dropdown-menu ${showDropdown ? "show" : ""
                                    }`}>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleSort("綜合", 1)}>
                                        綜合
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleSort("最新揪團", 2)
                                        }>
                                        最新揪團
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleSort("揪團人數：由高到低", 3)
                                        }>
                                        揪團人數：由低到高
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleSort("揪團人數：由高到低", 4)
                                        }>
                                        揪團人數：由高到低
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() =>
                                            handleSort("出發日期：由近到晚", 5)
                                        }>
                                        出發日期：由近到晚
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 商品列表 */}
                    {/* <div className="row g-4">
                        <ProductCard key="1" product="1" />
                    </div> */}
                    {/* <div className="row g-4">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div> */}
                    <div className="d-flex flex-column gap-3">
                        {groups && groups.length > 0 ? (
                            groups.map((group, i) => {
                                return (
                                    <Link className="text-black text-decoration-none" key={i} href={`/group/list/${group.id}`}>
                                        <GroupCard group={group} />
                                    </Link>
                                );
                            })
                        ) : (
                            <div>沒有相關資料</div>
                        )}
                    </div>

                    {/* 頁籤 */}
                    <div className={`py-3 d-flex flex-column flex-md-row justify-content-between align-items-center ${styles.mainPage}`}>
                        <div className="px-3 w-100 show-page text-center text-md-start">
                            {/* 顯示 第 {(page - 1) * limit + 1}-
                  {Math.min(page * limit, totalProducts)} 件 / 共{" "}
                  {totalProducts} 件 商品
                </div> */}
                            <nav aria-label="Page navigation">
                                <ul className="px-3 pagination justify-content-end">
                                    {/* 第一頁按鈕 */}
                                    {page > 1 && (
                                        <li className="page-item">
                                            <button
                                                className={`page-link ${styles.pageLink}`}
                                                onClick={() => handlePageChange(1)}
                                                aria-label="FirstPage"
                                            >
                                                <span aria-hidden="true">
                                                    <i className="bi bi-chevron-double-left"></i>
                                                </span>
                                            </button>
                                        </li>
                                    )}

                                    {/* 上一頁按鈕 */}
                                    {page > 1 && (
                                        <li className="page-item">
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(page - 1)}
                                                aria-label="Previous"
                                            >
                                                <span aria-hidden="true">
                                                    <i className="bi bi-chevron-left"></i>
                                                </span>
                                            </button>
                                        </li>
                                    )}

                                    {/* 分頁按鈕 */}
                                    {(() => {
                                        const pageNumbers = [];
                                        if (totalPages <= 4) {
                                            // 如果總頁數小於等於 4，顯示所有頁碼
                                            for (let i = 1; i <= totalPages; i++) {
                                                pageNumbers.push(i);
                                            }
                                        } else {
                                            // 動態顯示頁碼
                                            if (page === 1 || page === 2) {
                                                // 當前頁在第 1 頁或第 2 頁時
                                                for (let i = 1; i <= 3; i++) {
                                                    pageNumbers.push(i);
                                                }
                                                pageNumbers.push("...");
                                                pageNumbers.push(totalPages);
                                            } else if (page === 3) {
                                                // 當前頁在第 3 頁時
                                                for (let i = 1; i <= 4; i++) {
                                                    pageNumbers.push(i);
                                                }
                                                pageNumbers.push("...");
                                                pageNumbers.push(totalPages);
                                            } else if (page >= totalPages - 2) {
                                                // 當前頁在最後 3 頁時
                                                pageNumbers.push(1);
                                                pageNumbers.push("...");
                                                for (let i = totalPages - 2; i <= totalPages; i++) {
                                                    pageNumbers.push(i);
                                                }
                                            } else {
                                                // 當前頁在中間時
                                                pageNumbers.push(1);
                                                pageNumbers.push("...");
                                                for (
                                                    let i = page - 1;
                                                    i <= page + 1;
                                                    i++
                                                ) {
                                                    pageNumbers.push(i);
                                                }
                                                pageNumbers.push("...");
                                                pageNumbers.push(totalPages);
                                            }
                                        }

                                        return pageNumbers.map((page1, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${page1 === page ? "active" : ""
                                                    } ${page1 === "..." ? "disabled" : ""}`}
                                            >
                                                {page1 === "..." ? (
                                                    <span className="page-link ellipsis">...</span>
                                                ) : (
                                                    <button
                                                        className="page-link"
                                                        onClick={() => handlePageChange(page1)}
                                                    >
                                                        {page1}
                                                    </button>
                                                )}
                                            </li>
                                        ));
                                    })()}

                                    {/* 下一頁按鈕 */}
                                    {page < totalPages && (
                                        <li className="page-item">
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(page + 1)}
                                                aria-label="Next"
                                            >
                                                <span aria-hidden="true">
                                                    <i className="bi bi-chevron-right"></i>
                                                </span>
                                            </button>
                                        </li>
                                    )}

                                    {/* 最後一頁按鈕 */}
                                    {page < totalPages && (
                                        <li className="page-item">
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(totalPages)}
                                                aria-label="LastPage"
                                            >
                                                <span aria-hidden="true">
                                                    <i className="bi bi-chevron-double-right"></i>
                                                </span>
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            );
}
