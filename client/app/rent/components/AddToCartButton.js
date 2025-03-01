import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import FlyToCartAnimation from "./FlyToCartAnimation"; // 動畫組件

const AddToCartButton = ({ onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true); // 觸發動畫
    onClick(); // 執行加入購物車的邏輯
  };

  return (
    <>
      <button
        type="button"
        className="mybtn btn-cart flex-grow-1"
        onClick={handleClick}
      >
        <FontAwesomeIcon icon={faCartPlus} className="cart-icon" />
        加入購物車
      </button>

      {/* 渲染動畫組件 */}
      {isAnimating && <FlyToCartAnimation onAnimationEnd={() => setIsAnimating(false)} />}
    </>
  );
};

export default AddToCartButton;