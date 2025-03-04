"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "@/hooks/cartContext";
import { useAuth } from "@/hooks/useAuth";
const ActivitySpecModal = ({ item, onClose, onUpdate }) => {
  const { updateQuantity } = useCart();
  const { user } = useAuth();
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  //   console.log("projectDetails", projectDetails);
  // 獲取活動專案詳情
  console.log(item.activity_id);
  console.log(item.project_id);
  //   console.log("user", user);
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3005/api/activity/${item.activity_id}`
        );
        console.log(response.data.project);

        response.data.project.forEach((project) => {
          if (project.id === item.project_id) {
            setProjectDetails(project);
            console.log("project", project);
          }
        });
      } catch (error) {
        console.error("獲取活動詳情失敗:", error);
        setError("獲取活動詳情失敗，請稍後再試");
      }
    };

    if (item.project_id) {
      fetchProjectDetails();
    }
  }, [item.project_id]);

  // 處理提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證日期
    if (!date || !time) {
      setError("請選擇日期和時間");
      return;
    }

    // 驗證日期範圍
    if (projectDetails) {
      const selectedDate = new Date(date);
      const earliestDate = new Date(projectDetails.earliestDate);
      const projectDate = new Date(projectDetails.date);

      if (selectedDate < earliestDate || selectedDate > projectDate) {
        setError(
          `活動「${projectDetails.name}」只能在 ${projectDetails.earliestDate} 到 ${projectDetails.date} 之間預訂`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 呼叫 API 更新購物車
      const response = await axios.put(
        `http://localhost:3005/api/cart/update`,
        {
          userId: user.id, // 替換為實際的用戶 ID
          type: "activity",
          itemId: item.id,
          quantity: item.quantity, // 固定傳遞購物車中的當前數量
          date,
          time,
        }
      );

      if (response.data.success) {
        // 手動傳遞更新後的資料給父組件
        onUpdate({
          id: item.id,
          date,
          time,
          quantity: item.quantity,
        });

        // 關閉 Modal
        onClose();
      } else {
        throw new Error(response.data.message || "更新失敗");
      }
    } catch (error) {
      console.error("更新活動訂單資訊失敗:", error);
      setError(error.response?.data?.message || "更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 處理關閉 modal
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 100);
  };

  // 時間選項格式化
  const formatTimeOption = (timeStr) => {
    if (!timeStr) return "";
    // 假設時間格式為 "HH:MM:SS" 或 "HH:MM"
    return timeStr.substring(0, 5); // 只取前5個字符，即 "HH:MM"
  };

  // 解析可用時間選項
  const getAvailableTimes = () => {
    if (!projectDetails || !projectDetails.time) return [];
    const times = projectDetails.time.split(",");
    console.log("times", times);
    return times;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-custom">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between">
            <h5 className="modal-title">修改活動資訊</h5>
            <button
              type="button"
              className="btn close-btn"
              onClick={handleClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* 活動名稱顯示 */}
              <div className="activity-name">
                <h6>{item.activity_name}</h6>
                <p className="project-name">{item.project_name}</p>
              </div>

              {/* 日期選擇 */}
              <div className="form-group">
                <label className="date-title">活動日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={projectDetails?.earliestDate || ""}
                  max={projectDetails?.date || ""}
                  required
                />
              </div>

              {/* 時間選擇 */}
              <div className="form-group">
                <label className="time-title">活動時間</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                >
                  <option value="">請選擇時間</option>
                  {getAvailableTimes().map((timeOption, index) => (
                    <option key={index} value={timeOption}>
                      {formatTimeOption(timeOption)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 錯誤訊息 */}
              {error && <p className="error-message">{error}</p>}
            </div>

            {/* 按鈕區 */}
            <div className="modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="confirm-button"
                disabled={loading}
              >
                {loading ? "更新中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivitySpecModal;
