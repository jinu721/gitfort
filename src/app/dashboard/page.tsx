"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { StreakDashboard } from "@/components/streak-dashboard";
import { SecurityDashboard } from "@/components/security-dashboard";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { CICDDashboard } from "@/components/cicd-dashboard";
import { ErrorBoundary, NetworkError } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-provider";
import { useNavigation, PageHeader, SidebarNavigation } from "@/components/ui/navigation";

type DashboardSection = 'overview' | 'streak' | 'security' | 'analytics' | 'cicd';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [repositories, setRepositories] = useState<Array<{ owner: string; name: string }>>([]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const navigation = useNavigation('overview');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.username) {
      fetchRepositories();
    }
  }, [session]);

  const fetchRepositories = async () => {
    try {
      setNetworkError(null);
      const response = await fetch('/api/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        throw new Error('Failed to fetch repositories');
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setNetworkError('Failed to load repositories');
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'streak', label: 'Streak Monitoring', icon: '🔥', badge: 'Live' },
    { id: 'security', label: 'Security Scanner', icon: '🔒' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'cicd', label: 'CI/CD Pipeline', icon: '⚙️' }
  ];

  const handleNavigation = (sectionId: string) => {
    const item = navigationItems.find(item => item.id === sectionId);
    navigation.navigateTo(sectionId, item?.label);
    setActiveSection(sectionId as DashboardSection);
  };

  const getSectionTitle = () => {
    const item = navigationItems.find(item => item.id === activeSection);
    return item?.label || 'Dashboard';
  };

  const getSectionDescription = () => {
    const descriptions = {
      overview: 'Monitor your GitHub activity at a glance',
      streak: 'Track your contribution streaks and maintain consistency',
      security: 'Scan repositories for security vulnerabilities',
      analytics: 'Analyze your coding patterns and repository statistics',
      cicd: 'Monitor CI/CD pipeline performance and build status'
    };
    return descriptions[activeSection] || '';
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🔥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Current Streak</dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🔒</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Security Issues</dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📈</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Commits</dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">⚙️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Build Success Rate</dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {navigationItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as DashboardSection)}
                    className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">View details</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Repository Overview</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Total Repositories: {repositories.length}</p>
                <p>Active Monitoring: Enabled for all repositories</p>
              </div>
            </div>
          </div>
        );
      case 'streak':
        return <StreakDashboard />;
      case 'security':
        return <SecurityDashboard />;
      case 'analytics':
        return session.user?.username ? (
          <AnalyticsDashboard username={session.user.username} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Username not available</p>
          </div>
        );
      case 'cicd':
        return <CICDDashboard repositories={repositories} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                GitFort
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || ""}
                  alt={session.user?.name || "User"}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user?.name}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen border-r dark:border-gray-700">
          <nav className="mt-8">
            <div className="px-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Dashboard
              </h2>
              <SidebarNavigation
                items={navigationItems}
                activeItem={activeSection}
                onItemClick={handleNavigation}
              />
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {networkError && (
            <div className="mb-6">
              <NetworkError onRetry={fetchRepositories} />
            </div>
          )}
          
          <PageHeader
            title={getSectionTitle()}
            description={getSectionDescription()}
            breadcrumbs={navigation.breadcrumbs}
            backButton={navigation.canGoBack ? {
              onBack: navigation.goBack,
              disabled: false
            } : undefined}
          />
          
          <ErrorBoundary>
            {renderActiveSection()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}