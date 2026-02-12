"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutButton } from "@/components/logout-button";
import { StreakDashboard } from "@/components/streak-dashboard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-github-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-github-text"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-github-bg">
      <nav className="bg-white dark:bg-github-surface shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-github-text">
                GitHub Control Center
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || ""}
                  alt={session.user?.name || "User"}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-github-text">
                  {session.user?.name}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <StreakDashboard />
            
            <div className="border-4 border-dashed border-gray-200 dark:border-github-border rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-github-text mb-2">
                  More Dashboard Features Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-github-muted">
                  Additional dashboard components will be implemented in upcoming tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}