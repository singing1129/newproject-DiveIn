"use client"; 
import Breadcrumb from "../components/Breadcrumb/breadcrumb";
import Sidebar from "./components/Sidebar";
import styles from "./layout.module.css";
import { usePathname } from "next/navigation";

export default function MemberLayout({ children }) {
  const pathname = usePathname();
  const noLayoutPages = ["/admin/login", "/admin/register", "/admin/login2", "/admin/register2", "/admin/forgot2", "/admin/logout","/admin/coupon/coupon-claim"];
  const isNoLayoutPage = noLayoutPages.includes(pathname);

  // 如果是登入頁面，直接返回 children，不渲染任何佈局
  if (isNoLayoutPage) {
    return <>{children}</>;
  }

  // 其他頁面渲染完整的 admin 佈局
  return (
    <>
      <Breadcrumb />
      <div className="container py-4 mx-auto">
        <div className="row">
          <div className="col-12 col-md-4 col-lg-3">
            <Sidebar />
          </div>
          <div className="col-12 col-md-8 col-lg-9">
            <main className="main-content">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}