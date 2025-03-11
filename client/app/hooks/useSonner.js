"use client";
import { toast } from "sonner";
import { useCallback } from "react";

// 自定義 Sonner Hook
export function useSonner() {
  // 成功通知
  const success = useCallback((message, options = {}) => {
    toast.success(message, {
      ...options,
      duration: options.duration || 3000, // 預設持續時間 3 秒
    });
  }, []);

  // 錯誤通知
  const error = useCallback((message, options = {}) => {
    toast.error(message, {
      ...options,
      duration: options.duration || 5000, // 預設持續時間 5 秒
    });
  }, []);

  // 資訊通知
  const info = useCallback((message, options = {}) => {
    toast.info(message, {
      ...options,
      duration: options.duration || 3000,
    });
  }, []);

  // 警告通知
  const warning = useCallback((message, options = {}) => {
    toast.warning(message, {
      ...options,
      duration: options.duration || 4000,
    });
  }, []);

  // 自定義通知
  const custom = useCallback((message, options = {}) => {
    toast(message, {
      ...options,
    });
  }, []);

  // 帶有按鈕的互動通知
  const withAction = useCallback((message, actionText, onAction, options = {}) => {
    toast(message, {
      ...options,
      action: {
        label: actionText,
        onClick: onAction,
      },
    });
  }, []);

  // 清除所有通知
  const dismiss = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    success,
    error,
    info,
    warning,
    custom,
    withAction,
    dismiss,
  };
}

// 使用範例組件
export function ExampleComponent() {
  const { success, error, info, withAction } = useSonner();

  return (
    <div>
      <button onClick={() => success("操作成功！")}>成功</button>
      <button onClick={() => error("出現錯誤，請重試。")}>錯誤</button>
      <button onClick={() => info("這是一條資訊。")}>資訊</button>
      <button
        onClick={() =>
          withAction(
            "確定要刪除嗎？",
            "確認",
            () => console.log("已確認刪除"),
            { duration: 5000 }
          )
        }
      >
        互動通知
      </button>
    </div>
  );
}