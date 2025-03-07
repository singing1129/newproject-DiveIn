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
    
          // 檢查是否從帳號頁面過來的連結請求
          const isLinking = localStorage.getItem("isLinkingAccount") === "true";
          const linkToUserId = localStorage.getItem("linkToUserId");
    
          // 準備API請求數據
          const userData = {
            email: session.user.email || null,
            name: session.user.name || null,
            image: session.user.image || null,
            provider: currentProvider,
            provider_id: providerId,
          };
    
          // 如果是連結操作，明確添加 link_to_user_id
          if (isLinking && linkToUserId) {
            userData.link_to_user_id = linkToUserId;
          }
    
          console.log("發送到後端的社交登錄資料:", userData);
    
          // 向後端 API 發送使用者數據
          const response = await fetch(
            "http://localhost:3005/api/admin/social-login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(userData),
            }
          );
    
          if (!response.ok) {
            throw new Error(
              `API響應錯誤: ${response.status} ${response.statusText}`
            );
          }
    
          const result = await response.json();
          console.log("社交登入 API 響應:", result);
    
          if (result.status === "success") {
            // 只有在不是連結操作或連結操作成功返回token的情況下才更新token
            if (result.data && result.data.token) {
              const token = result.data.token;
              localStorage.setItem(appKey, token);
              const newUser = jwt.decode(token);
              setUser(newUser);
            }
            
            // 清除連結標記
            localStorage.removeItem("isLinkingAccount");
            
            // 根據來源跳轉
            if (isLinking && localStorage.getItem("returnToAccountPage") === "true") {
              router.replace("/admin/account");
              localStorage.removeItem("returnToAccountPage");
              localStorage.removeItem("linkToUserId");
            }
          } else {
            console.error("登入處理失敗:", result.message || "未知錯誤");
            alert(result.message || "操作失敗");
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
      console.log("📲 執行 `loginWithPhone`，手機號碼:", phoneNumber);

      // 檢查 reCAPTCHA 容器
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        console.error("❌ 找不到 reCAPTCHA 容器");
        throw new Error("找不到 reCAPTCHA 容器");
      }

      // 設置 reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("清除舊的 reCAPTCHA 失敗:", e);
        }
      }

      window.recaptchaVerifier = setupRecaptcha("recaptcha-container");
      const appVerifier = window.recaptchaVerifier;

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      console.log("✅ `signInWithPhoneNumber` 執行成功");

      return async (otp) => {
        try {
          console.log("📤 使用 OTP 進行驗證:", otp);
          const result = await confirmationResult.confirm(otp);

          if (!result.user) {
            throw new Error("❌ Firebase `user` 為空");
          }

          // Firebase 驗證成功
          const firebaseUser = result.user;

          try {
            // 檢查是否為連結操作
            const isLinking =
              localStorage.getItem("returnToAccountPage") === "true";
            const linkToUserId = localStorage.getItem("linkToUserId");

            // 準備發送到後端的數據
            const userData = {
              provider: "phone",
              provider_id: firebaseUser.phoneNumber,
              name: firebaseUser.displayName || "手機用戶",
            };

            // 如果是連結操作，添加連結目標用戶ID
            if (isLinking && linkToUserId) {
              userData.link_to_user_id = linkToUserId;
            }

            // 調用後端 API
            const response = await fetch(
              "http://localhost:3005/api/admin/social-login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
              }
            );

            if (!response.ok) {
              throw new Error(`API響應錯誤: ${response.status}`);
            }

            const apiResult = await response.json();

            if (apiResult.status === "success") {
              // 只有在不是連結操作或連結操作成功返回token的情況下才更新token
              if (apiResult.data && apiResult.data.token) {
                // 保存 token 並更新用戶狀態
                const token = apiResult.data.token;
                localStorage.setItem(appKey, token);
                const newUser = jwt.decode(token);
                setUser(newUser);
              }

              // 清除連結標記
              if (isLinking) {
                // 不要在此處重新導向，讓 AccountForm 處理重新導向
                localStorage.removeItem("linkToUserId");
              }

              return { success: true, message: apiResult.message };
            } else {
              throw new Error(apiResult.message || "API 返回失敗狀態");
            }
          } catch (apiError) {
            console.error("API 調用失敗:", apiError);
            return { success: false, error: apiError.message };
          }
        } catch (error) {
          console.error("OTP 驗證失敗:", error);
          return { success: false, error: error.message };
        }
      };
    } catch (error) {
      console.error(" 手機登入錯誤:", error);
      alert("手機登入初始化失敗: " + error.message);
      return null;
    }
  };

  //  google和line登入
  // 更新 handleSocialLogin 函數
  const handleSocialLogin = async (provider) => {
    try {
      console.log(`嘗試 ${provider} 登入`);

      // 檢查是否為連結操作
      const isLinking = localStorage.getItem("isLinkingAccount") === "true";
      const linkToUserId = localStorage.getItem("linkToUserId");

      console.log(
        `是否為連結操作: ${isLinking}, 連結目標用戶ID: ${linkToUserId}`
      );

      await signIn(provider);

      // 等待會話建立
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const session = await getSession();
      console.log(`登入會話:`, session);

      if (!session?.user) {
        console.error("無法取得用戶資訊");
        return;
      }

      // 準備發送到後端的資料
      const userData = {
        email: session.user.email,
        name: session.user.name || `${provider}用戶`,
        image: session.user.image || null,
        provider: provider,
        provider_id:
          session.user.id || session.user.sub || Date.now().toString(),
      };

      // 處理 Line 可能不提供 email 的情況
      if (!userData.email && provider === "line") {
        userData.email = `${userData.provider_id}@line.temporary.email`;
      }

      // 添加連結帳號信息（如果適用）
      if (isLinking && linkToUserId) {
        userData.link_to_user_id = linkToUserId;
      }

      console.log(`發送到後端的資料:`, userData);

      // 呼叫 API
      const response = await fetch(
        "http://localhost:3005/api/admin/social-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      const result = await response.json();
      console.log(`API 回應:`, result);

      if (result.status === "success") {
        // 只有在不是連結操作或連結操作成功返回token的情況下才更新token
        if (result.data && result.data.token) {
          localStorage.setItem(appKey, result.data.token);
          setUser(jwt.decode(result.data.token));
        }

        // 清除連結標記
        localStorage.removeItem("isLinkingAccount");

        // 如果是連結操作，可能需要重新導向
        if (
          isLinking &&
          localStorage.getItem("returnToAccountPage") === "true"
        ) {
          router.replace("/admin/account");
          localStorage.removeItem("returnToAccountPage");
        }
      } else {
        console.error(`登入處理失敗:`, result.message);
        alert(result.message || "操作失敗");
      }
    } catch (error) {
      console.error(`登入處理失敗:`, error);
      alert("操作失敗: " + error.message);
    }
  };
  // 使用統一處理函數
  const loginWithGoogle = () => handleSocialLogin("google");
  const loginWithLine = () => handleSocialLogin("line");

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
    const token = getToken();
    if (!token) return null;
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error("解析 token 失敗:", error);
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
