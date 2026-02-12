import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXTAUTH_SECRET } from "./env";
import { encryptToken, decryptToken } from "./encryption";
import { createOrUpdateUser } from "./session-manager";

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: encryptToken(refreshedTokens.access_token),
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account && user && profile) {
        const userData = {
          githubId: parseInt(user.id),
          username: profile.login || user.name || '',
          email: user.email || profile.email || '',
          avatarUrl: user.image || profile.avatar_url || '',
          accessToken: account.access_token!,
        };

        try {
          await createOrUpdateUser(userData);
        } catch (error) {
          console.error("Failed to persist user data:", error);
        }

        return {
          ...token,
          accessToken: encryptToken(account.access_token!),
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
          githubId: user.id,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.error ? undefined : decryptToken(token.accessToken as string);
        session.user.id = token.githubId as string;
        session.user.githubId = token.githubId as string;
        session.user.name = token.username as string;
        session.user.email = token.email as string;
        session.user.image = token.avatarUrl as string;
        
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          const userData = {
            githubId: parseInt(user.id),
            username: profile?.login || user.name || '',
            email: user.email || profile?.email || '',
            avatarUrl: user.image || profile?.avatar_url || '',
            accessToken: account.access_token!,
          };

          await createOrUpdateUser(userData);
          return true;
        } catch (error) {
          console.error("Error saving user to database:", error);
          return false;
        }
      }
      return true;
    }
  }
};