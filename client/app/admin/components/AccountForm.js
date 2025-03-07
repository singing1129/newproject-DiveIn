"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import styles from "./AccountForm.module.css";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "../../rent/components/flatpickr.css"

// 登入方式 icon
import { AiFillGoogleSquare } from "react-icons/ai"; // Google
import { FaLine } from "react-icons/fa"; // Line
import { FaSquarePhone } from "react-icons/fa6"; // 手機
import { IoMdMail } from "react-icons/io";

export default function AccountForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birthday: "", // 新增生日欄位優惠券用
    avatar: "",
    avatarFile: null, // 新增：儲存上傳的檔案物件
    avatarPreview: null, // 新增：用於本地預覽
    level: 100, // 會員等級
  });
  console.log("formData", formData);
  const { getToken, getDecodedToken, user } = useAuth();
  const token = getToken();
  const decodedToken = getDecodedToken();
  console.log("user", user);
  console.log("token", token);
  console.log("更新資料的用戶ID", decodedToken);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [originalEmail, setOriginalEmail] = useState(""); // 儲存原始 email 值
  const birthdayInputRef = useRef(null); // 用來綁定 flatpickr


  // 是否顯示修改密碼欄位
  const [showChangePassword, setShowChangePassword] = useState(false); // 控制是否顯示修改密碼欄位


  // 從後端獲取會員資料
  const fetchMemberData = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:3005/api/admin/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && response.data.status === "success") {
        // 設置從後端取得的資料
        setFormData({
          ...response.data.data,
          // 清空這些欄位
          password: "",
          avatarFile: null,
          avatarPreview: null,
        });
        setOriginalEmail(response.data.data.email || "");

        // 設置登入方式
        if (response.data.data.providers) {
          setProviders(response.data.data.providers);
        }
      } else {
        throw new Error("獲取會員資料失敗");
      }
    } catch (error) {
      console.error("獲取會員資料失敗：", error);
      setMessage({ type: "error", text: "獲取會員資料失敗，請稍後再試" });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // 初始載入資料
  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // 初始化 Flatpickr
  useEffect(() => {
    if (birthdayInputRef.current) {
      flatpickr(birthdayInputRef.current, {
        dateFormat: "Y年m月d日", // 日期格式
        minDate: "today", // 限制選擇日期不能早於今天
        locale: {
          firstDayOfWeek: 1, // 每週的第一天是週一
          weekdays: {
            shorthand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
            longhand: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
          },
          months: {
            shorthand: [
              "1月",
              "2月",
              "3月",
              "4月",
              "5月",
              "6月",
              "7月",
              "8月",
              "9月",
              "10月",
              "11月",
              "12月",
            ],
            longhand: [
              "一月",
              "二月",
              "三月",
              "四月",
              "五月",
              "六月",
              "七月",
              "八月",
              "九月",
              "十月",
              "十一月",
              "十二月",
            ],
          },
        },
        disableMobile: true, // 禁用移動設備的默認行為
        onChange: (selectedDates, dateStr) => {
          // 當用戶選擇日期時，更新 formData.birthday
          setFormData((prev) => ({ ...prev, birthday: dateStr }));
        },
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        setMessage({ type: "error", text: "圖片大小不能超過 5MB" });
        return;
      }

      // 釋放舊的 URL 物件（如果存在）
      if (formData.avatarPreview) {
        URL.revokeObjectURL(formData.avatarPreview);
      }

      // 儲存檔案物件並創建本地預覽
      setFormData((prev) => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage({ type: "error", text: "請先登入" });
      return;
    }

    // 檢查 email 修改
    if (formData.email !== originalEmail && providers.includes("email")) {
      if (!confirm("修改電子郵件將影響你的登入方式。確定要修改嗎？")) {
        return;
      }
    }

    setMessage({ type: "", text: "" });

    try {
      setIsLoading(true);

      // 創建 FormData 對象
      const formDataToSend = new FormData();

      // 添加文本字段
      if (formData.name) formDataToSend.append("name", formData.name);
      if (formData.email) formDataToSend.append("email", formData.email);
      if (formData.password)
        formDataToSend.append("password", formData.password);
      if (formData.phone) formDataToSend.append("phone", formData.phone);

      // 如果有新的頭像檔案，添加到 FormData
      if (formData.avatarFile) {
        formDataToSend.append("avatar", formData.avatarFile);
      }

      // 發送請求
      const response = await axios.put(
        "http://localhost:3005/api/admin/user",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // 不要手動設置 Content-Type，讓 axios 自動處理
          },
        }
      );

      if (response.status === 200) {
        setMessage({
          type: "success",
          text: response.data.message || "資料更新成功！",
        });

        // 更新原始 email 值
        if (formData.email !== originalEmail) {
          setOriginalEmail(formData.email);
        }

        // 重新獲取會員資料以更新頭像顯示
        fetchMemberData();
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "資料更新失敗！",
        });
      }
    } catch (error) {
      console.error("提交表單失敗：", error);
      setMessage({
        type: "error",
        text: error.response?.data.message || "提交表單失敗，請稍後再試",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 釋放本地預覽
    if (formData.avatarPreview) {
      URL.revokeObjectURL(formData.avatarPreview);
    }

    // 重新從後端獲取資料
    fetchMemberData();
    setMessage({ type: "", text: "" });
  };

  // 在組件卸載時清理 URL 對象
  useEffect(() => {
    return () => {
      if (formData.avatarPreview) {
        URL.revokeObjectURL(formData.avatarPreview);
      }
    };
  }, [formData.avatarPreview]);

  // 判斷 email 是否為不可編輯狀態（當使用 email 登入，且沒有其他登入方式時）
  const isEmailReadOnly = providers.includes("email") && providers.length === 1;

  // 取得登入方式中文名稱
  const getProviderName = (provider) => {
    const names = {
      email: "電子郵件",
      google: "Google",
      facebook: "Facebook",
      line: "LINE",
      phone: "手機號碼",
    };
    return names[provider] || provider;
  };

  return (
    <div className={styles.container}>
      {message.text && (
        <div
          className={`${styles.message} ${
            message.type === "success" ? styles.success : styles.error
          }`}
        >
          {message.text}
        </div>
      )}

      <form className={styles.contentWrapper} onSubmit={handleSubmit}>
        {/* 大頭貼區塊 */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            <Image
              // 幹救命這裡寫超久
              src={
                `http://localhost:3005${formData.avatar}` ||
                formData.avatarPreview ||
                "/image/default-memberimg.png"
              }
              alt="會員頭像"
              width={250}
              height={250}
              className={styles.avatarImage}
            />
          </div>
          <div className={styles.memberLevel}>Lv.{formData.level}</div>
          <label htmlFor="avatar" className={styles.avatarUploadBtn}>
            變更圖片
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className={styles.avatarInput}
            />
          </label>

          {/* 登入方式區塊 */}
          {providers.length > 0 && (
            <div className={styles.providersSection}>
              <h3>已連結的登入方式</h3>
              <ul className={styles.providerList}>
                {providers.map((provider) => (
                  <li key={provider} className={styles.providerItem}>
                    {getProviderName(provider)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* {provider === "email" && (
            <>
              <IoMdMail className={styles.providerIcon} />
              <span className={styles.providerName}>電子郵件</span>
            </>
          )}
          {provider === "phone" && (
          <>
            <FaSquarePhone className={styles.providerIcon} />
            <span className={styles.providerName}>手機號碼</span>
          </>
        )}
          {provider === "line" && (
            <>
              <FaLine className={styles.providerIcon} />
              <span className={styles.providerName}>LINE</span>
            </>
          )}
          {provider === "google" && (
            <>
              <AiFillGoogleSquare className={styles.providerIcon} />
              <span className={styles.providerName}>Google</span>
            </>
          )} */}

        {/* 個人資訊區塊 */}
        <div className={styles.accountForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">
              電子郵件
              {isEmailReadOnly && (
                <span className={styles.readonlyHint}> (不可修改)</span>
              )}
              {providers.includes("email") && providers.length > 1 && (
                <span className={styles.warningHint}>
                  {" "}
                  (修改將影響登入方式)
                </span>
              )}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              required={providers.includes("email")}
              readOnly={isEmailReadOnly}
              className={isEmailReadOnly ? styles.readonlyInput : ""}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">密碼
            <button
                type="button"
                className={styles.changePasswordLink}
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                {showChangePassword ? "隱藏修改密碼" : "修改密碼?"}
              </button>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder="如不修改密碼請留空"
            />
          </div>


            {/* 修改密碼欄位 */}
            {showChangePassword && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">新密碼</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="請輸入新密碼"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">再次輸入新密碼</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="請再次輸入新密碼"
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="phone">電話號碼</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
            />
          </div>
          {/* 生日新增在這邊，日曆用租借那個 */}
          <div className={styles.formGroup}>
            <label htmlFor="birthday">生日</label>
            <input
              type="text"
              id="birthday"
              name="birthday"
              ref={birthdayInputRef} // 綁定 Flatpickr
              value={formData.birthday || ""}
              onChange={handleChange}
              placeholder="選擇生日"
            />
          </div>

        

          {/* 按鈕區塊 */}
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isLoading}
            >
              {isLoading ? "處理中..." : "儲存"}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={isLoading}
            >
              取消
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
