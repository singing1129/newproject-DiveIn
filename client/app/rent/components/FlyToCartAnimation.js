import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";

const FlyToCartAnimation = ({ onAnimationEnd }) => {
  useEffect(() => {
    // 動畫結束後觸發回調
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 1000); // 動畫持續 1 秒

    return () => clearTimeout(timer); // 清除定時器
  }, [onAnimationEnd]);

  return ReactDOM.createPortal(
    <div className="fly-to-cart">
      <FontAwesomeIcon icon={faCartPlus} />
    </div>,
    document.getElementById("cart-icon") // 將動畫元素渲染到 Header 的購物車圖標位置
  );
};

export default FlyToCartAnimation;