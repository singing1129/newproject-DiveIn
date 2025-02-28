// Fixed ResetPassword.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../Login.module.css";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret"); // 從 URL 中獲取 secret 參數

  const [step, setStep] = useState("otp"); // 新增步驟狀態："otp" 或 "password"
  const [otp, setOtp] = useState(""); // 儲存用戶輸入的 OTP
  const [newPassword, setNewPassword] = useState(""); // 新密碼
  const [confirmPassword, setConfirmPassword] = useState(""); // 確認密碼
  const [error, setError] = useState(""); // 錯誤訊息
  const [successMessage, setSuccessMessage] = useState(""); // 成功訊息

  // 倒計時相關狀態
  const [countdown, setCountdown] = useState(300); // 5分鐘 = 300秒
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // 儲存用戶Email以便重發

  // 用於清理定時器的 ref
  const timerRef = useRef(null);
  const resendBtnRef = useRef(null); // 新增按鈕引用
  const verifyBtnRef = useRef(null); // 新增驗證按鈕引用

  // 確保 secret 存在並獲取用戶郵箱
  useEffect(() => {
    if (!secret) {
      setError("無效的重設密碼連結"); // 如果 secret 不存在，顯示錯誤
      return;
    }

    // 重要：新增此檢查
    // 檢查 secret 是否為日期時間格式
    if (secret.includes("GMT") || secret.includes("標準時間")) {
      setError("無效的重設密碼連結，請重新申請密碼重設");
      console.error("檢測到 secret 是日期時間格式:", secret);
      return;
    }

    console.log("使用的 secret:", secret);

    // 獲取 secret 對應的用戶郵箱
    const fetchUserEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:3005/api/passwordReset/get-email?secret=${secret}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();
        if (data.status === "success" && data.email) {
          setUserEmail(data.email);
        } else {
          setError("無法獲取用戶資訊，請重新申請密碼重設");
        }
      } catch (err) {
        console.error("獲取用戶郵箱失敗:", err);
        setError("獲取用戶信息失敗，請檢查網絡連接");
      }
    };

    fetchUserEmail();
  }, [secret]);

  // 處理倒計時
  useEffect(() => {
    // 只在 OTP 步驟啟動倒計時
    if (step === "otp" && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // 當倒計時結束時，自動重發驗證碼
    if (countdown === 0 && userEmail && !isResending) {
      handleResendOtp(); // 自動重發驗證碼
    }

    // 組件卸載時清理定時器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step, countdown, userEmail, isResending]);

  // 處理重發驗證碼
  const handleResendOtp = async () => {
    if (isResending || !userEmail) return;

    setIsResending(true);
    setError("");

    // 按鈕按下效果
    if (resendBtnRef.current) {
      resendBtnRef.current.classList.add(styles.buttonPressed);
      setTimeout(() => {
        if (resendBtnRef.current) {
          resendBtnRef.current.classList.remove(styles.buttonPressed);
        }
      }, 150);
    }

    try {
      const response = await fetch(
        "http://localhost:3005/api/passwordReset/resend-otp",
        {
          method: "POST",
          body: JSON.stringify({ secret, email: userEmail }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setSuccessMessage("新的驗證碼已發送到您的郵箱");
        // 重置倒計時
        setCountdown(300);
      } else {
        setError(data.message || "重發驗證碼失敗");
      }
    } catch (err) {
      console.error("重發OTP錯誤:", err);
      setError("無法處理請求，請檢查網絡連接");
    } finally {
      setIsResending(false);
    }
  };

  // 處理驗證碼提交
  const handleSubmitOtp = async (e) => {
    e.preventDefault(); // 確保阻止表單默認提交行為

    if (!otp) {
      setError("請輸入驗證碼");
      return;
    }

    // 按鈕按下效果
    if (verifyBtnRef.current) {
      verifyBtnRef.current.classList.add(styles.buttonPressed);
      setTimeout(() => {
        if (verifyBtnRef.current) {
          verifyBtnRef.current.classList.remove(styles.buttonPressed);
        }
      }, 150);
    }

    // 清除舊的錯誤信息並顯示提交中狀態
    setError("");
    setSuccessMessage("");
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      console.log("提交OTP驗證，參數:", { otp, secret });

      const response = await fetch(
        "http://localhost:3005/api/passwordReset/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({
            otp: otp.trim(), // 去除可能的空格
            secret,
          }),
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 確保跨域請求包含 cookies
        }
      );

      const data = await response.json();
      console.log("OTP驗證回應:", data);

      if (data.status === "success") {
        setSuccessMessage("驗證碼驗證成功！請設置新密碼");
        setError(""); // 清除錯誤訊息
        setStep("password"); // 切換到密碼設置步驟

        // 停止倒計時
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        // 顯示具體錯誤信息
        setError(data.message || "驗證碼驗證失敗");
      }
    } catch (err) {
      console.error("OTP驗證請求錯誤:", err);
      setError("網絡錯誤，無法連接到伺服器");
    } finally {
      // 恢復按鈕狀態
      if (submitButton) submitButton.disabled = false;
    }
  };

  const handleSubmitNewPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("密碼不一致，請重新輸入");
      return;
    }

    if (newPassword.length < 6) {
      setError("密碼長度必須至少為6個字符");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3005/api/passwordReset/reset",
        {
          method: "POST",
          body: JSON.stringify({ newPassword, secret }), // 發送 newPassword 和 secret
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setSuccessMessage("密碼已成功重設！即將跳轉到登入頁面...");
        // 顯示成功訊息後延遲跳轉
        setTimeout(() => {
          router.push("/admin/login"); // 密碼重設成功，跳轉到登入頁
        }, 2000);
      } else {
        setError(data.message || "重設密碼失敗"); // 顯示錯誤訊息
      }
    } catch (err) {
      setError("無法處理請求，請稍後再試");
    }
  };

  // 格式化剩餘時間
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 渲染不同步驟的表單
  const renderForm = () => {
    if (step === "otp") {
      return (
        <form onSubmit={handleSubmitOtp}>
          <h3>驗證您的身份</h3>
          <p>請輸入發送到您郵箱的驗證碼</p>

          <input
            type="text"
            className={styles.wordbox}
            placeholder="輸入驗證碼"
            value={otp}
            onChange={(e) => {
              // 只接受字母和數字，自動去除空格
              const sanitizedInput = e.target.value
                .trim()
                .replace(/[^a-zA-Z0-9]/g, "");
              setOtp(sanitizedInput);
            }}
            required
            style={{
              borderColor:
                countdown < 60 ? "red" : countdown < 120 ? "orange" : "",
              borderWidth: countdown < 60 ? "2px" : "",
              transition: "border 0.3s ease",
            }}
            autoComplete="off" // 防止瀏覽器自動填充
          />

          {/* 顯示倒計時 */}
          <div style={{ marginTop: "10px" }}>
            <p>
              驗證碼有效時間:{" "}
              <span
                style={{
                  color:
                    countdown < 60
                      ? "red"
                      : countdown < 120
                      ? "orange"
                      : "inherit",
                  fontWeight: "bold",
                }}
              >
                {formatTimeLeft(countdown)}
              </span>
            </p>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

          {/* 驗證碼按鈕 */}
          <button
            type="submit"
            className={styles.loginBtn}
            disabled={countdown === 0}
            ref={verifyBtnRef}
          >
            <h6>驗證驗證碼</h6>
          </button>

          {/* 重發驗證碼提示文字 */}
          <p
            style={{
              fontSize: "0.8rem",
              marginTop: "15px",
              color:
                countdown === 0 ? "red" : countdown > 270 ? "#666" : "green",
            }}
          >
            {countdown === 0
              ? "驗證碼已過期，請重新發送"
              : countdown > 270
              ? `${formatTimeLeft(countdown - 270)} 後可重新發送`
              : "現在可以重新發送驗證碼"}
          </p>

          {/* 重發驗證碼按鈕 - 確保無論倒計時如何都顯示 */}
          <button
            type="button"
            className={styles.loginBtn}
            onClick={handleResendOtp}
            disabled={isResending || countdown > 270}
            ref={resendBtnRef}
            style={{
              opacity: isResending || countdown > 270 ? 0.7 : 1,
              backgroundColor:
                isResending || countdown > 270 ? "#cccccc" : "#4a90e2",
              marginTop: "5px",
              width: "100%", // 確保按鈕寬度明顯
              display: "block", // 確保按鈕始終顯示
            }}
          >
            <h6>{isResending ? "發送中..." : "重發驗證碼"}</h6>
          </button>
        </form>
      );
    } else {
      return (
        <form onSubmit={handleSubmitNewPassword}>
          <h3>設置新密碼</h3>

          <input
            type="password"
            className={styles.wordbox}
            placeholder="新密碼"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            className={styles.wordbox}
            placeholder="確認新密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

          <button type="submit" className={styles.loginBtn}>
            <h6>重設密碼</h6>
          </button>
        </form>
      );
    }
  };

  return (
    <div className={styles.loginPage}>
      <div
        className={styles.main}
        style={{ flexDirection: "column", gap: "20px" }}
      >
        {renderForm()}
      </div>
    </div>
  );
}
