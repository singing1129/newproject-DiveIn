"use client";
import styles from "../Login.module.css";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 用來跳轉頁面
import { setupRecaptcha } from "../../../config/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //

  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [otp, setOtp] = useState("");

  const formatPhoneNumber = (number) => {
    // 如果用戶輸入的是台灣號碼，幫他補 `+886`
    if (number.startsWith("0") && number.length === 10) {
      return "+886" + number.slice(1); // 移除 `0`，加上 `+886`
    }
    return number;
  };

  const sendOTP = async () => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log("📞 發送 OTP 給:", formattedPhone);
  
      if (!formattedPhone.startsWith("+")) {
        alert("請輸入完整的國際格式，例如：+886912345678");
        return;
      }
  
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
  
      window.recaptchaVerifier = setupRecaptcha("recaptcha-container");
      const appVerifier = window.recaptchaVerifier;
  
      const confirmationFunc = await loginWithPhone(formattedPhone, appVerifier);
      console.log("📩 取得的 `confirmationFunc`:", confirmationFunc);
  
      if (confirmationFunc) {
        console.log("✅ OTP 發送成功，等待用戶輸入驗證碼");
        setConfirmation(() => confirmationFunc);
      } else {
        console.error("❌ OTP 發送失敗");
        alert("OTP 發送失敗，請稍後再試");
      }
    } catch (error) {
      console.error("❌ 發送 OTP 失敗:", error);
      alert("發送 OTP 失敗，請稍後再試");
    }
  };
  
  

  // In page.js - Update the verifyOTP function

  const verifyOTP = async () => {
    try {
      if (!confirmation) {
        console.error("❌ `confirmation` 為 null，請檢查 `sendOTP` 是否有正確執行");
        alert("請先發送驗證碼！");
        return;
      }
  
      console.log("✅ 確認 `confirmation` 變數存在:", confirmation);
      console.log("📤 使用 OTP 進行驗證:", otp);
  
      const result = await confirmation(otp);
      console.log("🔍 OTP 驗證結果:", result);
  
      if (!result || !result.success) {
        throw new Error(result?.error?.message || "驗證失敗");
      }
  
      console.log("✅ 驗證成功，取得使用者:", result.user);
      
      // 登入成功提示
      alert("登入成功！");
      
      // 讓 useAuth 中的路由保護機制處理跳轉，與其他登入方式一致
      // 這裡不需要手動跳轉，因為 useEffect 會監控 user 狀態變化
    } catch (error) {
      console.error("❌ 驗證碼錯誤", error);
      alert("驗證碼錯誤，請重新輸入");
    }
  };
  
  

  // 原本的登入
  const {
    user,
    loginWithEmail,
    loginWithGoogle,
    loginWithLine,
    loginWithPhone,
  } = useAuth();
  const router = useRouter();

 // 修复后的登录处理函数
const handleLogin = async (e) => {
  e.preventDefault(); // 防止表單提交刷新頁面
  try {
    const result = await loginWithEmail(email, password);

    if (result && result.status === "success") {
      // 只有當登入成功時才跳轉
      console.log("登入成功", result.user);
      // 此处不需要手动跳转，useAuth 中的路由保护会自动处理
      // router.push("/");
    }
  } catch (err) {
    console.error("登入失敗", err);
  }
};
  useEffect(() => {
    if (!document.getElementById("recaptcha-container")) {
      console.error("🚨 reCAPTCHA 容器不存在！");
    }
  }, []);

  return (
    <form className={styles.loginPage} onSubmit={handleLogin}>
      <div className={styles.main}>
        <img
          src="/image/DiveIn-logo-dark-final.png"
          alt="logo"
          className={styles.logo}
        />
        <div className={styles.line1}></div>
        <div className={styles.sectionLogin}>
          {!showPhoneLogin && <h3>登入</h3>}

          {/* 如果是手機登入模式，顯示手機登入 UI，隱藏其他 UI */}
          {showPhoneLogin ? (
            <>
              <h3>手機登入</h3>
              {!confirmation ? (
                <>
                  <input
                    type="tel"
                    name="phone"
                    className={styles.wordbox}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="輸入手機號碼"
                  />
                  <button
                    type="button"
                    className={styles.loginBtn}
                    onClick={sendOTP}
                  >
                    發送驗證碼
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    name="otp"
                    className={styles.wordbox}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="輸入驗證碼"
                  />
                  <button
                    type="button"
                    className={styles.loginBtn}
                    onClick={verifyOTP}
                  >
                    確認驗證碼
                  </button>
                </>
              )}

              {/* 返回按鈕 */}
              <button
                type="button"
                className={styles.loginBtn}
                onClick={() => setShowPhoneLogin(false)}
              >
                返回
              </button>
            </>
          ) : (
            <>
              {/* 這是原本的登入 UI，只在 `showPhoneLogin === false` 時顯示 */}
              <input
                type="email"
                name="email"
                className={styles.wordbox}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <input
                type="password"
                name="password"
                className={styles.wordbox}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密碼"
                required
              />
              <button type="submit" className={styles.loginBtn}>
                <h6>登入</h6>
              </button>

              <div className={styles.or}>
                <div className={styles.line2}></div>
                <p>或</p>
                <div className={styles.line2}></div>
              </div>

              <button className={styles.loginGoogle} onClick={loginWithGoogle}>
                <div className={styles.googleBox}>
                  <img src="/img/ic_google.svg" alt="Google logo" />
                  <h6>使用 Google 登入</h6>
                </div>
              </button>

              <button className={styles.loginLine} onClick={loginWithLine}>
                <div className={styles.lineBox}>
                  <img src="/img/line.png" alt="Line logo" />
                  <h6>使用 Line 登入</h6>
                </div>
              </button>

              {/* 按下按鈕時切換到手機登入模式 */}
              <button
                className={styles.loginLine}
                onClick={() => setShowPhoneLogin(true)}
              >
                <div className={styles.lineBox}>
                  <img src="/img/phone.svg" alt="Phone logo" />
                  <h6>使用手機登入</h6>
                </div>
              </button>

              <div className={styles.fcBox}>
                <Link href="/admin/forgot" className={styles.ftext}>
                  忘記密碼？
                </Link>
                <Link href="/admin/register" className={styles.ctext}>
                  註冊新帳號！
                </Link>
              </div>
            </>
          )}
        </div>
        {/* 這裡是 reCAPTCHA 容器 */}
        <div id="recaptcha-container"></div>
      </div>
    </form>
  );
}
