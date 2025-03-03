"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import styles from "./AccountForm.module.css";

export default function AccountForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    avatar: "",
    level: 100, // 會員等級
  });

  // 從後端獲取會員資料
  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const response = await fetch("/api/member"); // 假設後端 API 是 /api/member
        const data = await response.json();
        setFormData(data); // 將後端資料設置到表單狀態
      } catch (error) {
        console.error("獲取會員資料失敗：", error);
      }
    };

    fetchMemberData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/member", {
        method: "PUT", // 使用 PUT 方法更新資料
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("資料更新成功！");
      } else {
        alert("資料更新失敗！");
      }
    } catch (error) {
      console.error("提交表單失敗：", error);
    }
  };

  const handleCancel = () => {
    // 重置表單為初始狀態
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      avatar: "",
      level: 100, // 會員等級
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* 大頭貼區塊 */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            <Image
              src={formData.avatar || "/image/default-memberimg.png"}
              alt="會員頭像"
              width={250}
              height={250}
              className={styles.avatarImage}
            />
          </div>
          <div className={styles.memberLevel}>Lv.{formData.level}</div>
          <label htmlFor="avatar" className={styles.avatarUploadBtn}>
            變更圖片
            <input
              type="file"
              id="avatar"
              name="avatar"
              onChange={handleAvatarChange}
              className={styles.avatarInput}
            />
          </label>
        </div>

        {/* 個人資訊區塊 */}
        <form className={styles.accountForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">電子郵件</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone">電話號碼</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </form>
      </div>

      {/* 按鈕區塊 */}
      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.saveBtn}>
          儲存
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
}