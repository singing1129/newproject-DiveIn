import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"; //引入google
import LineProvider from "next-auth/providers/line"; // 引入 LINE 提供者
import axios from "axios";

// 在 route.js 中
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image || user.picture;
      }

      if (account) {
        token.provider = account.provider;
        token.provider_id = token.sub; // Google ID
      }

      // **確保 `token.id` 設為 `users.id`**
      if (!token.id) {
        try {
          const response = await axios.post(
            "http://localhost:3005/api/admin/get-user-id",
            {
              provider: token.provider,
              provider_id: token.provider_id,
            }
          );

          if (response.data.status === "success") {
            token.id = response.data.data.user_id; // ✅ `users.id`
            console.log(`JWT 回呼設定 token.id = ${token.id}`);
          } else {
            console.warn("❌ 後端查詢 user_id 失敗", response.data);
          }
        } catch (error) {
          console.error("❌ 查詢 user_id 發生錯誤", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log(" 檢查 NextAuth session:", session);
      console.log(" Token 內容:", token);

      if (token && session.user) {
        session.user.id = token.id || null; //  確保 `session.user.id` 來自 `users.id`
        session.accessToken = token.accessToken;
        session.provider = token.provider;
        session.provider_id = token.provider_id;

        console.log(` 設定 session.user.id = ${session.user.id}`);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  // 開發模式下啟用調試
  debug: process.env.NODE_ENV === "development",
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
