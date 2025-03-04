"use client";
import { useAuth } from "@/hooks/useAuth";
import styles from "../Login.module.css";
import { useState } from "react";
import { Stack, Input, LinearProgress, Typography } from "@mui/joy";
import "@mui/joy/styles";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  // 辨別權證
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const minLength = 12;

  // 注册处理函数
  const handleRegister = async () => {
    if (!email.trim()) {
      alert("請輸入使用者 email");
      return;
    }
    if (!password.trim()) {
      alert("請輸入密碼");
      return;
    }
    if (password !== confirmPassword) {
      alert("密碼不相符");
      return;
    }

    try {
      const result = await register(email, password);
      if (result && result.status === "success") {
        alert("註冊成功！");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("註冊錯誤:", error);
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <Stack
            spacing={2}
            sx={{ "--hue": Math.min(password.length * 10, 120) }}
          >
            <Input
              className={styles.wordbox}
              type="password"
              placeholder="請輸入密碼"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className={styles.LinearProgress}>
              <LinearProgress
                style={{ width: "100%" }}
                determinate
                size="sm"
                value={Math.min((password.length * 100) / minLength, 100)}
                sx={{
                  bgcolor: "background.level3",
                  color: "hsl(var(--hue) 80% 40%)",
                }}
              />
            </div>
            <Typography
              level="body-xs"
              sx={{ alignSelf: "flex-end", color: "hsl(var(--hue) 80% 30%)" }}
            >
              {password.length < 3 && "Very weak"}
              {password.length >= 3 && password.length < 6 && "Weak"}
              {password.length >= 6 && password.length < 10 && "Strong"}
              {password.length >= 10 && "Very strong"}
            </Typography>
          </Stack>

          {/* 確認密碼欄位（MUI Joy UI） */}
          <Input
            className={styles.wordbox}
            sx={{ width: "100%" }}
            type="password"
            placeholder="確認密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              <Link href="/admin/login" className={styles.ftext}>
                我有帳號！
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
