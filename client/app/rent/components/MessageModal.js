import React from "react";
import "./MessageModal.css";

const MessageModal = ({ message, onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>{message}</p>
          <button onClick={onClose}>關閉</button>
        </div>
      </div>
    );
  };

export default MessageModal;