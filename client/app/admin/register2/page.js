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
  const [passwordStrength, setPasswordStrength] = useState(0); // 假設密碼強度 (0-4)，再改就好
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

  // 密碼強度驗證，再改就好
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

  // 根據密碼強度返回文字，再改就好
  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
        return "weak";
      case 1:
        return "weak";
      case 2:
        return "medium";
      case 3:
        return "strong";
      case 4:
        return "strong";
      default:
        return "";
    }
  };

  // 根據密碼強度返回顏色，想做顏色是黃色到藍色
  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
        return "var(--secondary-deep-color)"; // 黃色
      case 1:
        return "var(--secondary-deep-color)"; // 黃色
      case 2:
        return "linear-gradient(to right, var(--secondary-deep-color), var(--primary-color))"; // 黃到藍漸層
      case 3:
        return "var(--primary-deep-color)"; // 藍色
      case 4:
        return "var(--primary-deep-color)"; // 藍色
      default:
        return "var(--secondary-deep-color)";
    }
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
              background: `linear-gradient(to right, var(--secondary-deep-color), var(--primary-color))`,
            }}
          ></div>
        </div>
        {/* 密碼強度文字 */}
        <div className="password-strength-text">
          {getPasswordStrengthText(passwordStrength)}
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