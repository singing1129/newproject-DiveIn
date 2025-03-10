"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaBars } from "react-icons/fa";
import User from "./user";
import { FiShoppingCart } from "react-icons/fi";
import Link from "next/link";
import HeaderPop from "./headerPop"; // 引入 HeaderPop 組件
import Search from "./Search"; // 引入 Search 組件
import { useCart } from "@/hooks/cartContext";

export default function Header() {
  const [showPop, setShowPop] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showSearch, setShowSearch] = useState(false); // 控制搜尋框顯示
  const { cartData } = useCart();
  const [cartCount, setCartCount] = useState(0);

  const handleMouseEnter = (menu) => {
    setShowPop(true);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    setShowPop(false);
    setActiveMenu(null);
  };

  // 切換搜尋框顯示狀態
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  // 關閉搜尋框
  const closeSearch = () => {
    setShowSearch(false);
  };

  // 計算購物車中的總商品數量
  const cartItemCount = () => {
    if (!cartData) return 0;

    const productCount = cartData.products?.length || 0;
    const activityCount = cartData.activities?.length || 0;
    const rentalCount = cartData.rentals?.length || 0;
    const bundleCount = cartData.bundles?.length || 0;

    return productCount + activityCount + rentalCount + bundleCount;
  };

  // 監聽購物車數據變化
  useEffect(() => {
    setCartCount(cartItemCount());
  }, [cartData]);

  // 添加全局快捷鍵監聽
  useEffect(() => {
    function handleKeyDown(event) {
      // 檢測 Ctrl+K 或 Command+K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault(); // 阻止預設行為
        setShowSearch((prevState) => !prevState); // 切換搜尋框顯示狀態
      }

      // 按ESC鍵關閉搜尋
      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch]);

  return (
    <header className="sticky-top">
      <nav className="container" onMouseLeave={handleMouseLeave}>
        {/* 電腦版 navbar */}
        <div className="d-none d-sm-flex">
          <div className="header-icon-container">
            <Link href="/">
              <img src="/image/DiveIn-logo-dark-final.png" alt="Logo" />
            </Link>
          </div>
          <div className="header-list d-flex justify-content-between align-items-center">
            <ul className="m-0 d-flex justify-content-between align-items-center list-unstyled">
              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/"
                  onMouseEnter={() => {
                    setShowPop(false);
                  }}
                >
                  首頁
                </Link>
              </li>

              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/products"
                  onMouseEnter={() => handleMouseEnter("products")}
                >
                  商品
                </Link>
              </li>
              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/activity"
                  onMouseEnter={() => handleMouseEnter("events")}
                >
                  活動
                </Link>
              </li>
              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/rent"
                  onMouseEnter={() => handleMouseEnter("rental")}
                >
                  租借
                </Link>
              </li>
              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/group"
                  onMouseEnter={() => handleMouseEnter("group")}
                >
                  揪團
                </Link>
              </li>
              <li className="px-3 py-2">
                <Link
                  className="a"
                  href="/article"
                  onMouseEnter={() => handleMouseEnter("forum")}
                >
                  論壇
                </Link>
              </li>
            </ul>
          </div>
          <HeaderPop show={showPop} activeMenu={activeMenu} />
          <div className="header-right-box d-flex justify-content-end align-items-center">
            {/* 統一的圖標樣式 */}
            <div className="d-flex align-items-center gap-3">
              {/* 搜索按鈕 */}
              <button
                className="btn btn-link p-0 border-0 header-icon"
                onClick={toggleSearch}
                aria-label="搜尋"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333",
                  fontSize: "20px",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <FaSearch size={20} />
              </button>

              {/* 購物車按鈕 */}
              <Link
                href="/cart/step1"
                className="header-icon"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333",
                  fontSize: "20px",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <FiShoppingCart size={22} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "#e74c3c",
                      color: "white",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* 用戶圖標 */}
              <div className="header-icon">
                <User />
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋组件 */}
        {showSearch && <Search onClose={closeSearch} />}

        {/* 手機板 navbar*/}
        <div className="w-100 d-flex d-sm-none justify-content-between align-items-center">
          <div>
            <button
              className="btn"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasExample"
              aria-controls="offcanvasExample"
            >
              <FaBars />
            </button>
          </div>
          <div className="header-icon-container text-center">
            <Link href="/">
              <img src="/image/DiveIn-logo-dark-final.png" alt="Logo" />
            </Link>
          </div>
          <div className="mobile-cart fs-4">
            <Link
              href="/cart/step1"
              className="a text-black"
              style={{ position: "relative" }}
            >
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#e74c3c",
                    color: "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* 漢堡選單內容 */}
      <div
        className="mobile-offcanvas offcanvas offcanvas-start "
        tabIndex={-1}
        id="offcanvasExample"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="mobile-offcanvas-header offcanvas-header">
          <h5
            className="offcanvas-title text-secondary"
            id="offcanvasScrollingLabel"
          />
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="mobile-offcanvas-body offcanvas-body p-0">
          <ul className="m-0 list-unstyled border-bottom">
            <li className="px-3 pt-4 pb-2">
              <Link className="a text-reset" href="/">
                首頁
              </Link>
            </li>
            <li className="px-3 py-2">
              <button
                className="btn dropdown-toggle p-0 text-reset"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#product-menu"
              >
                商品
              </button>
              <div className="mobile-collapse collapse mt-3" id="product-menu">
                <ul className="list-group">
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      面鏡／呼吸管
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      蛙鞋
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      潛水配件
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      電子裝備／專業配件
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      防寒衣物
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      包包攜行
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      魚槍／配件
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      生活小物
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2">
              <button
                className="btn dropdown-toggle p-0 text-reset"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#activity-menu"
              >
                活動
              </button>
              <div className="mobile-collapse collapse mt-3" id="activity-menu">
                <ul className="list-group">
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      自由潛水活動
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      水肺潛水活動
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      浮潛活動
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2">
              <button
                className="btn dropdown-toggle p-0 text-reset"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#rent-menu"
              >
                租借
              </button>
              <div className="mobile-collapse collapse mt-3" id="rent-menu">
                <ul className="list-group">
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      基礎裝備租借
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      專業裝備租借
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      水下攝影設備
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2">
              <button
                className="btn dropdown-toggle p-0 text-reset"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#group-menu"
              >
                揪團
              </button>
              <div className="mobile-collapse collapse mt-3" id="group-menu">
                <ul className="list-group">
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      建立揪團
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      參加揪團
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      我的揪團
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2">
              <button
                className="btn dropdown-toggle p-0 text-reset"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#forum-menu"
              >
                論壇
              </button>
              <div className="mobile-collapse collapse mt-3" id="forum-menu">
                <ul className="list-group">
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      綜合討論
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      潛水心得
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      裝備討論
                    </a>
                  </li>
                  <li className="list-group-item">
                    <a className="a text-reset" href="#">
                      水攝攝影
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            {/*             
            <li className="px-3 py-2">
              <a className="a text-reset" href="#">
                活動
              </a>
            </li>
            <li className="px-3 py-2">
              <a className="a text-reset" href="#">
                租借
              </a>
            </li>
            <li className="px-3 py-2">
              <a className="a text-reset" href="#">
                揪團
              </a>
            </li>
            <li className="px-3 pt-2 pb-4">
              <a className="a text-reset" href="#">
                論壇
              </a>
            </li> */}
          </ul>

          <div className="border-bottom">
            <h5 className="px-3 pt-4 py-2 text-secondary">帳戶</h5>
            <ul className="m-0 px-4 list-unstyled">
              <li className="px-3 py-2">
                <Link className="a text-reset" href="/admin/login">
                  登入
                </Link>
              </li>
              <li className="px-3 pt-2 pb-4">
                <Link className="a text-reset" href="/admin/register">
                  註冊
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
