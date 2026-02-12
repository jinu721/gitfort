import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXTAUTH_SECRET } from "./env";
import { encryptToken, decryptToken } from "./encryption";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "repo read:user user:email"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = encryptToken(account.access_token!);
        token.githubId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = decryptToken(token.accessToken as string);
        session.user.githubId = token.githubId as string;
      }
      return session;
    }
  }
};