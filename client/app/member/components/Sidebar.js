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
          <Link href="/member/account" className="active">
            <i className={`bi bi-person ${styles.iconSpacing}`}></i>
            我的帳戶
          </Link>
        </li>
        <li>
          <Link href="/member/orders">
            <i class={`bi bi-cart ${styles.iconSpacing}`}></i>
            我的訂單
          </Link>
        </li>
        <li>
          <Link href="/member/groups">
            <i class={`bi bi-people ${styles.iconSpacing}`}></i>
            我的鳩團
          </Link>
        </li>
        <li>
          <Link href="/member/favorites">
            <i class={`bi bi-heart ${styles.iconSpacing}`}></i>
            我的收藏
          </Link>
        </li>
        <li>
          <Link href="/member/coupons">
            <i class={`bi bi-ticket-perforated ${styles.iconSpacing}`}></i>
            我的優惠券
          </Link>
        </li>
        <li>
          <Link href="/logout">
            <i class={`bi bi-box-arrow-left ${styles.iconSpacing}`}></i>
            登出
          </Link>
        </li>
      </ul>
    </aside>
  );
}
