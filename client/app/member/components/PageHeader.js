import styles from "./PageHeader.module.css"; // 引入專用的 CSS Module

export default function PageHeader({ title }) {
  return (
    <div className={styles.PageHeader}>
      <h1 className={styles.PageTitle}>{title}</h1>
    </div>
  );
}