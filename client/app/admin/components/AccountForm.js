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
  const { getToken, getDecodedToken, user, loginWithGoogle, loginWithLine } =
    useAuth();
  const token = getToken();
  const decodedToken = getDecodedToken();
  console.log("user", user);
  console.log("token", token);
  console.log("更新資料的用戶ID", decodedToken);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [originalEmail, setOriginalEmail] = useState(""); // 儲存原始 email 值

  // 連結電話登入
  // 在 AccountForm.js 中添加狀態管理電話連結模態視窗
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const { loginWithPhone } = useAuth();

  // 處理連結 Google 帳號
  const handleAddGoogleLogin = () => {
    // 獲取當前用戶ID
    const userId = getDecodedToken()?.id;
    if (!userId) {
      setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
      return;
    }

    // 清除所有舊標記
    localStorage.removeItem("authSource");
    localStorage.removeItem("linkToUserId");
    localStorage.removeItem("returnToAccountPage");
    localStorage.removeItem("isLinkingAccount");

    // 設置新標記 - 使用明確的來源標識
    localStorage.setItem("authSource", "account_link");
    localStorage.setItem("linkToUserId", userId);

    console.log("從會員中心發起Google連結請求", {
      userId,
      timestamp: new Date().toISOString(),
    });

    loginWithGoogle();
  };

  // 處理連結 Line 帳號
  const handleAddLineLogin = () => {
    // 獲取當前用戶ID
    const userId = getDecodedToken()?.id;
    if (!userId) {
      setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
      return;
    }

    // 清除所有舊標記
    localStorage.removeItem("authSource");
    localStorage.removeItem("linkToUserId");
    localStorage.removeItem("returnToAccountPage");
    localStorage.removeItem("isLinkingAccount");

    // 設置新標記
    localStorage.setItem("authSource", "account_link");
    localStorage.setItem("linkToUserId", userId);
    localStorage.setItem("isLinkingAccount", "true"); // 明確標記為連結操作
    localStorage.setItem("returnToAccountPage", "true");

    console.log("從會員中心發起Line連結請求", {
      userId,
      timestamp: new Date().toISOString(),
      isLinkingAccount: true,
    });

    loginWithLine();
  };

  // 處理連結電話號碼
  // 處理連結電話號碼
  const handleAddPhoneLogin = () => {
    // 獲取當前用戶ID
    const userId = getDecodedToken()?.id;
    if (!userId) {
      setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
      return;
    }

    // 清除所有舊標記
    localStorage.removeItem("authSource");
    localStorage.removeItem("linkToUserId");
    localStorage.removeItem("returnToAccountPage");
    localStorage.removeItem("isLinkingAccount");

    // 設置新標記
    localStorage.setItem("linkToUserId", userId);
    localStorage.setItem("returnToAccountPage", "true"); // 明確標記這是一個連結操作

    console.log("從會員中心發起電話連結請求", {
      userId,
      timestamp: new Date().toISOString(),
    });

    setShowPhoneModal(true);
  };

  // 發送 OTP

  const sendOTP = async () => {
    try {
      // 格式化手機號碼
      const formattedPhone = formatPhoneNumber(phone);
      console.log("發送 OTP 給:", formattedPhone);

      if (!formattedPhone.startsWith("+")) {
        setMessage({
          type: "error",
          text: "請輸入完整的國際格式，例如：+886912345678",
        });
        return;
      }

      // 獲取當前用戶ID，為後續連結做準備
      const userId = getDecodedToken()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }
      console.log(`準備將手機號 ${formattedPhone} 連結到用戶ID: ${userId}`);

      const confirmationFunc = await loginWithPhone(formattedPhone);
      if (confirmationFunc) {
        console.log("OTP 發送成功，等待用戶輸入驗證碼");
        setConfirmation(() => confirmationFunc);
        setMessage({ type: "success", text: "驗證碼已發送至您的手機" });
      } else {
        setMessage({ type: "error", text: "OTP 發送失敗，請稍後再試" });
      }
    } catch (error) {
      console.error("發送 OTP 失敗:", error);
      setMessage({ type: "error", text: "發送 OTP 失敗，請稍後再試" });
    }
  };

  // 驗證 OTP
  const verifyOTP = async () => {
    try {
      if (!confirmation) {
        setMessage({ type: "error", text: "請先發送驗證碼！" });
        return;
      }

      // 獲取當前用戶ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      localStorage.setItem("returnToAccountPage", "true");
      localStorage.setItem("linkToUserId", userId);

      // 執行 OTP 驗證
      const result = await confirmation(otp);
      console.log("OTP 驗證結果:", result);
      if (result && result.user) {
        // OTP驗證成功，現在調用API將電話與用戶綁定
        const linkResponse = await fetch(
          "http://localhost:3005/api/admin/social-login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "phone",
              provider_id: result.user.phoneNumber || phone,
              name: formData.name || "手機用戶",
              link_to_user_id: userId, // 明確指定要綁定的用戶ID
            }),
          }
        );

        const linkResult = await linkResponse.json();

        if (linkResult.status === "success") {
          setMessage({ type: "success", text: "手機號碼已成功連結" });
          setShowPhoneModal(false);
          // 刷新提供者列表
          fetchMemberData();
        } else {
          setMessage({
            type: "error",
            text: linkResult.message || "連結手機號碼失敗",
          });
        }
      } else {
        setMessage({ type: "error", text: "驗證碼錯誤，請重新輸入" });
      }
    } catch (error) {
      console.error("驗證過程錯誤:", error);
      setMessage({ type: "error", text: `驗證錯誤: ${error.message}` });
    }
  };

  // 格式化手機號碼函數
  const formatPhoneNumber = (number) => {
    // 如果用戶輸入的是台灣號碼，幫他補 `+886`
    if (number.startsWith("0") && number.length === 10) {
      return "+886" + number.slice(1); // 移除 `0`，加上 `+886`
    }
    return number;
  };

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

  // 在 AccountForm.js 中的 useEffect 中添加
  useEffect(() => {
    // 初始載入資料
    fetchMemberData();

    // 處理 URL 查詢參數
    const queryParams = new URLSearchParams(window.location.search);
    const error = queryParams.get("error");
    const success = queryParams.get("success");

    if (error) {
      setMessage({
        type: "error",
        text:
          error === "missing_params"
            ? "參數不完整"
            : error === "invalid_state"
            ? "無效的請求狀態"
            : error === "invalid_state_format"
            ? "請求格式錯誤"
            : error === "callback_error"
            ? "回調處理錯誤"
            : `連結失敗: ${error}`,
      });

      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === "line_linked") {
      setMessage({ type: "success", text: "LINE 帳號連結成功！" });
      // 重新獲取會員資料以更新登入方式
      fetchMemberData();

      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    // "/uploads/avatars/https://lh3.googleusercontent.com/a/ACg8ocKEE0ObKSmGWxM11lx3160U3XbXBWfk83iT1i57A8h_YG7z=s96-c"
    // if (formData.avatar && formData.avatar !== "" ) {
    //   return `http://localhost:3005${formData.avatar}`; // 後端路徑
    // }

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
            // 添加到 AccountForm.js 的 providersSection 區域
            <div className={styles.providersSection}>
              <h3>已連結的登入方式</h3>
              <ul className={styles.providerList}>
                {providers.map((provider) => (
                  <li key={provider} className={styles.providerItem}>
                    {getProviderName(provider)}
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

              {/* 添加連結新登入方式的區域 */}
              <div className={styles.addProviderSection}>
                <h4>連結更多登入方式</h4>
                <div className={styles.addProviderButtons}>
                  {!providers.includes("google") && (
                    <button
                      className={styles.addGoogleBtn}
                      onClick={handleAddGoogleLogin}
                      disabled={isLoading}
                    >
                      <img src="/img/ic_google.svg" alt="Google logo" />
                      連結 Google 帳號
                    </button>
                  )}
                  {!providers.includes("line") && (
                    <button
                      className={styles.addLineBtn}
                      onClick={handleAddLineLogin}
                      disabled={isLoading}
                    >
                      <img src="/img/line.png" alt="Line logo" />
                      連結 Line 帳號
                    </button>
                  )}
                  {!providers.includes("phone") && (
                    <button
                      className={styles.addPhoneBtn}
                      onClick={handleAddPhoneLogin}
                      disabled={isLoading}
                    >
                      <img src="/img/phone.svg" alt="Phone logo" />
                      連結手機號碼
                    </button>
                  )}
                </div>
              </div>
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
      {/* 電話連結模態視窗 */}
      {showPhoneModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>連結手機號碼</h3>
            {!confirmation ? (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">手機號碼</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+886912345678"
                  />
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={sendOTP}
                    disabled={isLoading}
                  >
                    發送驗證碼
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setShowPhoneModal(false)}
                  >
                    取消
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="otp">驗證碼</label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="請輸入驗證碼"
                  />
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={verifyOTP}
                    disabled={isLoading}
                  >
                    驗證
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setShowPhoneModal(false)}
                  >
                    取消
                  </button>
                </div>
              </>
            )}
            <div id="recaptcha-container"></div>
          </div>
        </div>
      )}
    </div>
  );
}
