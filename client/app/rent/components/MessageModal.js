import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./MessageModal.css";

const MessageModal = ({ message, show, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [modalRoot, setModalRoot] = useState(null);

  // 建立 portal 容器
  useEffect(() => {
    const root = document.createElement("div");
    root.id = "modal-portal-root";
    document.body.appendChild(root);
    setModalRoot(root);
    return () => document.body.removeChild(root);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!modalRoot || !show) return null;

  return ReactDOM.createPortal(
    <div className="custom-message-modal">
      {" "}
      {/* 添加前綴 */}
      <div
        className={`modal-overlay ${isClosing ? "closing" : ""}`}
        onClick={handleClose}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="modal-title">DiveIn</h5>
            <button
              type="button"
              className="close-btn"
              onClick={handleClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="confirm-btn" onClick={handleClose}>
              關閉
            </button>
          </div>
        </div>
      </div>
      ,
    </div>,
    modalRoot
  );
};

export default MessageModal;
