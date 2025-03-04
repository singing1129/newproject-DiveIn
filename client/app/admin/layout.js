import Breadcrumb from "../components/Breadcrumb/breadcrumb";
import Sidebar from "./components/Sidebar";
import styles from "./layout.module.css";

export default function MemberLayout({ children }) {
  return (
    <>
      <Breadcrumb />
      <div className="container py-4 mx-auto">
        <div className="row">
          {/* 側欄*/}
          <div className="col-12 col-md-4 col-lg-3">
            <Sidebar />
          </div>
          {/* 右邊頁面內容*/}
          <div className="col-12 col-md-8 col-lg-9">
            <main className="main-content">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
