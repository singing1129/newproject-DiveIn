"use client"; // 因為需要用到 React 的狀態管理，所以標記為 Client Component

import PageHeader from "../components/PageHeader";
import FavoritesContent from "../components/FavoritesContent";
import styles from "../components/Favorites.module.css";

export default function FavoritesPage() {
  return (
    <div className={styles.favoritesPage}>
      <PageHeader title="我的收藏" />
      <div className={styles.contentWrapper}>
        <FavoritesContent />
      </div>
    </div>
  );
}