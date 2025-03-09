"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import jwt from "jsonwebtoken";
import { signIn, signOut, useSession, getSession } from "next-auth/react";
import {
  auth,
  signInWithPhoneNumber,
  setupRecaptcha,
} from "../../config/firebase";

// 添加 publicAdminPaths
const publicAdminPaths = ["/admin/login", "/admin/register"];

const appKey = "loginWithToken";
const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

export function AuthProvider({ children }) {
  const { data: session } = useSession();
  const [user, setUser] = useState(-1);
  const router = useRouter();
  const pathname = usePathname();
  const protectedRoutes = ["/admin"];
  const loginRoute = "/admin/login";

  // 1. 添加一個 debugAuthState 函數進行調試
  const debugAuthState = () => {
    console.log("=== Auth 狀態檢查 ===");
    console.log("目前路徑:", pathname);
    console.log("用戶狀態:", user);
    console.log(
      "localStorage token:",
      localStorage.getItem(appKey) ? "存在" : "不存在"
    );
    if (localStorage.getItem(appKey)) {
      try {
        const decoded = jwt.decode(localStorage.getItem(appKey));
        console.log("Token 解析:", decoded);
      } catch (e) {
        console.log("Token 解析失敗:", e);
      }
    }
    console.log("NextAuth 會話:", session);
    console.log("=====================");
  };

  // 1 整合 token 驗證和用戶狀態設置
  useEffect(() => {
    // 初始化
    debugAuthState();
    const checkTokenAndSetUser = () => {
      const token = localStorage.getItem(appKey);
      console.log("token:", token);
      if (token) {
        const decoded = jwt.decode(token);

        // 詳細記錄
        console.log("解析的 token 内容:", decoded);
        console.log("token 中的用户 ID:", decoded?.id);
        console.log("token 是否有效:", !!decoded && !!decoded.id);

        // 檢查 token 是否過期
        if (decoded.exp) {
          const currentTime = Math.floor(Date.now() / 1000);
          console.log("當前時間:", currentTime);
          console.log("token 過期時間:", decoded.exp);
          console.log("token 是否過期:", decoded.exp < currentTime);
        }
      }

      if (!token) {
        if (user !== -1) {
          // 只有不是初始載入中狀態才設置
          setUser(null);
        }
        return;
      }

      try {
        // 解析 token
        const decoded = jwt.decode(token);
        console.log("解析 JWT Token:", decoded);

        // 確保 token 含有必要信息
        if (!decoded || (!decoded.id && !decoded.uid)) {
          console.warn("Token 結構無效，清除登入狀態");
          localStorage.removeItem(appKey);
          setUser(null);
          return;
        }

        // 檢查 token 是否過期
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
          console.warn("Token 已過期，清除登入狀態");
          localStorage.removeItem(appKey);
          setUser(null);
          return;
        }

        // 標準化用戶對象
        const standardUser = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name || decoded.displayName,
          providers: decoded.providers || ["unknown"],
        };
        console.log("設置用戶狀態:", standardUser);

        // 設置用戶狀態
        setUser(standardUser);
      } catch (error) {
        console.error("檢查 token 時發生錯誤:", error);
        localStorage.removeItem(appKey);
        setUser(null);
      }
    };

    // 初始檢查
    checkTokenAndSetUser();

    // 使用事件監聽而不是定時器
    const handleStorageChange = (event) => {
      if (event.key === appKey) {
        checkTokenAndSetUser();
      }
    };

    // 監聽 localStorage 變化
    window.addEventListener("storage", handleStorageChange);

    // 清理函數
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 2 NextAuth
  useEffect(() => {
    // 在 useAuth.js 中修改 handleSessionChange 函數
    const handleSessionChange = async () => {
      const session = await getSession();
      console.log("檢查session:", session);

      // 如果有活躍的會話但沒有本地 token，則嘗試社交登入流程
      if (session?.user && !localStorage.getItem(appKey)) {
        console.log("檢測到社交登入會話，但沒有本地 token");

        try {
          // 確定當前登錄的提供者類型
          let currentProvider;
          if (session.provider) {
            currentProvider = session.provider;
          } else if (
            session.user.email &&
            session.user.email.endsWith("@line.me")
          ) {
            currentProvider = "line";
          } else {
            currentProvider = "google";
          }

          // 獲取提供者特定ID
          let providerId =
            session.provider_id || session.user.id || session.user.sub;

          // 準備API請求數據
          const userData = {
            email: session.user.email || null,
            name: session.user.name || null,
            image: session.user.image || null,
            provider: currentProvider,
            provider_id: providerId,
          };

          console.log("發送到後端的社交登錄資料:", userData);

          // 檢查是否從帳號頁面過來的連結請求
          const isLinkingAccount =
            localStorage.getItem("returnToAccountPage") === "true";
          const linkToUserId = localStorage.getItem("linkToUserId");

          // 只有在明確標記為連結操作時，才添加 link_to_user_id 參數
          if (isLinkingAccount && linkToUserId) {
            userData.link_to_user_id = linkToUserId;
          }

          // 向後端 API 發送使用者數據
          const apiUrl = "http://localhost:3005/api/admin/social-login";
          console.log(`正在發送請求到: ${apiUrl}`);
          console.log(`請求方法: POST`);
          console.log(`請求頭: Content-Type: application/json`);
          console.log(`請求體:`, JSON.stringify(userData));

          // 添加超時處理
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(userData),
            signal: controller.signal,
            credentials: "include", // 包含cookies
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(
              `API響應錯誤: ${response.status} ${response.statusText}`
            );
            // 嘗試獲取錯誤詳情
            try {
              const errorData = await response.json();
              console.error(`API錯誤詳情:`, errorData);
            } catch (e) {
              console.error(`無法解析錯誤響應:`, e);
            }
            throw new Error(`API響應錯誤: ${response.status}`);
          }

          const result = await response.json();
          console.log("社交登入 API 響應:", result);

          if (result.status === "success") {
            // 正常登入情況下，應該有 token
            if (result.data && result.data.token) {
              const token = result.data.token;
              localStorage.setItem(appKey, token);
              const newUser = jwt.decode(token);
              setUser(newUser);

              // 清除標記
              localStorage.removeItem("returnToAccountPage");
              localStorage.removeItem("linkToUserId");

              // 根據來源跳轉
              if (isLinkingAccount) {
                router.replace("/admin/account");
              } else {
                router.replace("/");
              }
            }
            // 連結帳號成功的情況（沒有 token 但有成功訊息）
            else if (isLinkingAccount && result.message) {
              alert("提示: " + result.message);
              router.replace("/admin/account");

              // 清除標記
              localStorage.removeItem("returnToAccountPage");
              localStorage.removeItem("linkToUserId");
            }
            // 其他成功情況但沒有預期的數據結構
            else {
              console.warn("API 返回成功但缺少預期數據:", result);
            }
          } else {
            console.error("登入處理失敗:", result.message || "未知錯誤");

            // 顯示合適的訊息
            if (isLinkingAccount) {
              alert("連結帳號失敗: " + (result.message || "未知錯誤"));
            } else {
              alert("登入失敗: " + (result.message || "未知錯誤"));
            }
          }
        } catch (error) {
          console.error("處理社交登入失敗:", error);
          alert("處理失敗: " + error.message);
        }
      }
    };

    // 定義 handleStorageChange 函數
    const handleStorageChange = (event) => {
      if (event.key === appKey) {
        handleSessionChange();
      }
    };

    // 監聽會話變化事件
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleSessionChange();
      }
    };

    // 立即執行一次
    handleSessionChange();

    // 添加事件監聽器
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清理函數
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 3 為了google和line
  useEffect(() => {
    if (session?.user) {
      // 不要直接設置 session.user，而是提取必要信息
      // 並確保格式與系統其他部分一致
      const standardUser = {
        id: session.user.id || session.user.sub,
        email: session.user.email,
        name: session.user.name,
        providers: ["social"], // 或更具體的提供者
      };
      setUser(standardUser);
      // }
      // else if (session === null && user !== -1) {
      //   // 只有當不是初始載入狀態時才設置為 null
      //   setUser(null);
    }
  }, [session]);

  // 4 頁面保護與重定向
  useEffect(() => {
    // 等待用户状态初始化完成
    if (user === -1) return;

    //
    if (
      !user &&
      protectedRoutes.some((route) => pathname.startsWith(route)) &&
      !publicAdminPaths.includes(pathname)
    ) {
      // 未登入用戶嘗試需要登录的页面，重定向到登录页
      router.replace("/admin/login");
    }
    // 已登錄訪問登入/註冊頁面
    else if (user && publicAdminPaths.includes(pathname)) {
      // 已登錄訪問登入/註冊頁面，重定向到首頁
      console.log("已登入，禁止進入登入頁，跳轉到首頁");
      router.replace("/");
    }
  }, [user, pathname, router]);

  // 5 檢查用戶狀態 status
  useEffect(() => {
    // 只有當用戶已經設置（不是-1且不是null）時才檢查狀態
    if (!user || user === -1) return;

    const checkUserStatus = async () => {
      try {
        console.log("調用 status API 檢查用戶狀態");

        const response = await fetch("http://localhost:3005/api/admin/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(appKey)}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("狀態檢查響應:", result);

          if (result.status === "success" && result.data.token) {
            // 更新本地存储中的token
            localStorage.setItem(appKey, result.data.token);
            console.log("Token 已更新");
          }
        } else {
          console.warn("狀態檢查失敗，可能需要重新登入");
        }
      } catch (error) {
        console.error("檢查用戶狀態時出錯:", error);
      }
    };

    // 頁面加載後檢查一次
    checkUserStatus();
  }, [user]); // 當用戶狀態改變時執行

  //  手機登入
  const loginWithPhone = async (phoneNumber) => {
    try {
      if (!window.recaptchaVerifier) {
        throw new Error("系統錯誤，請重新整理頁面後再試");
      }

      // 处理台湾手机号码格式
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith("09")) {
        formattedPhone = "+886" + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith("+")) {
        formattedPhone = "+886" + phoneNumber;
      }

      console.log("發送驗證碼到:", formattedPhone);

      try {
        // 尝试发送验证码
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          window.recaptchaVerifier
        );

        console.log("验证码发送成功");

        // 返回验证函数
        return async (verificationCode) => {
          try {
            console.log("开始验证OTP...");
            // 验证OTP
            const result = await confirmationResult.confirm(verificationCode);
            console.log("OTP验证成功:", result.user.phoneNumber);

            if (result.user) {
              // 检查是否是账号连结操作
              const isLinking =
                localStorage.getItem("isLinkingAccount") === "true";
              const linkToUserId = localStorage.getItem("linkToUserId");

              if (isLinking && linkToUserId) {
                console.log("检测到账号连结操作");
                // 转换为09开头的格式
                const displayPhone = formattedPhone.startsWith("+886")
                  ? "0" + formattedPhone.substring(4)
                  : formattedPhone;

                try {
                  const response = await fetch(
                    "http://localhost:3005/api/admin/social-login",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        provider: "phone",
                        provider_id: displayPhone, // 使用09开头的格式
                        name: "手機用戶",
                        link_to_user_id: linkToUserId,
                        force_link: true,
                        stay_on_account_page: true,
                      }),
                      credentials: "include",
                    }
                  );

                  if (!response.ok) {
                    const errorData = await response.json();
                    console.error("账号连结失败:", errorData);
                    throw new Error(
                      errorData.message || "綁定失敗，請稍後再試"
                    );
                  }

                  const data = await response.json();
                  console.log("账号连结成功:", data);

                  // 如果绑定成功，更新本地存储的token
                  if (data.status === "success" && data.data?.token) {
                    localStorage.setItem(appKey, data.data.token);
                    const newUser = jwt.decode(data.data.token);
                    setUser(newUser);
                  }

                  return {
                    success: data.status === "success",
                    user: result.user,
                  };
                } catch (linkError) {
                  console.error("账号连结请求失败:", linkError);
                  throw linkError;
                }
              }

              // 普通登录
              return { success: true, user: result.user };
            }
            return { success: false };
          } catch (error) {
            console.error("驗證碼確認失敗:", error);
            throw error;
          }
        };
      } catch (sendError) {
        console.error("发送验证码失败:", sendError);

        // 处理特定的Firebase错误
        if (sendError.code === "auth/invalid-phone-number") {
          throw new Error("手機號碼格式無效，請確認後重試");
        } else if (sendError.code === "auth/too-many-requests") {
          throw new Error("發送請求過於頻繁，請稍後再試");
        } else if (sendError.code === "auth/quota-exceeded") {
          throw new Error("今日驗證碼發送次數已達上限，請明天再試");
        } else {
          throw sendError;
        }
      }
    } catch (error) {
      console.error("發送驗證碼失敗:", error);

      // 如果是reCAPTCHA错误，尝试重置
      if (
        error.code === "auth/argument-error" ||
        error.code === "auth/captcha-check-failed"
      ) {
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        } catch (e) {
          console.error("清除reCAPTCHA失敗:", e);
        }
      }

      throw error;
    }
  };

  //  google和line登入
  const handleSocialLogin = async (provider) => {
    try {
      // 检查是否为连结操作
      const isLinking = localStorage.getItem("isLinkingAccount") === "true";
      const linkToUserId = localStorage.getItem("linkToUserId");
      const returnToAccountPage =
        localStorage.getItem("returnToAccountPage") === "true";

      console.log(`尝试 ${provider} ${isLinking ? "连结" : "登入"}`, {
        isLinking,
        linkToUserId,
        returnToAccountPage,
        authSource: localStorage.getItem("authSource"),
      });

      await signIn(provider);

      // 等待会话建立
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const session = await getSession();
      console.log(`登入会话:`, session);

      if (!session?.user) {
        console.error("无法取得用户资讯");
        return;
      }

      // 准备发送到后端的资料
      const userData = {
        email: session.user.email,
        name: session.user.name || `${provider}用户`,
        image: session.user.image || null,
        provider: provider.toLowerCase(),
        provider_id:
          session.user.id || session.user.sub || Date.now().toString(),
      };

      console.log("准备发送到后端的用户数据:", userData);

      // 只有在明确是连结操作时，才添加连结用户ID
      if (isLinking && linkToUserId) {
        userData.link_to_user_id = linkToUserId;
        userData.force_link = true;
        userData.stay_on_account_page = returnToAccountPage;
      }

      // 处理 Line 可能不提供 email 的情况
      if (!userData.email && provider === "line") {
        userData.email = `${userData.provider_id}@line.temporary.email`;
      }

      try {
        const apiUrl = "http://localhost:3005/api/admin/social-login";
        console.log(`正在发送请求到: ${apiUrl}`);
        console.log(`请求体:`, JSON.stringify(userData));

        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(userData),
          signal: controller.signal,
          credentials: "include", // 包含cookies
        });

        clearTimeout(timeoutId);

        // 检查响应状态
        if (!response.ok) {
          let errorMessage = `API响应错误: ${response.status}`;
          let errorDetails = {};

          try {
            errorDetails = await response.json();
            errorMessage = errorDetails.message || errorMessage;
          } catch (e) {
            console.error("无法解析错误响应:", e);
          }

          console.error(errorMessage, errorDetails);
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("API响应:", result);

        if (result.status === "success") {
          if (isLinking && returnToAccountPage) {
            // 清除连结标记
            localStorage.removeItem("isLinkingAccount");
            localStorage.removeItem("linkToUserId");
            localStorage.removeItem("returnToAccountPage");
            localStorage.removeItem("authSource");

            // 显示成功讯息并刷新页面
            alert(`${provider}帐号连结成功！`);
            window.location.reload();
          } else {
            // 普通登入
            const token = result.data.token;
            localStorage.setItem(appKey, token);
            setUser(jwt.decode(token));

            // 清除连结标记
            localStorage.removeItem("isLinkingAccount");
            localStorage.removeItem("linkToUserId");
            localStorage.removeItem("returnToAccountPage");
            localStorage.removeItem("authSource");

            if (isLinking) {
              alert(`${provider}帐号连结成功！`);
            }
          }
        } else {
          throw new Error(result.message || "处理失败");
        }
      } catch (error) {
        console.error("API请求失败:", error);

        // 如果是网络错误或超时，提供更友好的错误信息
        if (error.name === "AbortError") {
          alert("服务器响应超时，请稍后再试");
        } else if (
          error.message.includes("NetworkError") ||
          error.message.includes("Failed to fetch")
        ) {
          alert("网络连接错误，请检查您的网络连接");
        } else {
          alert(error.message || "登录处理失败，请稍后再试");
        }

        // 清除会话状态
        await signOut({ redirect: false });
      }
    } catch (error) {
      console.error("处理失败:", error);
      alert(error.message || "登录处理失败，请稍后再试");
    }
  };

  // 使用統一處理函數
  const loginWithGoogle = () => handleSocialLogin("google");
  const loginWithLine = () => {
    console.log("执行 loginWithLine");
    handleSocialLogin("line");
  };

  // 臨時解決方案：直接設置用戶狀態
  const setTempUser = (userData) => {
    console.log("設置臨時用戶:", userData);
    setUser(userData);
  };

  //  loginWithEmail
  const loginWithEmail = async (email, password) => {
    let API = "http://localhost:3005/api/admin/login";
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch(API, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.status !== "success") {
        alert("帳號或密碼錯誤");
        return { status: "error", message: result.message || "登入失敗" };
      }

      const token = result.data.token;
      const newUser = jwt.decode(token);
      setUser(newUser);
      localStorage.setItem(appKey, token);
      return { status: "success", user: newUser };
    } catch (err) {
      console.error("登入錯誤:", err);
      alert(err.message);
      return { status: "error", message: err.message };
    }
  };

  //  register
  const register = async (email, password) => {
    let API = "http://localhost:3005/api/admin/register";
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch(API, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.status !== "success") {
        alert(result.message || "註冊失敗");
        return { status: "error", message: result.message || "註冊失敗" };
      }

      return { status: "success", message: "註冊成功" };
    } catch (err) {
      console.error("註冊錯誤:", err);
      alert(err.message);
      return { status: "error", message: err.message };
    }
  };

  //   登出 (手動帳號 & Google)
  const logout = async () => {
    console.log("執行登出操作");

    // 清除本地
    localStorage.removeItem(appKey);
    localStorage.removeItem("userData");

    // 清除 NextAuth 會話
    await signOut({ redirect: false });
    await getSession();

    // 手動觸發會話變更事件
    document.dispatchEvent(new Event("visibilitychange"));

    // 設置用戶狀態為 null
    setUser(null);

    // 跳轉到登入頁
    setTimeout(() => {
      router.replace("/admin/login");
    }, 50);
  };

  // 在 useAuth 中
  function getToken() {
    if (typeof window === "undefined") {
      // 代表在伺服器端，無法使用 localStorage
      return null;
    }
    return localStorage.getItem("loginWithToken");
  }

  const getDecodedToken = () => {
    try {
      const token = localStorage.getItem(appKey);
      console.log(`嘗試解碼token: ${token ? "有token" : "無token"}`);

      if (!token) return null;

      const decoded = jwt.decode(token);
      console.log(`解碼結果:`, decoded);

      if (!decoded) {
        console.error("Token解碼失敗");
        return null;
      }

      // 檢查token是否有效
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log("Token已過期");
        localStorage.removeItem(appKey);
        return null;
      }

      return decoded;
    } catch (error) {
      console.error("解碼token時出錯:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithEmail,
        loginWithGoogle,
        loginWithLine,
        loginWithPhone,
        logout,
        register,
        getToken,
        getDecodedToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
