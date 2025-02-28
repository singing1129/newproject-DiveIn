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

  // 2. 整合 token 驗證和用戶狀態設置
  useEffect(() => {
    // 初始化
    debugAuthState();
    const checkTokenAndSetUser = () => {
      const token = localStorage.getItem(appKey);

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
          id: decoded.id || decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.displayName,
          providers: decoded.providers || ["unknown"],
        };

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

    // 設置定時檢查
    const intervalId = setInterval(checkTokenAndSetUser, 3000);

    return () => clearInterval(intervalId);
  }, []);

  // NextAuth
  useEffect(() => {
    const handleSessionChange = async () => {
      const session = await getSession();
      console.log("會話檢查:", session);

      // 如果有活躍的會話但沒有本地 token，則嘗試社交登入流程
      if (session?.user && !localStorage.getItem(appKey)) {
        console.log("檢測到社交登入會話，但沒有本地 token");

        try {
          // 1. 明確確定當前登錄的提供者類型
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

          // 2. 獲取提供者特定ID
          let providerId =
            session.provider_id || session.user.id || session.user.sub;

          // 3. 準備API請求數據
          const userData = {
            // 用戶基本信息
            email: session.user.email || null,
            name: session.user.name || null,
            image: session.user.image || null,

            // 提供者資訊
            provider: currentProvider,
            provider_id: providerId,
          };

          console.log("發送到後端的社交登錄資料:", userData);

          // 4. 向後端 API 發送使用者數據
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
            const token = result.data.token;
            localStorage.setItem(appKey, token);
            const newUser = jwt.decode(token);
            setUser(newUser);
          } else {
            console.error("登入處理失敗:", result.message);
          }
        } catch (error) {
          console.error("處理社交登入失敗:", error);
        }
      }
    };

    // 立即執行一次
    handleSessionChange();

    // 設置一個間隔定時器，定期檢查會話變化
    const intervalId = setInterval(handleSessionChange, 3000);

    // 清理函數
    return () => clearInterval(intervalId);
  }, []);

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
    } else if (session === null && user !== -1) {
      // 只有當不是初始載入狀態時才設置為 null
      setUser(null);
    }
  }, [session]);

  // 3. 修改 loginWithPhone 函數，使其與其他登入方式保持一致
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
            // 準備發送到後端的數據
            const userData = {
              provider: "phone",
              provider_id: firebaseUser.phoneNumber,
              name: firebaseUser.displayName || "手機用戶",
            };

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
              // 保存 token 並更新用戶狀態
              const token = apiResult.data.token;
              localStorage.setItem(appKey, token);
              const newUser = jwt.decode(token);
              setUser(newUser);
              return { success: true, user: newUser };
            } else {
              throw new Error("API 返回失敗狀態");
            }
          } catch (apiError) {
            console.error("API 調用失敗:", apiError);

            // 創建臨時用戶（作為後備方案）
            const tempUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "手機用戶",
              phoneNumber: firebaseUser.phoneNumber,
              providers: ["phone"],
              // 添加過期時間以便檢查
              exp: Math.floor(Date.now() / 1000) + 1800, // 30分鐘
            };

            // 將臨時用戶信息序列化為字符串
            const tempToken = JSON.stringify(tempUser);
            localStorage.setItem(appKey, tempToken);
            setUser(tempUser);

            return { success: true, user: tempUser };
          }
        } catch (error) {
          console.error("❌ OTP 驗證失敗:", error);
          return { success: false, error };
        }
      };
    } catch (error) {
      console.error("❌ 手機登入錯誤:", error);
      alert("手機登入初始化失敗: " + error.message);
      return null;
    }
  };

  //  社交登入
  const handleSocialLogin = async (provider) => {
    try {
      console.log(`嘗試 ${provider} 登入`);
      await signIn(provider);

      // 等待會話建立
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const session = await getSession();
      console.log(`登入會話:`, session);

      if (!session?.user) {
        console.error("無法取得用戶資訊");
        return;
      }

      // 準備發送到後端的資料，明確設置 provider 值
      const userData = {
        email: session.user.email,
        name: session.user.name || `${provider}用戶`,
        image: session.user.image || null,
        // 這裡明確設置 provider 值
        provider: provider, // 這將是 'google' 或 'line'
        provider_id:
          session.user.id || session.user.sub || Date.now().toString(),
      };

      // 處理 Line 可能不提供 email 的情況
      if (!userData.email && provider === "line") {
        userData.email = `${userData.provider_id}@line.temporary.email`;
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
        const token = result.data.token;
        localStorage.setItem(appKey, token);
        setUser(jwt.decode(token));
      } else {
        console.error(`登入處理失敗:`, result.message);
      }
    } catch (error) {
      console.error(`登入處理失敗:`, error);
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

  // 4. 修改路由保護邏輯，確保用戶狀態正確時才執行路由檢查
 // 在 AuthProvider 组件中
// 明确定义可公开访问的管理路径
// const publicAdminPaths = [
//   "/admin/login", 
//   "/admin/register", 
//   "/admin/forgot", 
//   "/admin/reset"
// ];

// // 在 useEffect 中
// useEffect(() => {
//   // 等待用户状态初始化完成
//   if (user === -1) return;

//   // 未登入用户访问受保护页面（排除公共路径）
//   if (
//     !user && 
//     protectedRoutes.some(route => pathname.startsWith(route)) && 
//     !publicAdminPaths.includes(pathname)
//   ) {
//     // 未登录用户试图访问需要登录的页面，重定向到登录页
//     router.replace("/admin/login");
//   }
//   // 已登入用户访问登入/注册页面
//   else if (user && publicAdminPaths.includes(pathname)) {
//     // 已登录用户试图访问登录/注册页面，重定向到首页
//     console.log("已登入，禁止进入登入页，跳转到首页");
//     router.replace("/");
//   }
// }, [user, pathname, router]);

  //   登出 (手動帳號 & Google)
  // 5. 修改 logout 函數，確保完全清除所有登入狀態
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
