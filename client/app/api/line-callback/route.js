// app/api/line-callback/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    // 從 URL 獲取查詢參數
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${url.origin}/admin/account?error=missing_params`
      );
    }
    
    try {
      // 解碼狀態參數
      const decodedState = JSON.parse(atob(state));
      const { action, userId, returnUrl } = decodedState;
      
      // 檢查是否為連結操作
      if (action !== 'link' || !userId) {
        return NextResponse.redirect(
          `${url.origin}/admin/account?error=invalid_state`
        );
      }
      
      // 處理與後端的通信
      const response = await axios.post(
        'http://localhost:3005/api/admin/line-link',
        {
          code: code,
          redirect_uri: `${url.origin}/api/line-callback`,
          user_id: userId
        }
      );
      
      // 檢查回應
      if (response.data.status === 'success') {
        // 成功連結
        return NextResponse.redirect(
          `${url.origin}/admin/account?success=line_linked`
        );
      } else {
        // 連結失敗
        return NextResponse.redirect(
          `${url.origin}/admin/account?error=${response.data.message}`
        );
      }
    } catch (decodeError) {
      console.error('解碼狀態參數錯誤:', decodeError);
      return NextResponse.redirect(
        `${url.origin}/admin/account?error=invalid_state_format`
      );
    }
  } catch (error) {
    console.error('LINE 回調處理錯誤:', error);
    return NextResponse.redirect(
      `${url.origin}/admin/account?error=callback_error`
    );
  }
}