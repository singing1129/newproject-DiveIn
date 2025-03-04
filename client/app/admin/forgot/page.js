"use client";
import { useState } from "react";
import styles from "../Login.module.css";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 修正 API 路徑，確保與後端匹配
      const response = await fetch(
        "http://localhost:3005/api/passwordReset/request-reset",
        {
          method: "POST",
          body: JSON.stringify({ email }), // 發送使用者的 email
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setSuccessMessage(
          `重設密碼郵件已發送到 ${email}，請查收郵件並按照指示操作`
        );
        // 不要立即跳轉，顯示成功訊息讓用戶知道需要檢查郵件
      } else {
        setError(data.message || "請求失敗，請稍後再試"); // 顯示錯誤訊息
      }
    } catch (err) {
      setError("無法處理請求，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.loginPage} onSubmit={handleSubmit}>
      <div
        className={styles.main}
        style={{ flexDirection: "column", gap: "20px" }}
      >
        <h3>忘記密碼</h3>

        {successMessage ? (
          <>
            <p style={{ color: "green" }}>{successMessage}</p>
            <p>請檢查您的郵箱獲取驗證碼</p>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => router.push("/admin/login")}
            >
              <h6>返回登入頁</h6>
            </button>
          </>
        ) : (
          <>
            <p>請輸入您的註冊郵箱，我們將發送重設密碼郵件給您</p>
            <input
              type="email"
              className={styles.wordbox}
              placeholder="輸入你的 Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isSubmitting}
            >
              <h6>{isSubmitting ? "處理中..." : "發送重設密碼郵件"}</h6>
            </button>
          </>
        )}
      </div>
    </form>
  );
}
