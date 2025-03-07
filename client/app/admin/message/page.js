"use client";
import PageHeader from "../components/PageHeader"; 
import styles from "./styles.module.css"

export default function MessagePage() {
  return (
    <div className={styles.accountPage} >
      <PageHeader title="我的訊息" />
    
    </div>
  );
}