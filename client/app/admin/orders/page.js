"use client";

import PageHeader from "../components/PageHeader";
import OrdersContent from "../components/OrdersContent";
import styles from "../components/Orders.module.css";

export default function OrderPage() {
  return (
    <div className={styles.ordersPage}>
      <PageHeader title="我的訂單" />

      <div className={styles.contentWrapper}>
        <OrdersContent />
      </div>
    </div>
  );
}