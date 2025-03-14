"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import styles from "./AccountForm.module.css";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../../config/firebase";

import { LinearProgress } from "@mui/material";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "flatpickr/dist/themes/material_blue.css";
import "flatpickr/dist/flatpickr.min.css";
import "../../rent/components/flatpickr.css";

// 登入方式 icon
import { FcGoogle } from "react-icons/fc";

import { FaLine } from "react-icons/fa"; // Line
import { FaSquarePhone } from "react-icons/fa6"; // 手機
import { IoMdMail } from "react-icons/io";

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
  const [avatarPreview, setAvatarPreview] = useState(null);
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
  console.log("更新資料的用户ID", decodedToken);
  const [originalEmail, setOriginalEmail] = useState(""); // 儲存原始 email 值
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [nextLevel, setNextLevel] = useState(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [allLevels, setAllLevels] = useState([]);
  const [rewardMessage, setRewardMessage] = useState(null);

  // 添加 birthdayInputRef
  const birthdayInputRef = useRef(null);

  // 處理連結 Google 帳號
  const handleAddGoogleLogin = () => {
    try {
      console.log("開始Google帳號連結流程");

      // 獲取當前用户ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用户ID");
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
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

      // 獲取當前用户ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用户ID");
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
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

      // 獲取當前用户ID
      const userId = getDecodedToken()?.id;
      if (!userId) {
        console.error("無法獲取用户ID");
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
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

  // 在組件加載時設置reCAPTCHA
  useEffect(() => {
    const setupRecaptcha = () => {
      try {
        if (typeof window !== "undefined" && !window.recaptchaVerifier) {
          // 確保 auth 已經初始化
          if (!auth) {
            console.error("Firebase auth 未初始化");
            return;
          }

          // 確保容器存在
          const container = document.getElementById("recaptcha-container");
          if (!container) {
            console.error("找不到 recaptcha-container 元素");
            return;
          }

          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {
                console.log("reCAPTCHA solved");
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired");
              },
            }
          );
        }
      } catch (error) {
        console.error("設置reCAPTCHA失敗:", error);
      }
    };

    // 延遲初始化，確保DOM已完全加載
    const timer = setTimeout(() => {
      if (document.getElementById("recaptcha-container")) {
        setupRecaptcha();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      // 清理 reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error("清除 reCAPTCHA 失敗:", e);
        }
      }
    };
  }, []);

  // 獲取點數歷史和等級信息
  const fetchPointsHistory = async () => {
    try {
      const userId = getDecodedToken?.()?.id;
      if (!userId) {
        console.error("無法獲取用户ID");
        return;
      }

      // 獲取 token
      const token = getToken?.();
      if (!token) {
        console.error("無法獲取 token");
        return;
      }

      console.log("正在獲取點數歷史，用户ID:", userId);
      console.log("使用 token:", token.substring(0, 10) + "...");

      const response = await fetch(
        `http://localhost:3005/api/admin/points-history?id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`獲取點數歷史失敗: ${response.status}`, errorText);
        throw new Error(`獲取點數歷史失敗: ${response.status}`);
      }

      const data = await response.json();
      console.log("獲取到的點數歷史:", data);

      if (data.status === "success") {
        setPointsHistory(data.data.history || []);

        // 更新會員等級相關資訊
        if (data.data.current_level) {
          setFormData((prev) => ({
            ...prev,
            total_points: data.data.current_level.total_points || 0,
            level_id: data.data.current_level.level || 1,
          }));
        }

        // 設置下一等級資訊
        console.log("下一等級資訊:", data.data.next_level);
        setNextLevel(data.data.next_level);

        // 設置所有等級資訊
        console.log("所有等級資訊:", data.data.all_levels);
        setAllLevels(data.data.all_levels || []);

        // 檢查是否完成個人資料
        checkProfileCompletion();
      } else {
        console.error("獲取點數歷史失敗:", data.message);
      }
    } catch (error) {
      console.error("獲取點數歷史錯誤:", error);
    }
  };

  // 檢查是否可以獲得完善資料獎勵
  const checkProfileCompletion = () => {
    if (
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.birthday
    ) {
      setProfileCompleted(true);
    } else {
      setProfileCompleted(false);
    }
  };

  // 檢查是否已經領取過獎勵
  useEffect(() => {
    // 檢查點數歷史中是否有完善資料獎勵的記錄
    const hasClaimedReward = pointsHistory.some(
      (item) => item.action === "profile_completion"
    );
    if (hasClaimedReward) {
      setProfileCompleted(false); // 已領取過，不再顯示獎勵按鈕
    }
  }, [pointsHistory]);

  // 領取完善資料獎勵
  const claimProfileReward = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:3005/api/admin/complete-profile",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        // 更新本地存儲的token
        if (data.data && data.data.token) {
          localStorage.setItem("loginWithToken", data.data.token);
        }
        // 重新獲取會員資料
        fetchMemberData();
        fetchPointsHistory();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      console.error("領取獎勵失敗:", error);
      setMessage({ type: "error", text: "領取獎勵失敗，請稍後再試" });
    } finally {
      setIsLoading(false);
    }
  };

  // 在組件加載時獲取點數歷史
  useEffect(() => {
    if (token) {
      fetchPointsHistory();
    }
  }, [token]);

  // 監聽表單數據變化，檢查是否可以獲得完善資料獎勵
  useEffect(() => {
    checkProfileCompletion();
  }, [formData]);

  // 發送OTP
  const sendOTP = async () => {
    try {
      setIsLoading(true);

      if (!phone) {
        setMessage({ type: "error", text: "請輸入手機號碼" });
        return;
      }

      // 處理台灣手機號碼格式
      let formattedPhone = phone;
      if (phone.startsWith("09")) {
        formattedPhone = "+886" + phone.substring(1);
      } else if (!phone.startsWith("+")) {
        formattedPhone = "+886" + phone;
      }

      // 設置連結標記
      localStorage.setItem("isLinkingAccount", "true");
      localStorage.setItem("linkToUserId", getDecodedToken()?.id);
      localStorage.setItem("returnToAccountPage", "true");

      // 發送OTP
      const confirmationFn = await loginWithPhone(formattedPhone);
      if (confirmationFn) {
        setConfirmation(() => confirmationFn); // 確保設置為函數
        setMessage({ type: "success", text: "驗證碼已發送，請查收簡訊" });
      }
    } catch (error) {
      console.error("發送OTP失敗:", error);
      setMessage({
        type: "error",
        text: error.message || "發送驗證碼失敗，請稍後再試",
      });

      // 如果是reCAPTCHA錯誤，嘗試重置
      if (
        error.code === "auth/argument-error" ||
        error.code === "auth/captcha-check-failed"
      ) {
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }

          // 重新初始化
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {
                console.log("reCAPTCHA solved");
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired");
              },
            }
          );
        } catch (e) {
          console.error("重置 reCAPTCHA 失敗:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 驗證OTP
  const verifyOTP = async () => {
    try {
      setIsLoading(true);

      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        setMessage({ type: "error", text: "請輸入6位數字驗證碼" });
        return;
      }

      const userId = getDecodedToken?.()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
        return;
      }

      // 確保confirmation是一個函數
      if (typeof confirmation !== "function") {
        setMessage({ type: "error", text: "驗證碼已過期，請重新發送" });
        return;
      }

      console.log("開始驗證OTP...");
      try {
        const result = await confirmation(otp);
        console.log("OTP驗證結果:", result);

        if (result && result.success) {
          // 更新providers列表
          if (!providers.includes("phone")) {
            setProviders((prev) => [...prev, "phone"]);
          }

          // 更新表單中的手機號碼
          setFormData((prev) => ({
            ...prev,
            phone: phone, // 使用驗證過的手機號碼更新表單
          }));

          setShowPhoneModal(false);
          setMessage({ type: "success", text: "手機號碼已成功連結" });

          // 重新獲取用户數據以確保所有信息都是最新的
          fetchMemberData();
        } else {
          setMessage({ type: "error", text: "驗證碼驗證失敗，請重試" });
        }
      } catch (confirmError) {
        console.error("OTP確認過程中出錯:", confirmError);

        // 提供更詳細的錯誤信息
        if (confirmError.message.includes("帳號連結處理失敗")) {
          setMessage({
            type: "error",
            text: "手機號碼連結失敗，可能已被其他帳號使用",
          });
        } else if (
          confirmError.message.includes("auth/invalid-verification-code")
        ) {
          setMessage({ type: "error", text: "驗證碼無效，請重新輸入" });
        } else if (confirmError.message.includes("auth/code-expired")) {
          setMessage({ type: "error", text: "驗證碼已過期，請重新發送" });
        } else {
          setMessage({
            type: "error",
            text: confirmError.message || "驗證過程中出錯",
          });
        }
      }
    } catch (error) {
      console.error("OTP驗證過程中出錯:", error);
      setMessage({ type: "error", text: error.message || "驗證過程中出錯" });
    } finally {
      setIsLoading(false);
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
      name: formData.name || "手機用户",
      link_to_user_id: userId, // 明確指定要綁定的用户ID
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

  // 格式化手機號碼
  const formatPhoneNumber = (number) => {
    if (!number) return "";

    // 移除所有非數字字符
    let cleaned = number.replace(/\D/g, "");

    // 如果不是以0開頭，添加0
    if (!cleaned.startsWith("0") && cleaned.length > 0) {
      cleaned = "0" + cleaned;
    }

    return cleaned;
  };

  // 從後端獲取會員資料
  const fetchMemberData = async () => {
    try {
      const userId = getDecodedToken?.()?.id;
      if (!userId) {
        console.error("無法獲取用户ID");
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
        return;
      }

      // 獲取 token
      const token = getToken?.();
      if (!token) {
        console.error("無法獲取 token");
        setMessage({ type: "error", text: "無法獲取 token，請重新登入" });
        return;
      }

      console.log(`正在獲取用户ID為 ${userId} 的資料`);
      console.log("使用 token:", token.substring(0, 10) + "...");

      // 使用fetch代替axios，確保請求正確發送
      const response = await fetch(
        `http://localhost:3005/api/admin/user?id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`獲取用户資料失敗: ${response.status}`, errorText);
        throw new Error(`獲取用户資料失敗: ${response.status}`);
      }

      const data = await response.json();
      console.log("獲取到的用户資料:", data);

      if (data.status === "success") {
        const userData = data.data;
        console.log("獲取到的用户資料:", userData);

        // 更新表單數據
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          head: userData.head || "",
          is_custom_head: userData.is_custom_head,
          level_id: userData.level || 1,
          total_points: userData.total_points || 0,
          birthday: userData.birthday || "",
        });

        // 設置原始 email 值
        setOriginalEmail(userData.email || "");

        // 設置登入方式
        setProviders(userData.providers || []);

        // 清除預覽圖片，使用後端返回的頭像
        setAvatarPreview(null);

        console.log("用户資料已加載，頭像路徑:", userData.head);

        // 同時獲取點數歷史和會員等級資訊
        fetchPointsHistory();
      } else {
        console.error("獲取用户資料失敗:", data.message);
        setMessage({ type: "error", text: data.message || "獲取會員資料失敗" });
      }
    } catch (error) {
      console.error("獲取用户資料錯誤:", error);
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
          error === "account_already_linked"
            ? "此帳號已經連結到其他會員"
            : error === "phone_already_linked"
            ? "此手機號碼已經連結到其他會員"
            : "連結失敗，請稍後再試",
      });
    } else if (success) {
      setMessage({
        type: "success",
        text: success === "account_linked" ? "帳號連結成功" : "操作成功",
      });

      // 如果是成功連結帳號，重新獲取會員資料
      if (success === "account_linked") {
        fetchMemberData();
      }
    }

    // 清除 localStorage 中的連結標記
    localStorage.removeItem("isLinkingAccount");
    localStorage.removeItem("linkToUserId");
    localStorage.removeItem("returnToAccountPage");

    // 組件卸載時清理
    return () => {
      if (window && window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error("清除 reCAPTCHA 失敗:", e);
        }
      }
    };
  }, []);

  // 初始化 flatpickr 日期選擇器
  useEffect(() => {
    if (birthdayInputRef.current) {
      const fp = flatpickr(birthdayInputRef.current, {
        dateFormat: "Y-m-d",
        maxDate: new Date(),
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ["日", "一", "二", "三", "四", "五", "六"],
            longhand: [
              "星期日",
              "星期一",
              "星期二",
              "星期三",
              "星期四",
              "星期五",
              "星期六",
            ],
          },
          months: {
            shorthand: [
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
        onChange: (selectedDates, dateStr) => {
          setFormData((prev) => ({
            ...prev,
            birthday: dateStr,
          }));
        },
      });

      return () => {
        fp.destroy();
      };
    }
  }, [birthdayInputRef.current, formData.birthday]);

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

  // 處理頭像變更
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "請上傳圖片檔案" });
      return;
    }

    // 釋放舊的預覽URL（如果存在）
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    // 使用URL.createObjectURL創建預覽
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // 保存文件以便後續上傳
    setAvatarFile(file);

    // 顯示成功訊息
    setMessage({ type: "success", text: "圖片已上傳，點擊保存按鈕完成更新" });

    console.log("頭像已更新，預覽URL:", previewUrl);
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const userId = getDecodedToken()?.id;
      if (!userId) {
        setMessage({ type: "error", text: "無法獲取用户ID，請重新登入" });
        return;
      }

      // 準備要發送的數據
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);

      // 格式化手機號碼
      if (formData.phone && formData.phone.trim()) {
        formDataToSend.append("phone", formatPhoneNumber(formData.phone));
      }

      // 添加生日字段
      if (formData.birthday) {
        formDataToSend.append("birthday", formData.birthday);
      }

      // 添加頭像文件
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      console.log("正在提交表單數據:", {
        name: formData.name,
        email: formData.email,
        phone: formatPhoneNumber(formData.phone),
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
        setMessage({ type: "success", text: result.message });

        // 如果獲得了獎勵，顯示獎勵消息
        if (result.data.reward_added) {
          setRewardMessage({
            points: result.data.reward_points,
            message: `恭喜獲得 ${result.data.reward_points} 點獎勵！`,
          });

          // 3秒後自動關閉獎勵消息
          setTimeout(() => {
            setRewardMessage(null);
          }, 5000);
        }

        // 更新本地存儲的token
        if (result.data && result.data.token) {
          localStorage.setItem("loginWithToken", result.data.token);
        }

        // 重新獲取會員資料和點數歷史
        fetchMemberData();
        fetchPointsHistory();
      } else {
        setMessage({ type: "error", text: result.message || "更新失敗" });
      }
    } catch (error) {
      console.error("更新錯誤:", error);
      setMessage({ type: "error", text: `更新錯誤: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取頭像源
  const getAvatarSrc = () => {
    // 如果有預覽頭像（剛上傳但未保存），優先使用預覽
    if (avatarPreview && avatarPreview !== "/img/default-avatar.png") {
      console.log("使用預覽頭像:", avatarPreview);
      return avatarPreview;
    }

    // 如果有自定義頭像，使用自定義頭像
    if (formData.is_custom_head === 1 && formData.head) {
      // 移除/api前綴，確保URL格式正確
      const headPath = formData.head.startsWith("/api")
        ? formData.head.substring(4) // 移除/api前綴
        : formData.head;
      console.log("使用自定義頭像:", `http://localhost:3005${headPath}`);
      return `http://localhost:3005${headPath}`;
    }

    // 如果有社交賬號頭像，使用社交賬號頭像
    if (formData.head && !formData.is_custom_head) {
      // 直接返回原始 URL，不做任何修改
      console.log("使用社交賬號頭像:", formData.head);
      return formData.head;
    }

    // 默認頭像
    console.log("使用默認頭像");
    return "/images/default-avatar.png";
  };

  const handleCancel = () => {
    // 釋放本地預覽
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }

    // 清除上傳的文件
    setAvatarFile(null);

    // 重新從後端獲取資料
    fetchMemberData();
    setMessage(null);
  };

  // 在組件卸載時釋放預覽URL
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  // 處理密碼修改
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "新密碼與確認密碼不符" });
      return;
    }

    try {
      setIsLoading(true);

      // 判斷是修改密碼還是設置密碼
      const isSettingPassword = !providers.includes("email");
      const endpoint = isSettingPassword
        ? "http://localhost:3005/api/admin/set-password"
        : "http://localhost:3005/api/admin/change-password";

      const requestBody = isSettingPassword
        ? { newPassword: passwordData.newPassword }
        : {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.status === "success") {
        setMessage({ type: "success", text: data.message || "密碼更新成功" });
        setShowPasswordModal(false);

        // 如果是設置密碼，更新提供者列表
        if (isSettingPassword) {
          setProviders((prev) => [...prev, "email"]);
        }

        // 清空密碼表單
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "密碼更新失敗，請稍後再試",
        });
      }
    } catch (error) {
      console.error("密碼更新錯誤:", error);
      setMessage({
        type: "error",
        text: error.response?.data.message || "密碼更新失敗，請稍後再試",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取會員等級
  const getMemberLevel = () => {
    const totalPoints = formData.total_points || 0;

    if (totalPoints >= 10000) {
      return 5; // 鑽石會員
    } else if (totalPoints >= 5000) {
      return 4; // 白金會員
    } else if (totalPoints >= 2000) {
      return 3; // 金會員
    } else if (totalPoints >= 500) {
      return 2; // 銀會員
    } else {
      return 1; // 銅會員
    }
  };

  // 獲取會員等級名稱
  const getMemberLevelName = () => {
    const level = getMemberLevel();

    switch (level) {
      case 5:
        return "鑽石會員";
      case 4:
        return "白金會員";
      case 3:
        return "金會員";
      case 2:
        return "銀會員";
      case 1:
      default:
        return "銅會員";
    }
  };

  // 渲染會員等級進度條
  const renderLevelProgress = () => {
    if (!nextLevel) {
      console.log("沒有下一等級資訊，無法渲染進度條");
      return (
        <div className={styles.levelProgress}>
          <div className={styles.progressText}>已達最高等級</div>
          <div
            className={styles.progressBar}
            style={{ height: "8px", backgroundColor: "#e0e0e0" }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#4caf50",
              }}
            ></div>
          </div>
        </div>
      );
    }

    console.log("渲染會員等級進度條:", {
      currentPoints: formData.total_points,
      nextLevelPoints: nextLevel.points_required,
      percentage:
        ((formData.total_points || 0) / nextLevel.points_required) * 100,
    });

    const percentage = Math.min(
      ((formData.total_points || 0) / nextLevel.points_required) * 100,
      100
    );

    return (
      <div className={styles.levelProgress}>
        <div className={styles.progressText}>
          距離 {nextLevel.name} 還需 {nextLevel.points_to_next_level} 點
        </div>
        <div
          className={styles.progressBar}
          style={{ height: "8px", backgroundColor: "#e0e0e0" }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: "#4caf50",
              transition: "width 0.5s ease-in-out",
            }}
          ></div>
        </div>
        <div className={styles.progressText} style={{ marginTop: "5px" }}>
          {formData.total_points || 0}/{nextLevel.points_required} 點
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {rewardMessage && (
        <div className={styles.rewardNotification}>
          <div className={styles.rewardContent}>
            <div className={styles.rewardIcon}>🎁</div>
            <div className={styles.rewardText}>
              <div className={styles.rewardTitle}>獎勵通知</div>
              <div className={styles.rewardMessage}>
                {rewardMessage.message}
              </div>
            </div>
            <button
              className={styles.rewardCloseBtn}
              onClick={() => setRewardMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        {/* 大頭貼區塊 */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            <Image
              src={getAvatarSrc()}
              alt="會員頭像"
              width={250}
              height={250}
              className={styles.avatarImage}
              priority
            />
          </div>
          <div className={styles.memberLevel}>
            {getMemberLevelName()} (Lv.{getMemberLevel()})
          </div>
          <div className={styles.pointsInfo}>
            <span>{formData.total_points || 0} 點</span>
            <button
              className={styles.pointsHistoryBtn}
              onClick={() => setShowPointsModal(true)}
            >
              查看詳情
            </button>
          </div>
          {renderLevelProgress()}
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
          <div className={styles.providersSection}>
            <h3>已連結的登入方式</h3>
            <ul className={styles.providerList}>
              {providers.map((provider) => (
                <li key={provider} className={styles.providerItem}>
                  <span className={styles.providerIcon}>
                    {provider === "google" && <FcGoogle />}
                    {provider === "line" && (
                      <FaLine style={{ color: "#06C755" }} />
                    )}
                    {provider === "phone" && (
                      <FaSquarePhone style={{ color: "#4285F4" }} />
                    )}
                    {provider === "email" && (
                      <IoMdMail style={{ color: "#DB4437" }} />
                    )}
                  </span>
                  <span className={styles.providerName}>
                    {getProviderName(provider)}
                  </span>
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

            <div className={styles.addProviderSection}>
              <h4>連結更多登入方式</h4>
              <div className={styles.addProviderButtons}>
                {!providers.includes("google") && (
                  <button
                    className={styles.addGoogleBtn}
                    onClick={handleAddGoogleLogin}
                    disabled={isLoading}
                  >
                    <FcGoogle size={20} />
                    連結 Google 帳號
                  </button>
                )}
                {!providers.includes("line") && (
                  <button
                    className={styles.addLineBtn}
                    onClick={handleAddLineLogin}
                    disabled={isLoading}
                  >
                    <FaLine size={20} style={{ color: "#06C755" }} />
                    連結 Line 帳號
                  </button>
                )}
                {!providers.includes("phone") && (
                  <button
                    className={styles.addPhoneBtn}
                    onClick={handleAddPhoneLogin}
                    disabled={isLoading}
                  >
                    <FaSquarePhone size={20} style={{ color: "#4285F4" }} />
                    連結手機號碼
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 個人資訊區塊 */}
        <div className={styles.accountForm}>
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">姓名</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">
                電子郵件
                {isEmailReadOnly && (
                  <span className={styles.readonlyHint}> (不可修改)</span>
                )}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={isEmailReadOnly}
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
                placeholder="0912345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="birthday">生日</label>
              <input
                type="text"
                id="birthday"
                name="birthday"
                ref={birthdayInputRef}
                value={formData.birthday || ""}
                onChange={handleChange}
                placeholder="選擇生日"
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.changePasswordBtn}
                onClick={() => setShowPasswordModal(true)}
              >
                {providers.includes("email") ? "修改密碼" : "設置密碼"}
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isLoading}
              >
                {isLoading ? "處理中..." : "儲存變更"}
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
          </form>
        </div>
      </div>

      {/* 修改密碼 Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{providers.includes("email") ? "修改密碼" : "設置密碼"}</h3>
            <form onSubmit={handlePasswordChange}>
              {providers.includes("email") ? (
                <>
                  <div className={styles.formGroup}>
                    <label>目前密碼</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>新密碼</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>確認新密碼</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.socialLoginMessage}>
                    您目前使用社交媒體帳號登入，設置密碼後可以使用電子郵件和密碼登入。
                  </div>
                  <div className={styles.formGroup}>
                    <label>設置密碼</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>確認密碼</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </>
              )}

              <div className={styles.modalButtons}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isLoading}
                >
                  {isLoading ? "處理中..." : "確認修改"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isLoading}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 手機驗證 Modal */}
      {showPhoneModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>連結手機號碼</h3>
            {!confirmation ? (
              <>
                <div className={styles.formGroup}>
                  <label>手機號碼</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                  />
                  <small>請輸入台灣手機號碼，例如：0912345678</small>
                </div>
                <div className={styles.modalButtons}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={sendOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? "處理中..." : "發送驗證碼"}
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
                  <label>驗證碼</label>
                  <input
                    type="text"
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
                    {isLoading ? "處理中..." : "驗證"}
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
          </div>
        </div>
      )}

      {/* 點數歷史 Modal */}
      {showPointsModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>積分詳情</h3>

            {nextLevel && (
              <div className={styles.levelProgressModal}>
                <h4>
                  當前等級: {getMemberLevelName()} (Lv.{getMemberLevel()})
                </h4>
                <div className={styles.progressText}>
                  總積分: {formData.total_points || 0} 點
                </div>
                <div className={styles.progressText}>
                  距離 {nextLevel.name} 還需 {nextLevel.points_to_next_level} 點
                </div>
                <LinearProgress
                  variant="determinate"
                  value={
                    ((formData.total_points || 0) / nextLevel.points_required) *
                    100
                  }
                  className={styles.progressBar}
                />
              </div>
            )}

            <div className={styles.levelRulesSection}>
              <h4>會員等級規則</h4>
              <ul className={styles.levelRulesList}>
                {allLevels.map((level) => (
                  <li key={level.id}>
                    <span className={styles.levelName}>
                      {level.level_name} (Lv.{level.id})
                    </span>
                    <span className={styles.levelPoints}>
                      {level.min_points.toLocaleString()} 點
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.pointsHistoryList}>
              <h4>積分歷史記錄</h4>
              {pointsHistory.length > 0 ? (
                <ul>
                  {pointsHistory.map((item, index) => (
                    <li key={index} className={styles.historyItem}>
                      <div className={styles.historyReason}>
                        {item.description || item.action}
                      </div>
                      <div className={styles.historyPoints}>
                        {item.points > 0 ? "+" : ""}
                        {item.points} 點
                      </div>
                      <div className={styles.historyDate}>
                        {item.formatted_date}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>暫無積分記錄</p>
              )}
            </div>

            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowPointsModal(false)}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
