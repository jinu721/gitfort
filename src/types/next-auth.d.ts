import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubId?: string;
    };
  }

  interface User {
    githubId?: string;
  }

  interface Profile {
    login?: string;
    avatar_url?: string;
    email?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    githubId?: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    error?: string;
  }
}