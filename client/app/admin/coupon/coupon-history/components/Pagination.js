"use client";
import React from "react";
import "./styles/Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePageClick = (page, e) => {
    e.preventDefault();
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbers = 5; // 最大顯示頁碼數量
    const halfMaxPageNumbers = Math.floor(maxPageNumbers / 2);

    let startPage = Math.max(currentPage - halfMaxPageNumbers, 1);
    let endPage = Math.min(currentPage + halfMaxPageNumbers, totalPages);

    if (currentPage - halfMaxPageNumbers < 1) {
      endPage = Math.min(endPage + (halfMaxPageNumbers - currentPage + 1), totalPages);
    } else if (currentPage + halfMaxPageNumbers > totalPages) {
      startPage = Math.max(startPage - (currentPage + halfMaxPageNumbers - totalPages), 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${i === currentPage ? "active" : ""}`}>
          <a className="page-link" href="#" onClick={(e) => handlePageClick(i, e)}>
            {i}
          </a>
        </li>
      );
    }

    if (startPage > 1) {
      pageNumbers.unshift(
        <li key="start-ellipsis" className="page-item disabled">
          <span className="page-link">…</span>
        </li>
      );
      pageNumbers.unshift(
        <li key={1} className="page-item">
          <a className="page-link" href="#" onClick={(e) => handlePageClick(1, e)}>
            1
          </a>
        </li>
      );
    }

    if (endPage < totalPages) {
      pageNumbers.push(
        <li key="end-ellipsis" className="page-item disabled">
          <span className="page-link">…</span>
        </li>
      );
      pageNumbers.push(
        <li key={totalPages} className="page-item">
          <a className="page-link" href="#" onClick={(e) => handlePageClick(totalPages, e)}>
            {totalPages}
          </a>
        </li>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="d-flex justify-content-between">
      {/* <div className="pagination-info mt-4">顯示 第1-12張 / 共72張 優惠券</div> */}
      <nav aria-label="Page navigation example">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <a className="page-link" href="#" onClick={(e) => handlePageClick(1, e)} aria-label="First">
              <i className="fas fa-angle-double-left" />
            </a>
          </li>
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <a className="page-link" href="#" onClick={(e) => handlePageClick(currentPage - 1, e)} aria-label="Previous">
              <i className="fas fa-angle-left" />
            </a>
          </li>
          {renderPageNumbers()}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <a className="page-link" href="#" onClick={(e) => handlePageClick(currentPage + 1, e)} aria-label="Next">
              <i className="fas fa-angle-right" />
            </a>
          </li>
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <a className="page-link" href="#" onClick={(e) => handlePageClick(totalPages, e)} aria-label="Last">
              <i className="fas fa-angle-double-right" />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;