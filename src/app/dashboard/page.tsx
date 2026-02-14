"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { LogoutButton } from "@/components/logout-button";
import { StreakDashboard } from "@/components/streak-dashboard";
import { SecurityDashboard } from "@/components/security-dashboard";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { CICDDashboard } from "@/components/cicd-dashboard";
import Image from "next/image";

type DashboardSection = 'overview' | 'streak' | 'security' | 'analytics' | 'cicd';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [repositories, setRepositories] = useState<Array<{ owner: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.username) return;

    try {
      setLoading(true);
      
      // Use the new service layer instead of direct API calls
      const response = await fetch('/api/dashboard/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: session.user.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
        setRepositories(data.repositories || []);
      } else {
        console.error('Dashboard API error:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.username]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.username) {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 relative">
            <Image
              src="/gitfort-logo.png"
              alt="GitFort Logo"
              width={64}
              height={64}
              className="rounded-xl animate-pulse"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navigationItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'streak', 
      label: 'Streak Monitoring', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      id: 'security', 
      label: 'Security Scanner', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'cicd', 
      label: 'CI/CD Pipeline', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  title: 'Current Streak', 
                  value: loading ? '...' : '12', 
                  unit: 'days',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  change: '+2 from last week',
                  trend: 'up'
                },
                { 
                  title: 'Security Issues', 
                  value: loading ? '...' : '3', 
                  unit: 'found',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ),
                  change: '-1 from last scan',
                  trend: 'down'
                },
                { 
                  title: 'Total Commits', 
                  value: loading ? '...' : '1,247', 
                  unit: '',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  change: '+45 this week',
                  trend: 'up'
                },
                { 
                  title: 'Build Success', 
                  value: loading ? '...' : '94.2', 
                  unit: '%',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  change: '+2.1% improvement',
                  trend: 'up'
                }
              ].map((stat, index) => (
                <div key={index} className="bg-[#161b22] border border-[#21262d] rounded-lg p-5 hover:border-[#30363d] transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-[#238636]/10 rounded-lg flex items-center justify-center text-[#2ea043]">
                      {stat.icon}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {stat.trend === 'up' ? '↗' : '↘'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#7d8590] mb-2">{stat.title}</p>
                    <div className="flex items-baseline space-x-1 mb-2">
                      <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                        {stat.value}
                      </span>
                      {stat.unit && <span className="text-sm text-[#7d8590]">{stat.unit}</span>}
                    </div>
                    <p className="text-xs text-[#7d8590]">{stat.change}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {navigationItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as DashboardSection)}
                    className="flex items-center p-4 bg-[#0d1117] border border-[#21262d] rounded-lg hover:bg-[#21262d] hover:border-[#238636] transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-[#238636]/10 rounded-lg flex items-center justify-center text-[#2ea043] group-hover:bg-[#238636]/20 transition-colors mr-4">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-[#7d8590]">View details</p>
                    </div>
                    <div className="text-[#7d8590] group-hover:text-[#2ea043] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                Repository Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2ea043] mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                    {repositories.length}
                  </p>
                  <p className="text-sm text-[#7d8590]">Total Repositories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2ea043] mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                    {repositories.length}
                  </p>
                  <p className="text-sm text-[#7d8590]">Active Monitoring</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2ea043] mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                    100%
                  </p>
                  <p className="text-sm text-[#7d8590]">Coverage</p>
                </div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
                Recent Activity
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Security scan completed', time: '2 minutes ago', status: 'success' },
                  { action: 'New commit detected', time: '15 minutes ago', status: 'info' },
                  { action: 'Build pipeline started', time: '1 hour ago', status: 'pending' },
                  { action: 'Streak milestone reached', time: '3 hours ago', status: 'success' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-3 bg-[#0d1117] rounded-lg border border-[#21262d]">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-[#7d8590]">{activity.time}</p>
                    </div>
                  </div>
                ))}
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
            <p className="text-[#7d8590]">Username not available</p>
          </div>
        );
      case 'cicd':
        return <CICDDashboard repositories={repositories} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="border-b border-[#21262d] bg-[#0d1117]">
        <div className="flex justify-between items-center px-4 sm:px-6 py-4">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
              {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-[#7d8590] mt-1 truncate hidden sm:block">
              {activeSection === 'overview' && 'Monitor your GitHub activity at a glance'}
              {activeSection === 'streak' && 'Track contribution streaks and maintain consistency'}
              {activeSection === 'security' && 'Scan repositories for security vulnerabilities'}
              {activeSection === 'analytics' && 'Analyze coding patterns and repository statistics'}
              {activeSection === 'cicd' && 'Monitor CI/CD pipeline performance and build status'}
            </p>
          </div>
          
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center hover:bg-[#161b22] p-1 rounded-lg transition-colors"
            >
              <Image
                className="h-7 w-7 rounded-lg border border-[#21262d] hover:border-[#30363d] transition-colors"
                src={session.user?.image || ""}
                alt={session.user?.name || "User"}
                width={28}
                height={28}
              />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#161b22] border border-[#21262d] rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-[#21262d]">
                  <div className="flex items-center space-x-3">
                    <Image
                      className="h-10 w-10 rounded-lg"
                      src={session.user?.image || ""}
                      alt={session.user?.name || "User"}
                      width={40}
                      height={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-[#7d8590] truncate">@{session.user?.username || 'user'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="w-72 bg-[#0d1117] border-r border-[#21262d] min-h-screen hidden lg:block">
          <div className="p-6">
            
            <nav className="space-y-3">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as DashboardSection)}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-[#238636] hover:bg-[#2ea043] text-white'
                      : 'text-[#7d8590] hover:text-white hover:bg-[#161b22]'
                  }`}
                >
                  <div className="mr-3">
                    {item.icon}
                  </div>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-[#21262d] z-50">
          <div className="grid grid-cols-5 gap-1 p-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as DashboardSection)}
                className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'text-[#238636] bg-[#238636]/10'
                    : 'text-[#7d8590] hover:text-white'
                }`}
              >
                <div className="mb-1">
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 pb-24 lg:pb-6 max-w-7xl">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}