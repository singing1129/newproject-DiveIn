"use client";
import { CartProvider } from "@/hooks/cartContext";
import Header from "./components/Header/header";
import Footer from "./components/Footer/footer";
// import { ToastContainer } from "react-toastify";
import { Toaster } from "sonner";
import "react-toastify/dist/ReactToastify.css";
import { usePathname } from "next/navigation";
// 聊天室用
import { WebSocketProvider } from "./hooks/useWebSocket";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const noLayoutPages = ["/admin/login", "/admin/register", "/admin/login2" , "/admin/register2", "/admin/forgot2", "/admin/logout",
    "/home",];
  const isNoLayoutPage = noLayoutPages.includes(pathname);

  return (
    <WebSocketProvider>
      <CartProvider>
        {!isNoLayoutPage && <Header />}
        {children}
        {/* <ToastContainer /> */}
        <Toaster position="top-right" offset={120} /> {/* 替換 ToastContainer */}
        {!isNoLayoutPage && <Footer />}
      </CartProvider>
    </WebSocketProvider>
  );
}
