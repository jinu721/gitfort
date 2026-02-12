"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { StreakDashboard } from "@/components/streak-dashboard";
import { SecurityDashboard } from "@/components/security-dashboard";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { CICDDashboard } from "@/components/cicd-dashboard";

type DashboardSection = 'overview' | 'streak' | 'security' | 'analytics' | 'cicd';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [repositories, setRepositories] = useState<Array<{ owner: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.username) {
      fetchRepositories();
    }
  }, [session]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/repositories');
      
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        console.error('Repository API error:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Current Streak', value: loading ? 'Loading...' : '12 days', color: 'emerald', change: '+2 from last week' },
                { title: 'Security Issues', value: loading ? 'Loading...' : '3 found', color: 'red', change: '-1 from last scan' },
                { title: 'Total Commits', value: loading ? 'Loading...' : '1,247', color: 'blue', change: '+45 this week' },
                { title: 'Build Success', value: loading ? 'Loading...' : '94.2%', color: 'green', change: '+2.1% improvement' }
              ].map((stat, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fjalla-one)' }}>{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center`}>
                      <div className={`w-6 h-6 bg-${stat.color}-500 rounded`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-fjalla-one)' }}>Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {navigationItems.slice(1).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as DashboardSection)}
                    className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-emerald-500/50 transition-all group"
                  >
                    <div className="text-emerald-400 mr-3 group-hover:text-emerald-300">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-400">View details</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-fjalla-one)' }}>Repository Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-fjalla-one)' }}>{repositories.length}</p>
                  <p className="text-sm text-gray-400">Total Repositories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-fjalla-one)' }}>{repositories.length}</p>
                  <p className="text-sm text-gray-400">Active Monitoring</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-fjalla-one)' }}>100%</p>
                  <p className="text-sm text-gray-400">Coverage</p>
                </div>
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
            <p className="text-gray-400">Username not available</p>
          </div>
        );
      case 'cicd':
        return <CICDDashboard repositories={repositories} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-fjalla-one)' }}>GitFort</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-8 rounded-full border-2 border-emerald-500"
                  src={session.user?.image || ""}
                  alt={session.user?.name || "User"}
                />
                <span className="text-sm font-medium text-gray-300">
                  {session.user?.name}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
          <nav className="p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as DashboardSection)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="mr-3">
                    {item.icon}
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
              {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <p className="text-gray-400">
              {activeSection === 'overview' && 'Monitor your GitHub activity at a glance'}
              {activeSection === 'streak' && 'Track your contribution streaks and maintain consistency'}
              {activeSection === 'security' && 'Scan repositories for security vulnerabilities'}
              {activeSection === 'analytics' && 'Analyze your coding patterns and repository statistics'}
              {activeSection === 'cicd' && 'Monitor CI/CD pipeline performance and build status'}
            </p>
          </div>
          
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}