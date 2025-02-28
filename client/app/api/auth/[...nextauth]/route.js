import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"; //引入google
import LineProvider from "next-auth/providers/line"; // 引入 LINE 提供者

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
    async jwt({ token, account, user, profile }) {
      console.log("JWT Callback 详细数据:", {
        token,
        account,
        user,
        profile,
      });

      if (account && user) {
        // 保存关键账号信息到token
        token.accessToken = account.access_token;
        token.id = user.id;
        token.provider = account.provider; // 明确保存提供者类型
        token.provider_id = account.providerAccountId; // 保存提供者特定ID

        // 记录一些调试信息
        console.log(
          `JWT: 用户通过 ${account.provider} 登录，提供者ID: ${account.providerAccountId}`
        );
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback:", {
        sessionExists: !!session,
        tokenExists: !!token,
      });

      if (token && session.user) {
        // 确保会话中包含所有必要的用户和提供者信息
        session.user.id = token.id;
        session.accessToken = token.accessToken;

        // 从token传递提供者信息到会话
        session.provider = token.provider;
        session.provider_id = token.provider_id;

        console.log(
          `Session: 为用户设置 provider=${session.provider}, provider_id=${session.provider_id}`
        );
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  // 增加调试选项以便观察更多信息
  debug: process.env.NODE_ENV === "development",
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
