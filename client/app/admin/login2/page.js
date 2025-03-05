"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "particles.js";
import "./login.css";
import { AiFillGoogleSquare } from "react-icons/ai"; // Google
import { FaLine } from "react-icons/fa"; // Line
import { FaSquarePhone } from "react-icons/fa6"; // 手機

export default function Login2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 調試訊息：檢查視窗高度
      //   console.log("視窗高度 (window.innerHeight):", window.innerHeight);

      // 初始化 particles.js
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

      // 檢查 #particles-js 容器的高度
      //   const particlesContainer = document.getElementById("particles-js");
      //   if (particlesContainer) {
      //     console.log(
      //       "#particles-js 高度:",
      //       particlesContainer.offsetHeight,
      //       "寬度:",
      //       particlesContainer.offsetWidth
      //     );
      //   }

      // 檢查 .login2-container 的高度
      //   const loginContainer = document.querySelector(".login2-container");
      //   if (loginContainer) {
      //     console.log(
      //       ".login2-container 高度:",
      //       loginContainer.offsetHeight,
      //       "寬度:",
      //       loginContainer.offsetWidth
      //     );
      //   }
    }
  }, []);

  const handleLogin = () => {
    alert(`Login2: Email: ${email}, Password: ${password}`);
    router.push("/admin");
  };

  return (
    <div className="login2-container">
      {/* 背景粒子效果 */}
      <div id="particles-js" className="particles-background"></div>

      {/* 登入框 */}
      <div className="login-box">
        <h3>DiveIn</h3>
        <p>- Dive Into the New Horizon -</p>

        {/* email登入 */}
        <input
          type="email"
          name="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        {/* 密碼 */}
        <input
          type="password"
          name="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密碼"
        />
        <button type="button" className="login-btn" onClick={handleLogin}>
          登入
        </button>

        {/* 分隔線 */}
        <div className="divider">
          <span>或</span>
        </div>

        {/* 第三方登入 */}
        <div className="icon-buttons">
          <button className="icon-btn">
            <AiFillGoogleSquare className="icon" />
          </button>
          <button className="icon-btn">
            <FaLine className="icon" />
          </button>
          <button className="icon-btn">
            <FaSquarePhone className="icon" />
          </button>
        </div>

        {/* 忘記密碼與註冊新帳號 */}
        <div className="additional-options">
          <a href="/forgot-password" className="link">
            忘記密碼
          </a>
          <a href="/register" className="link">
            註冊帳號
          </a>
        </div>
      </div>
    </div>
  );
}
