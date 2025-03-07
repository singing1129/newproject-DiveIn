"use client";
import "./styles.css";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import useToast from "@/hooks/useToast";
import { sign } from "jsonwebtoken";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { FaRegCalendar } from "react-icons/fa";
import styles from "../list/products.module.css"


export default function GroupDetailPage() {
  const api = "http://localhost:3005/api";
  // 設定吐司
  const { showToast } = useToast();

  const { user } = useAuth();
  useEffect(() => {
    // 判斷是否有登入，沒登入就自動跳轉至登入頁
    if (!user) {
      showToast("請先登入！", { autoClose: 2000 });
      setTimeout(() => {
        window.location = "/member/login";
      }, 2000);
    }
  }, []);

  const [userId, setUserId] = useState(user ? user.id : 0);
  console.log(user);
  // 設定地點選項
  const selectOption = {
    0: [],
    1: ["屏東", "台東", "澎湖", "綠島", "蘭嶼", "小琉球", "其他"],
    2: ["沖繩", "石垣島", "其他"],
    3: ["長灘島", "宿霧", "薄荷島", "其他"],
    4: ["其他"],
  };
  const [countrySelect, setCountrySelect] = useState(0);
  const [citySelect, setCitySelect] = useState(selectOption[countrySelect]);
  const [city, setCity] = useState(0);
  // console.log("citySelect: " + citySelect);
  const doCountrySelect = (e) => {
    setCountrySelect(e.target.value);
  };
  useEffect(() => {
    setCitySelect(selectOption[countrySelect]);
  }, [countrySelect]);

  // 今天日期，限制活動時間用
  const now = new Date().toISOString().split("T")[0]
  // 限定截止日期必須在活動日期前
  const [endDate,setEndDate] = useState(null)
  // 設定預覽圖片
  const [uploadImg,setUploadImg] = useState(null)
  const doImagePreview = (e) => {
    const selectedFile = e.target.files[0];
    console.log(selectedFile)
    if (selectedFile) {
      setUploadImg(URL.createObjectURL(selectedFile)); // 產生預覽圖片
    }
  };


  const doUpload = async (e) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.target);
      // formData.forEach((value, key) => {
      //     console.log(`${key}: ${value}`);
      // });
      const res = await axios.post(api + "/group/create", formData);
      if (res.data.status == "success") {
        alert("成功創立揪團");
        window.location = `/group/list/${res.data.groupId}`;
      } else {
        alert(res.data.message || "創建失敗");
      }
    } catch (error) {
      console.log(error);
    }
  };

    // 側邊欄用的
    // 設定值
    const router = useRouter();
    const searchParams = useSearchParams();
    const [location, setLocation] = useState(searchParams.get("location") || "");
    const [country, setCountry] = useState(searchParams.get("country") || "");
    const [type, setType] = useState(searchParams.get("type") || "");
    const [certificates, setCertificates] = useState(searchParams.getAll("certificates") || []);
    const [status, setStatus] = useState(searchParams.getAll("status") || []);
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || null)
    const [choseEndDate, setChoseEndDate] = useState(searchParams.get("endDate") || null);
    const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
    const [limit, setLimit] = useState(
      parseInt(searchParams.get("limit")) || 24
  );
  const [selectedSort, setSelectedSort] = useState({
    text: "排序",
    value: 1,
  });
  
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


  return (
    <main className="container d-flex">
      {/* 左側邊欄 */}
      <div className="col-lg-3 col-md-4 d-none d-sm-block">
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
      <form
        onSubmit={doUpload}
        className="group-create d-flex flex-column w-100"
      >
        <input type="hidden" name="userId" id="" value={userId} />
        <h2 className="m-0">新增揪團</h2>
        <div className="row">
          <div className="col-12 col-sm-6 d-flex flex-column gap-3 row-first">
            <div className="fs-22px">
              上傳首圖 <span className="color-secondary">*</span>
            </div>
            <div className="img-container">
            {uploadImg?(
              <img src={uploadImg} alt="" />
            ):(
              <img src="#" alt="" />
            )}
            </div>
            <input type="file" name="file" onChange={(e)=>{doImagePreview(e)}} required />
            {/* <div className="text-secondary">檔案上傳限制：3MB</div> */}
          </div>
          {/* <div className="col-12 col-sm-6 d-flex flex-column gap-3">
                        <div className="fs-22px">上傳其他圖片</div>
                        <div className="img-container">
                            <img src="#" alt="" />
                        </div>
                        <input type="file" />
                        <div className="text-secondary">檔案上傳限制：3MB</div>
                    </div> */}
        </div>
        <div>
          <div className="fs-22px mb-15px">
            揪團標題 <span className="color-secondary">*</span>
          </div>
          <input
            className="form-control"
            type="text"
            name="title"
            id=""
            required
          />
        </div>
        <div>
          <div className="fs-22px mb-15px">
            揪團性別 <span className="color-secondary">*</span>
          </div>
          <select
            className="form-select"
            name="gender"
            id=""
            defaultValue="default"
            required
          >
            <option value="default" disabled>
              請選擇揪團性別
            </option>
            <option value={1}>不限性別</option>
            <option value={2}>限男性</option>
            <option value={3}>限女性</option>
          </select>
        </div>
        <div>
          <div className="fs-22px mb-15px">
            揪團人數 <span className="color-secondary">*</span>
          </div>
          <input
            className="form-control"
            type="number"
            name="maxNumber"
            id=""
            required
          />
        </div>
        <div>
          <div className="fs-22px mb-15px">
            揪團分類 <span className="color-secondary">*</span>
          </div>
          <select
            className="form-select"
            name="type"
            id=""
            defaultValue="default"
            required
          >
            <option value="default" disabled>
              請選擇揪團分類
            </option>
            <option value={1}>浮潛</option>
            <option value={2}>自由潛水</option>
            <option value={3}>水肺潛水</option>
            <option value={4}>其他</option>
          </select>
        </div>
        <div>
          <div className="fs-22px mb-15px">
            證照資格 <span className="color-secondary">*</span>
          </div>
          <select
            className="form-select"
            name="certificates"
            id=""
            defaultValue="default"
            required
          >
            <option value="default" disabled>
              請選擇是否需要證照
            </option>
            <option value="1">無須證照</option>
            <option value="2">需OWD證照</option>
            <option value="3">需AOWD證照</option>
          </select>
        </div>
        <div>
          <div className="fs-22px mb-15px">
            揪團地點 <span className="color-secondary">*</span>
          </div>
          <select
            name="country"
            className="form-select mb-15px"
            id=""
            defaultValue="default"
            onChange={doCountrySelect}
            required
          >
            <option value="default" disabled>
              請選擇揪團國家
            </option>
            <option value={1}>台灣</option>
            <option value={2}>日本</option>
            <option value={3}>菲律賓</option>
            <option value={4}>其他</option>
          </select>
          <select
            className="form-select"
            name="city"
            id=""
            defaultValue="default"
          >
            {citySelect.length > 0 ? (
              citySelect.map((v, i) => (
                  <option key={`${v}+${i}`} value={v}>
                    {v}
                  </option>
              ))
            ) : (
              <option value="default" disabled>
                請先選擇國家
              </option>
            )}
          </select>
        </div>
        <div className="row">
          <div className="col-12 col-sm-6 d-flex flex-column gap-3 row-first">
            <div className="fs-22px">
              活動日期 <span className="color-secondary">*</span>
            </div>
            <input className="form-control" type="date" name="date" min={now} onChange={(e)=>{
              const selectedDate = new Date(e.target.value)
              selectedDate.setDate(selectedDate.getDate() - 1);
              const lastDay = selectedDate.toISOString().split("T")[0]
              const signEndDate = document.querySelector("#signEndDate")
              setEndDate(lastDay)
              signEndDate.removeAttribute("disabled")
            }}/>
          </div>
          <div className="col-12 col-sm-6 d-flex flex-column gap-3">
            <div className="fs-22px">
              活動時間 <span className="color-secondary">*</span>
            </div>
            <input className="form-control" type="time" name="time" />
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-sm-6 d-flex flex-column gap-3 row-first">
            <div className="fs-22px">
              揪團截止日期 <span className="color-secondary">*</span>
            </div>
            <input className="form-control" type="date" name="signEndDate" id="signEndDate" min={now} max={endDate} disabled />
          </div>
          <div className="col-12 col-sm-6 d-flex flex-column gap-3">
            <div className="fs-22px">
              揪團截止時間 <span className="color-secondary">*</span>
            </div>
            <input className="form-control" type="time" name="signEndTime"/>
          </div>
        </div>
        <div>
          <div className="fs-22px mb-15px">揪團資訊</div>
          <textarea
            className="form-control"
            name="description"
            id=""
            rows={5}
            defaultValue={""}
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Link href="/group/list">
            <button type="button" className="btn btn-secondary">
              返回揪團列表
            </button>
          </Link>
          <button className={`btn btn-primary-deep`}>創立揪團</button>
        </div>
      </form>
    </main>
  );
}
