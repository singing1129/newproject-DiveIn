import { useState, useRef } from "react";
import "./InteractiveButton.css";

const getLimitedPosition = (originalX, originalY, range = 50) => {
  const x = originalX + (Math.random() * range * 2 - range); // 限制在 ±50px 範圍內
  const y = originalY + (Math.random() * range * 2 - range);
  return { x, y };
};

const InteractiveButton = ({ onClick, children, disabled, rubbing }) => {
  const btnRef = useRef(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const [showRubbing, setShowRubbing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 });

  const moveButton = () => {
    if (!btnRef.current) return;
    const { x, y } = getLimitedPosition(originalPosition.x, originalPosition.y);
    setPosition({ x, y });
  };

  const resetPosition = () => setPosition(originalPosition);

  const handleClick = () => {
    if (disabled) {
      setShowRubbing(true);
      moveButton(); // 讓按鈕亂跑
      setTimeout(() => setShowRubbing(false), 1000);
      return;
    }
    if (!isBouncing) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 600);
    }
    onClick && onClick();
  };

  return (
    <div
      className="interactive-btn-container"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseEnter={() => disabled && moveButton()}
      onMouseLeave={() => disabled && resetPosition()}
    >
      <button
        ref={btnRef}
        className={`interactive-btn ${isBouncing ? "jelly-bounce" : ""} ${disabled ? "disabled" : ""}`}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {children}
      </button>
      {showRubbing && <span className="rubbing">{rubbing || "請完成表單"}</span>}
    </div>
  );
};

export default InteractiveButton;
