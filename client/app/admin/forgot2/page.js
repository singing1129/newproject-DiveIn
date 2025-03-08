"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "particles.js"; // 引入 particles.js
import "./forgot.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  // 初始化粒子特效
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.particlesJS("particles-js", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: true },
          size: { value: 5, random: true },
          line_linked: { enable: false },
          move: {
            enable: true,
            speed: 1,
            direction: "top",
            random: true,
            straight: false,
            out_mode: "out",
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { particles_nb: 4 },
          },
        },
        retina_detect: true,
      });
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`已發送重置密碼連結至: ${email}`);
    router.push("/admin");
  };

  return (
    <div className="login2-container">
      {/* 背景粒子效果 */}
      <div id="particles-js" className="particles-background"></div>

      {/* 忘記密碼框 */}
      <div className="login-box">
        <h3>忘記密碼</h3>
        <p>請輸入您的註冊郵箱，我們將發送重設密碼郵件給您</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="輸入您的Email"
            required
          />
          <button type="submit" className="login-btn">
            發送重設密碼連結
          </button>
        </form>

        <div className="divider">
          <span>或</span>
        </div>
        
        <div className="additional-options">
          <a href="/admin/login2" className="link">
            返回登入
          </a>
        </div>
      </div>
    </div>
  );
}