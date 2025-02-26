"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import jwt from "jsonwebtoken";
const appKey = "loginWithToken";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

export function AuthProvider({ children }) {
  // user 的三個狀態
  // null: 沒有登入
  // -1: 載入中
  // {name: Ben}: 登入
  const [user, setUser] = useState(-1);

  const router = useRouter();
  const pathname = usePathname();
  const protectedRoutes = ["/admin"];
  const loginRoute = "/";

  const login = async (email, password) => {
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
      console.log(result);
      if (result.status != "success") throw new Error(result.message);
      const token = result.data.token;
      const newUser = jwt.decode(token);
      setUser(newUser);
      localStorage.setItem(appKey, token);
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  const logout = async () => {
    let API = "http://localhost:3005/api/admin/logout";
    let token = localStorage.getItem(appKey);
    try {
      if (!token) throw new Error("身分認證訊息不存在, 請重新登入");
      const res = await fetch(API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.status != "success") throw new Error(result.message);
      localStorage.removeItem(appKey); // 登出改為移除 localStorage 中的登入 token
      setUser(null); // 使用者設為 null
    } catch (err) {
      console.log(err);
      alert(err.message);
      localStorage.removeItem(appKey); // 登出失敗改為移除 localStorage 中的登入 token
      setUser(null); // 使用者設為 null
    }
  };

  const register = async (email, password) => {
    let API = "http://localhost:3005/api/admin/register";

    // 確保參數非空
    if (!email || !password) {
      throw new Error("Email 和密碼不能為空");
    }

    console.log("準備註冊:", { email, password });

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      // 使用表單數據發送請求
      const res = await fetch(API, {
        method: "POST",
        body: formData,
      });

      console.log("註冊請求已發送");

      // 檢查是否成功獲取響應
      if (!res.ok) {
        console.log("HTTP錯誤:", res.status, res.statusText);
        throw new Error(`HTTP錯誤: ${res.status}`);
      }

      const result = await res.json();
      console.log("註冊回應:", result);

      if (result.status !== "success") {
        if (res.status === 409) {
          alert("此 Email 已註冊，請使用其他 Email 或直接登入");
          return;
        }
      }

      return result;
    } catch (err) {
      console.error("註冊錯誤:", err);
      alert(err.message || "註冊過程中發生未知錯誤");
      throw err; // 將錯誤向上傳遞，讓調用者知道註冊失敗
    }
  };

  useEffect(() => {
    console.log({ user, pathname });
    if (user == -1) return; // 等待 user 讀取完成
    if (!user && protectedRoutes.includes(pathname)) {
      alert("請先登入");
      router.replace(loginRoute);
    }
  }, [pathname, user]);

  useEffect(() => {
    let token = localStorage.getItem(appKey);
    if (!token) {
      setUser(null); // 確保未登入時使用是 null
      return;
    }
    const fetchData = async () => {
      let API = "http://localhost:3005/api/admin/status";
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (result.status != "success") throw new Error(result.message);
        token = result.data.token;
        localStorage.setItem(appKey, token);
        const newUser = jwt.decode(token);
        setUser(newUser);
      } catch (err) {
        console.log(err);
        localStorage.removeItem(appKey); // 判斷狀態失敗改為移除 localStorage 中的登入 token
        setUser(null); // 設置使用者為 null
      }
    };
    fetchData();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
