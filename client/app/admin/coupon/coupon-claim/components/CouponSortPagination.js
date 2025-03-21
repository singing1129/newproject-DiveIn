import React, { useState } from 'react';

const CouponSortPagination = ({ onSortChange, onDisplayChange }) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState({ text: '最新發佈', value: 'latest' });
  const [selectedDisplay, setSelectedDisplay] = useState("全部顯示");

  const handleSortChange = (value, text) => {
    setSelectedSort({ text, value });
    onSortChange(value);
    setShowSortDropdown(false);
  };

  const handleDisplayChange = (text, value) => {
    setSelectedDisplay(text);
    onDisplayChange(value);
    setShowDisplayDropdown(false);
  };

  return (
    <div className="d-flex justify-content-between align-items-center my-4">
      {/* <div className="pagination">顯示 第1頁 / 共6頁</div> */}
      <div className="d-flex justify-content-end gap-4 align-items-center mb-4 mt-3">
        <div className="dropdown">
          <button
            className="btn btn-outline-secondary dropdown-toggle"
            onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
          >
            {selectedDisplay}
          </button>
          <ul className={`dropdown-menu ${showDisplayDropdown ? "show" : ""}`}>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleDisplayChange("全部顯示", "全部顯示")}
              >
                全部顯示
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleDisplayChange("每頁顯示12筆", 12)}
              >
                每頁顯示12筆
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleDisplayChange("每頁顯示24筆", 24)}
              >
                每頁顯示24筆
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleDisplayChange("每頁顯示36筆", 36)}
              >
                每頁顯示36筆
              </button>
            </li>
          </ul>
        </div>

        <div className="dropdown">
          <button
            className="btn btn-outline-secondary dropdown-toggle"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
          >
            <i className="bi bi-sort-down-alt me-2"></i>
            {selectedSort.text}
          </button>
          <ul className={`dropdown-menu ${showSortDropdown ? "show" : ""}`}>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleSortChange('latest', '最新發佈')}
              >
                最新發佈
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleSortChange('expiry', '即將到期')}
              >
                即將到期
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleSortChange('discount', '折扣最高')}
              >
                折扣最高
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleSortChange('min_spent', '最低消費要求')}
              >
                最低消費要求
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default CouponSortPagination;