"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import styles from "./AccountForm.module.css";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField, Button, Box } from "@mui/material";
import zhTW from "date-fns/locale/zh-TW";

export default function AccountForm() {
  const {
    getDecodedToken,
    getToken,
    loginWithGoogle,
    loginWithLine,
    loginWithPhone,
  } = useAuth();
  const [message, setMessage] = useState(null);
  const [providers, setProviders] = useState([]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("/img/default-avatar.png");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "", // 生日字段
  });
  console.log("formData", formData);
  const token = getToken ? getToken() : null;
  const decodedToken = getDecodedToken ? getDecodedToken() : null;
  // console.log("user", user);
  console.log("token", token);
  console.log("更新資料的用戶ID", decodedToken);
  const [originalEmail, setOriginalEmail] = useState(""); // 儲存原始 email 值

  // 處理連結 Google 帳號
  const handleAddGoogleLogin = () => {
    try {
      console.log("開始Google帳號連結流程");

      // 獲取當前用戶ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用戶ID");
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      // 清除所有舊標記
      localStorage.removeItem("isLinkingAccount");
      localStorage.removeItem("linkToUserId");
      localStorage.removeItem("returnToAccountPage");
      localStorage.removeItem("authSource");
      localStorage.removeItem("forceLink");

      // 設置連結標記
      localStorage.setItem("isLinkingAccount", "true");
      localStorage.setItem("linkToUserId", userId);
      localStorage.setItem("returnToAccountPage", "true");
      localStorage.setItem("authSource", "account");

      console.log("設置連結參數:", {
        isLinkingAccount: true,
        userId: userId,
        returnToAccountPage: true,
        authSource: "account",
      });

      // 執行Google登入
      loginWithGoogle();
    } catch (error) {
      console.error("Google帳號連結失敗:", error);
      setMessage({ type: "error", text: "Google帳號連結失敗，請稍後再試" });
    }
  };

  // 處理連結 Line 帳號
  const handleAddLineLogin = () => {
    try {
      console.log("開始LINE帳號連結流程");

      // 獲取當前用戶ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用戶ID");
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      // 清除所有舊標記
      localStorage.removeItem("isLinkingAccount");
      localStorage.removeItem("linkToUserId");
      localStorage.removeItem("returnToAccountPage");
      localStorage.removeItem("authSource");
      localStorage.removeItem("forceLink");

      // 設置連結標記
      localStorage.setItem("isLinkingAccount", "true");
      localStorage.setItem("linkToUserId", userId);
      localStorage.setItem("returnToAccountPage", "true");
      localStorage.setItem("authSource", "account");

      console.log("設置連結參數:", {
        isLinkingAccount: true,
        userId: userId,
        returnToAccountPage: true,
        authSource: "account",
      });

      // 執行LINE登入
      loginWithLine();
    } catch (error) {
      console.error("LINE帳號連結失敗:", error);
      setMessage({ type: "error", text: "LINE帳號連結失敗，請稍後再試" });
    }
  };

  // 處理連結電話號碼
  const handleAddPhoneLogin = () => {
    try {
      console.log("開始手機帳號連結流程");

      // 獲取當前用戶ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用戶ID");
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      // 清除所有舊標記
      localStorage.removeItem("isLinkingAccount");
      localStorage.removeItem("linkToUserId");
      localStorage.removeItem("returnToAccountPage");
      localStorage.removeItem("authSource");
      localStorage.removeItem("forceLink");

      // 設置連結標記
      localStorage.setItem("isLinkingAccount", "true");
      localStorage.setItem("linkToUserId", userId);
      localStorage.setItem("returnToAccountPage", "true");
      localStorage.setItem("authSource", "account");

      console.log("設置連結參數:", {
        isLinkingAccount: true,
        userId: userId,
        returnToAccountPage: true,
        authSource: "account",
      });

      setShowPhoneModal(true);
    } catch (error) {
      console.error("開啟手機連結對話框失敗:", error);
      setMessage({ type: "error", text: "無法開啟手機連結對話框，請稍後再試" });
    }
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
      console.log("開始驗證OTP");

      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        setMessage({ type: "error", text: "請輸入6位數字驗證碼" });
        return;
      }

      const userId = getDecodedToken?.()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      const result = await confirmation(otp);

      if (result && result.success) {
        // 更新providers列表
        if (!providers.includes("phone")) {
          setProviders((prev) => [...prev, "phone"]);
        }

        // 更新表单中的手机号码
        setFormData((prev) => ({
          ...prev,
          phone: phone, // 使用验证过的手机号码更新表单
        }));

        setShowPhoneModal(false);
        setMessage({ type: "success", text: "手機號碼已成功連結" });

        // 重新获取用户数据以确保所有信息都是最新的
        fetchMemberData();
      } else {
        setMessage({ type: "error", text: "驗證碼驗證失敗，請重試" });
      }
    } catch (error) {
      console.error("OTP驗證過程中出錯:", error);
      setMessage({ type: "error", text: error.message });
    }
  };

  // 封裝連結手機號碼的邏輯
  const linkPhoneNumber = async (phoneNumber, userId, forceLink) => {
    const apiUrl = "http://localhost:3005/api/admin/social-login";
    console.log(`正在發送請求到: ${apiUrl}`);
    console.log(`請求方法: POST`);
    console.log(`請求頭: Content-Type: application/json`);

    const requestData = {
      provider: "phone",
      provider_id: phoneNumber,
      name: formData.name || "手機用戶",
      link_to_user_id: userId, // 明確指定要綁定的用戶ID
      force_link: forceLink, // 是否強制覆蓋現有連結
      stay_on_account_page: true, // 新增參數，表示保持在會員中心頁面
    };

    console.log(`請求體:`, JSON.stringify(requestData));

    // 添加超時處理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時

    try {
      const linkResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
        credentials: "include", // 包含cookies
      });

      clearTimeout(timeoutId);

      if (!linkResponse.ok) {
        console.error(
          `API響應錯誤: ${linkResponse.status} ${linkResponse.statusText}`
        );
        // 嘗試獲取錯誤詳情
        try {
          const errorData = await linkResponse.json();
          console.error(`API錯誤詳情:`, errorData);
        } catch (e) {
          console.error(`無法解析錯誤響應:`, e);
        }
        throw new Error(`API響應錯誤: ${linkResponse.status}`);
      }

      const linkResult = await linkResponse.json();
      console.log("API響應結果:", linkResult);

      if (linkResult.status === "success") {
        console.log("手機號碼連結成功");
        return linkResult;
      } else {
        console.error("手機號碼連結失敗:", linkResult.message);
        throw new Error(linkResult.message || "手機號碼連結失敗");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
  const fetchMemberData = async () => {
    try {
      const userId = getDecodedToken?.()?.id;
      if (!userId) {
        console.error("無法獲取用戶ID");
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      console.log(`正在獲取用戶ID為 ${userId} 的資料`);

      // 使用fetch代替axios，确保请求正确发送
      const response = await fetch(
        `http://localhost:3005/api/admin/user?id=${userId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`獲取用戶資料失敗: ${response.status}`, errorText);
        throw new Error(`獲取用戶資料失敗: ${response.status}`);
      }

      const data = await response.json();
      console.log("獲取到的用戶資料:", data);

      if (data.status === "success") {
        const userData = data.data;
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          birthday: userData.birthday || "", // 直接使用字符串
        });
        setProviders(userData.providers || []);
        setAvatarPreview(getAvatarSrc(userData.head));
      } else {
        console.error("獲取用戶資料失敗:", data.message);
        setMessage({ type: "error", text: data.message || "獲取會員資料失敗" });
      }
    } catch (error) {
      console.error("獲取用戶資料錯誤:", error);
      setMessage({ type: "error", text: "獲取會員資料失敗，請稍後再試" });
    }
  };

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

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === "line_linked") {
      setMessage({ type: "success", text: "LINE 帳號連結成功！" });
      fetchMemberData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // 只在组件挂载时执行一次

  // 在组件加载时获取会员资料和设置reCAPTCHA
  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
      } catch (error) {
        console.error("设置reCAPTCHA失败:", error);
      }
    }
  }, []); // 只在组件挂载时执行一次

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理头像变更
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "請上傳圖片檔案" });
      return;
    }

    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "圖片大小不能超過2MB" });
      return;
    }

    // 创建本地预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // 保存文件以便后续上传
    setAvatarFile(file);
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const userId = getDecodedToken()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用戶ID，請重新登入" });
        return;
      }

      // 準備要發送的數據
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);

      // 只有当手机号码存在且不为空时才添加
      if (formData.phone && formData.phone.trim()) {
        formDataToSend.append("phone", formData.phone);
      }

      // 添加生日字段
      if (formData.birthday) {
        formDataToSend.append("birthday", formData.birthday);
      }

      // 添加头像文件
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      console.log("正在提交表單數據:", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        birthday: formData.birthday,
        hasAvatar: !!avatarFile,
      });

      const response = await fetch("http://localhost:3005/api/admin/update", {
        method: "POST",
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`更新失敗: ${response.status}`, errorText);
        throw new Error(`更新失敗: ${response.status}`);
      }

      const result = await response.json();
      console.log("更新結果:", result);

      if (result.status === "success") {
        setMessage({ type: "success", text: "資料更新成功" });
        // 更新本地存储的token
        if (result.data && result.data.token) {
          localStorage.setItem("loginWithToken", result.data.token);
        }
      } else {
        setMessage({ type: "error", text: result.message || "更新失敗" });
      }
    } catch (error) {
      console.error("更新錯誤:", error);
      setMessage({ type: "error", text: `更新錯誤: ${error.message}` });
    }
  };

  // 获取头像源
  const getAvatarSrc = (head) => {
    if (!head) {
      return "/img/default-avatar.png"; // 默认头像
    }

    // 如果是完整URL（如Google或LINE头像）
    if (head.startsWith("http")) {
      return head;
    }

    // 如果是服务器上的头像
    return `http://localhost:3005${head}`;
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
    <div className={styles.accountFormContainer}>
      <h2>會員資料</h2>
      {message && (
        <div
          className={`${styles.message} ${
            message.type ? styles[message.type] : ""
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="avatar">頭像</label>
          <div className={styles.avatarContainer}>
            <img
              src={avatarPreview}
              alt="用戶頭像"
              className={styles.avatarPreview}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className={styles.avatarInput}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="name">姓名</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">電子郵件</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly={isEmailReadOnly}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">手機號碼</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="birthday">生日</label>
          <input
            type="date"
            id="birthday"
            name="birthday"
            value={formData.birthday || ""}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.btnSave}>
            儲存變更
          </button>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={handleCancel}
          >
            取消
          </button>
        </div>
      </form>

      <div className={styles.loginMethods}>
        <h3>登入方式</h3>
        <div className={styles.providersList}>
          {providers.map((provider) => (
            <div key={provider} className={styles.providerItem}>
              <span>{getProviderName(provider)}</span>
              {providers.length > 1 && (
                <button
                  onClick={() => handleRemoveProvider(provider)}
                  className={styles.btnRemove}
                >
                  移除
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.addLoginMethods}>
          {!providers.includes("google") && (
            <button
              onClick={handleAddGoogleLogin}
              className={styles.btnAddGoogle}
            >
              連結 Google 帳號
            </button>
          )}
          {!providers.includes("line") && (
            <button onClick={handleAddLineLogin} className={styles.btnAddLine}>
              連結 LINE 帳號
            </button>
          )}
          {!providers.includes("phone") && (
            <button
              onClick={handleAddPhoneLogin}
              className={styles.btnAddPhone}
            >
              連結手機號碼
            </button>
          )}
        </div>
      </div>

      {showPhoneModal && (
        <div className={styles.phoneModal}>
          <div className={styles.phoneModalContent}>
            <h3>連結手機號碼</h3>
            {!confirmation ? (
              <>
                <div className={styles.formGroup}>
                  <label>手機號碼</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+886912345678"
                    className={styles.input}
                  />
                  <small>請輸入完整國際格式，例如：+886912345678</small>
                </div>
                <div id="recaptcha-container"></div>
                <button onClick={sendOTP} className={styles.btnSendOtp}>
                  發送驗證碼
                </button>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>驗證碼</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="請輸入6位數驗證碼"
                    className={styles.input}
                  />
                </div>
                <button onClick={verifyOTP} className={styles.btnVerifyOtp}>
                  驗證
                </button>
              </>
            )}
            <button
              onClick={() => setShowPhoneModal(false)}
              className={styles.btnClose}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
