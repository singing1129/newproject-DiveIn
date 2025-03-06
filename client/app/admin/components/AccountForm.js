"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import styles from "./AccountForm.module.css";

export default function AccountForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
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


  // 確定圖片來源
  const getAvatarSrc = () => {
    if (formData.avatarPreview) {
      return formData.avatarPreview; // 本地預覽優先
    }
    if (formData.avatar && formData.avatar !== "") {
      return `http://localhost:3005${formData.avatar}`; // 後端路徑
    }
    return "/image/default-memberimg.png"; // 預設圖片
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

  // 添加移除登入方式的處理函數
  const handleRemoveProvider = async (provider) => {
    if (providers.length <= 1) {
      setMessage({ type: "error", text: "至少需要保留一種登入方式" });
      return;
    }

    if (
      window.confirm(`確定要移除「${getProviderName(provider)}」登入方式嗎？`)
    ) {
      try {
        setIsLoading(true);
        const response = await axios.delete(
          `http://localhost:3005/api/admin/provider/${provider}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setProviders(response.data.data.providers);
          setMessage({ type: "success", text: "登入方式已移除" });
        }
      } catch (error) {
        console.error("移除登入方式失敗:", error);
        setMessage({
          type: "error",
          text: error.response?.data.message || "移除失敗，請稍後再試",
        });
      } finally {
        setIsLoading(false);
      }
    }
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
              src={getAvatarSrc()}
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
                    {/* 如果登入方式超過一種，才顯示移除按鈕 */}
                    {providers.length > 1 && (
                      <button
                        className={styles.removeProviderBtn}
                        onClick={() => handleRemoveProvider(provider)}
                        disabled={isEmailReadOnly && provider === "email"}
                      >
                        移除
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
          {/*  修改密碼欄位區域 */}
          <div className={styles.formGroup}>
            <label htmlFor="password">
              密碼
              {/* 如果用戶沒有 email 登入方式，顯示設置密碼提示 */}
              {!providers.includes("email") && (
                <span className={styles.warningHint}>
                  {" "}
                  (設置密碼可啟用電子郵件登入)
                </span>
              )}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder={
                providers.includes("email")
                  ? "如不修改密碼請留空"
                  : "設置新密碼以啟用電子郵件登入"
              }
            />
          </div>
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
