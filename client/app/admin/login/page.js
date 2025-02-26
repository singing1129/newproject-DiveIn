"use client";
import styles from "../Login.module.css";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 用來跳轉頁面

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault(); // 防止表單提交刷新頁面
    try {
      await login(email, password);
      console.log("登入成功", user);
      router.push("/"); // 登入成功後跳轉到會員中心
    } catch (err) {
      console.error("登入失敗", err);
    }
  };

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
          <h3>登入</h3>
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
          <div className={styles.loginWays}>
            <button type="submit" className={styles.loginBtn}>
              <h6>登入</h6>
            </button>
            <div className={styles.or}>
              <div className={styles.line2}></div>
              <p>或</p>
              <div className={styles.line2}></div>
            </div>
            <button className={styles.loginGoogle}>
              <div className={styles.googleBox}>
                <img src="/img/ic_google.svg" alt="Google logo" />
                <h6>Continue with Google</h6>
              </div>
            </button>
            <button className={styles.loginLine}>
              <div className={styles.lineBox}>
                <img src="/img/line.png" alt="Line logo" />
                <h6>Continue with Line</h6>
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
          </div>
        </div>
      </div>
    </form>
  );
}
