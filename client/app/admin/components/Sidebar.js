import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside
      className={`d-flex flex-column justify-content-center align-items-center ${styles.sidebar}`}
    >
      <div className={styles.sidebarTop}>
        <h6>會員中心</h6>
      </div>

      <ul className={`list-unstyled ${styles.sidebarList}`}>
        <li>
          <Link href="/admin/account" className="active">
            <i className={`bi bi-person ${styles.iconSpacing}`}></i>
            我的帳戶
          </Link>
        </li>
        <li>
          <Link href="/admin/orders">
            <i className={`bi bi-cart ${styles.iconSpacing}`}></i>
            我的訂單
          </Link>
        </li>
        <li>
          <Link href="/admin/message">
            <i className={`bi bi-envelope ${styles.iconSpacing}`}></i>
            我的訊息
          </Link>
        </li>
        <li>
          <Link href="/admin/group">
            <i className={`bi bi-people ${styles.iconSpacing}`}></i>
            我的揪團
          </Link>
        </li>
        <li>
          <Link href="/admin/favorites">
            <i className={`bi bi-heart ${styles.iconSpacing}`}></i>
            我的收藏
          </Link>
        </li>
        <li>
          {/* 到時候請進入admin路由：） */}
          <Link href="/admin/coupon">
            <i className={`bi bi-ticket-perforated ${styles.iconSpacing}`}></i>
            我的優惠券
          </Link>
        </li>
        <li>
          <Link href="/logout">
            <i className={`bi bi-box-arrow-left ${styles.iconSpacing}`}></i>
            登出
          </Link>
        </li>
      </ul>
    </aside>
  );
}
