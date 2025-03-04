import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

// Firebase 設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase（確保只初始化一次）
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 設定 reCAPTCHA 驗證
const setupRecaptcha = (containerId) => {
  if (typeof window !== "undefined" && auth) {
    return new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }
  return null;
};

export { auth, signInWithPhoneNumber, setupRecaptcha };
