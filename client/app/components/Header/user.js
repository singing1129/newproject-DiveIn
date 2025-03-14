"use client";
import { useState, useEffect } from "react";
import { FaRegUser } from "react-icons/fa";
import { Menu, MenuItem, IconButton } from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function User() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  console.log("user", user);

  return (
    // FIXME: 修正下拉選單位置
    <div className="position-relative">
      {user && user !== -1 ? (
        <IconButton
          onClick={handleClick}
          sx={{
            padding: "0,auto",
            color: "#333",
          }}
        >
          <FaRegUser size={20} />
        </IconButton>
      ) : (
        <Link
          href="/admin/login"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontSize: "20px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <FaRegUser size={20} />
        </Link>
      )}

      {/* ✅ 修正下拉選單位置 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ marginTop: "8px" }}
      >
        <div>
          {user ? (
            <>
              <MenuItem onClick={handleClose}>
                <Link className="text-decoration-none" href="/admin/account">
                  設定帳戶
                </Link>
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Link className="text-decoration-none" href="/admin/favorites">
                  我的收藏
                </Link>
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Link className="text-decoration-none" href="/admin/coupon">
                  優惠券
                </Link>
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Link className="text-decoration-none" href="/admin/message">
                  我的訊息
                </Link>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  logout();
                  handleClose();
                }}
                style={{ color: "red" }}
              >
                登出
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleClose}>
              <Link href="/admin/login">登入</Link>
            </MenuItem>
          )}
        </div>
      </Menu>
    </div>
  );
}
