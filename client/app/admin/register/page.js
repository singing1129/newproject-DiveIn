"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "../Login.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, register } = useAuth() || {};
  const router = useRouter();

  const handleRegister = async () => {
    if (!email.trim()) {
      alert("請輸入使用者email");
      return;
    }
    if (!password.trim()) {
      alert("請輸入密碼");
      return;
    }

    try {
      await register(email, password);
      alert("註冊成功！"); // 註冊成功提示
      router.push("/admin/login"); // 導向登入頁面
    } catch (error) {
      console.error("註冊錯誤:", error);
      // 錯誤訊息已經在 useAuth 的 register 函數中處理
    }
  };

  return (
    <form className={styles.loginPage}>
      <div className={styles.main}>
        <img
          src="/image/DiveIn-logo-dark-final.png"
          alt="logo"
          className={styles.logo}
        />
        <div className={styles.line1}></div>
        <div className={styles.sectionLogin}>
          <h3>註冊</h3>
          <input
            type="email"
            name="email"
            className={styles.wordbox}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            className={styles.wordbox}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="密碼"
          />

          <div className={styles.loginWays}>
            <div className={styles.loginBtn} onClick={handleRegister}>
              <h6>註冊</h6>
            </div>
            <div className={styles.or}>
              <div className={styles.line2}></div>
              <p>或</p>
              <div className={styles.line2}></div>
            </div>
            <div className={styles.loginGoogle}>
              <div className={styles.googleBox}>
                <img src="/img/ic_google.svg" alt="Google logo" />
                <h6>Continue with Google</h6>
              </div>
            </div>
            <div className={styles.loginLine}>
              <div className={styles.lineBox}>
                <img src="/img/line.png" alt="Line logo" />
                <h6>Continue with Line</h6>
              </div>
            </div>
            <div className={styles.fcBox}>
              <Link href="/login" className={styles.ftext}>
                我有帳號！
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
