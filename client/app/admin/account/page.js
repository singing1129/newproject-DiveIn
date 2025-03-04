import PageHeader from "../components/PageHeader"; 
import AccountForm from "../components/AccountForm";
import styles from "./page.module.css";

export default function AccountPage() {
  return (
    <div className={styles.accountPage}>
      <PageHeader title="我的帳戶" />
      <AccountForm />
    </div>
  );
}