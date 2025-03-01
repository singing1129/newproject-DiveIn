import React, { useState } from "react";
import axios from "axios";
import "./RentalSpecModal.css";

const RentalSpecModal = ({ item, onClose, onUpdate }) => {
  const [startDate, setStartDate] = useState(item.start_date);
  const [endDate, setEndDate] = useState(item.end_date);
  const [color, setColor] = useState(item.color);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // 處理日期區間驗證
  const validateDates = () => {
    if (new Date(endDate) < new Date(startDate)) {
      setError("結束日期不能早於起始日期");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證日期區間
    if (!validateDates()) return;

    try {
      const response = await axios.put(
        `http://localhost:3005/api/cart/update`,
        {
          userId: 1,
          type: "rentals",
          itemId: item.id,
          startDate,
          endDate,
          color: colorRGBs,
        }
      );

      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error("更新租借訂單資訊失敗:", error);
      alert("更新失敗，請稍後再試");
    }
  };

  // 處理關閉modal
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 50);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-custom">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between">
            <h5 className="modal-title">修改租借資訊</h5>
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
              {/* 起始日期 */}
              <div className="form-group">
                <label className="color-title">起始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              {/* 結束日期 */}
              <div className="form-group">
                <label className="color-title">結束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              {/* 錯誤訊息 */}
              {error && <p className="error-message">{error}</p>}

              {/* 顏色選擇 */}
              <div className="form-group">
                <label className="color-title">顏色</label>
                <div className="product-color">
                  <div className="colors">
                    {/* 檢查是否有顏色資料 */}
                    {item.colors && item.colors.length > 0 ? (
                      item.colors.map((colorOption, index) => {
                        const colorRGB = item.colorRGBs[index]; // 獲取對應的 colorRGB
                        return (
                          <div
                            key={colorOption}
                            className={`color-box ${
                              color === colorOption ? "selected" : ""
                            }`}
                            onClick={() => setColor(colorOption)}
                            style={{ backgroundColor: colorRGB }} // 使用 colorRGB
                            title={colorOption}
                          ></div>
                        );
                      })
                    ) : (
                      <p>暫無可選顏色</p> // 如果沒有顏色資料，顯示提示訊息
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 按鈕區 */}
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="confirm-button">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RentalSpecModal;
