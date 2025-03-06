"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "particles.js";
import "./register.css";
import { AiFillGoogleSquare } from "react-icons/ai"; // Google
import { FaLine } from "react-icons/fa"; // Line

export default function Register2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0); // 密碼強度 (0-4)
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    }
  }, []);

  // 密碼強度驗證
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  // 根據密碼強度返回漸層顏色
  const getPasswordStrengthColor = (strength) => {
    if (strength === 0) {
      return 'rgba(255, 255, 255, 0.2)';
    }
    const opacity = 0.3 + (strength / 4) * 0.7; // 從 0.3 到 1
    return `linear-gradient(to right, 
      rgba(33, 158, 188, ${opacity * 0.5}), 
      rgba(33, 158, 188, ${opacity}))`;
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert("密碼與確認密碼不一致");
      return;
    }
    alert(`Register2: Email: ${email}, Password: ${password}`);
    router.push("/admin");
  };

  return (
    <div className="login2-container">
      {/* 背景粒子效果 */}
      <div id="particles-js" className="particles-background"></div>

      {/* 註冊框 */}
      <div className="login-box">
        <h3>DiveIn</h3>
        <p>- Dive Into the New Horizon -</p>

        {/* email 輸入 */}
        <input
          type="email"
          name="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        {/* 密碼輸入 */}
        <input
          type="password"
          name="password"
          className="input-field"
          value={password}
          onChange={handlePasswordChange}
          placeholder="請輸入密碼"
        />
        {/* 密碼強度條 */}
        <div className="password-strength-bar">
          <div
            className="strength-indicator"
            style={{
              width: `${(passwordStrength / 4) * 100}%`,
              background: getPasswordStrengthColor(passwordStrength),
            }}
          ></div>
        </div>
        {/* 確認密碼輸入 */}
        <input
          type="password"
          name="confirmPassword"
          className="input-field"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="確認密碼"
        />
        <button type="button" className="login-btn" onClick={handleRegister}>
          註冊
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
        </div>

        {/* 我有帳號 */}
        <div className="additional-options">
          <a href="/login" className="link">
            我有帳號
          </a>
        </div>
      </div>
    </div>
  );
}