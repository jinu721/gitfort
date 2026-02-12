import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { decryptToken } from "./encryption";

export interface TokenInfo {
  accessToken: string;
  isValid: boolean;
  error?: string;
}

export async function getValidAccessToken(): Promise<TokenInfo | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return null;
    }

    if (session.error === "RefreshAccessTokenError") {
      return {
        accessToken: "",
        isValid: false,
        error: "Token refresh failed. Please sign in again."
      };
    }

    return {
      accessToken: session.accessToken,
      isValid: true
    };
  } catch (error) {
    return {
      accessToken: "",
      isValid: false,
      error: "Failed to retrieve access token"
    };
  }
}

export async function validateTokenAndGetUser() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("No active session");
  }

  if (session.error === "RefreshAccessTokenError") {
    throw new Error("Token expired. Please sign in again.");
  }

  if (!session.accessToken) {
    throw new Error("No access token available");
  }

  return {
    accessToken: session.accessToken,
    user: session.user
  };
}