"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { cleanupSession } from "@/lib/session-cleanup";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "minimal";
}

export function LogoutButton({ className = "", variant = "default" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await cleanupSession();
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`text-sm text-gray-600 hover:text-gray-900 dark:text-github-muted dark:hover:text-github-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        aria-label="Sign out"
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium dark:bg-github-border dark:hover:bg-github-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-label="Sign out"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}