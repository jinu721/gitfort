"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface SecurityFinding {
  id: string;
  repositoryName: string;
  repositoryId: string;
  scanDate: Date;
  riskScore: number;
  vulnerabilities: Vulnerability[];
  status: 'completed' | 'failed' | 'in_progress';
}

interface Vulnerability {
  type: 'env_var' | 'aws_key' | 'api_key' | 'private_key';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  description: string;
  suggestion: string;
}

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className = "" }: SecurityDashboardProps) {
  const { data: session } = useSession();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSecurityFindings();
    }
  }, [session?.user?.id]);

  const fetchSecurityFindings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/security/findings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch security findings");
      }
      
      const data = await response.json();
      setFindings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore >= 80) return "text-dashboard-error dark:text-github-danger";
    if (riskScore >= 60) return "text-dashboard-warning dark:text-github-warning";
    if (riskScore >= 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-dashboard-success dark:text-github-accent";
  };

  const getRiskLevelBg = (riskScore: number) => {
    if (riskScore >= 80) return "bg-red-50 dark:bg-red-900/20";
    if (riskScore >= 60) return "bg-orange-50 dark:bg-orange-900/20";
    if (riskScore >= 30) return "bg-yellow-50 dark:bg-yellow-900/20";
    return "bg-green-50 dark:bg-green-900/20";
  };

  const getRiskLevelText = (riskScore: number) => {
    if (riskScore >= 80) return "Critical";
    if (riskScore >= 60) return "High";
    if (riskScore >= 30) return "Medium";
    return "Low";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "text-dashboard-error dark:text-github-danger";
      case 'high': return "text-dashboard-warning dark:text-github-warning";
      case 'medium': return "text-yellow-600 dark:text-yellow-400";
      case 'low': return "text-dashboard-success dark:text-github-accent";
      default: return "text-gray-600 dark:text-github-muted";
    }
  };

  const getVulnerabilityIcon = (type: string) => {
    switch (type) {
      case 'env_var':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'aws_key':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'api_key':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'private_key':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const formatScanDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getOverallRiskScore = () => {
    if (findings.length === 0) return 0;
    const totalRisk = findings.reduce((sum, finding) => sum + finding.riskScore, 0);
    return Math.round(totalRisk / findings.length);
  };

  const getVulnerabilityStats = () => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    findings.forEach(finding => {
      finding.vulnerabilities.forEach(vuln => {
        stats[vuln.severity]++;
      });
    });
    return stats;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-github-border rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-github-border rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-github-border rounded"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-github-border rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-dashboard-error dark:text-github-danger mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-github-text mb-2">
            Failed to load security findings
          </h3>
          <p className="text-gray-600 dark:text-github-muted mb-4">{error}</p>
          <button
            onClick={fetchSecurityFindings}
            className="px-4 py-2 bg-dashboard-primary dark:bg-github-info text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overallRisk = getOverallRiskScore();
  const vulnStats = getVulnerabilityStats();

  return (
    <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-github-text">
          Security Dashboard
        </h2>
        <button
          onClick={fetchSecurityFindings}
          className="text-gray-500 dark:text-github-muted hover:text-gray-700 dark:hover:text-github-text transition-colors"
          title="Refresh security data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${getRiskLevelBg(overallRisk)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Overall Risk
            </h3>
            <div className={getRiskLevelColor(overallRisk)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-github-text">
              {getRiskLevelText(overallRisk)}
            </span>
            <span className="ml-2 text-sm text-gray-600 dark:text-github-muted">
              ({overallRisk}/100)
            </span>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Critical Issues
            </h3>
            <div className="text-dashboard-error dark:text-github-danger">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-github-text">
              {vulnStats.critical}
            </span>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              High Priority
            </h3>
            <div className="text-dashboard-warning dark:text-github-warning">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-github-text">
              {vulnStats.high}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Repositories Scanned
            </h3>
            <div className="text-dashboard-info dark:text-github-info">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-github-text">
              {findings.length}
            </span>
          </div>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-github-muted mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-github-text mb-2">
            No security scans found
          </h3>
          <p className="text-gray-600 dark:text-github-muted">
            Run security scans on your repositories to see findings here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-github-text">
            Recent Findings
          </h3>
          
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="border border-gray-200 dark:border-github-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-github-bg transition-colors cursor-pointer"
              onClick={() => setSelectedFinding(finding)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 dark:text-github-text">
                    {finding.repositoryName}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelBg(finding.riskScore)} ${getRiskLevelColor(finding.riskScore)}`}>
                    {getRiskLevelText(finding.riskScore)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-github-muted">
                  <span>{finding.vulnerabilities.length} issues</span>
                  <span>•</span>
                  <span>{formatScanDate(finding.scanDate)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {finding.vulnerabilities.slice(0, 3).map((vuln, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={getSeverityColor(vuln.severity)}>
                      {getVulnerabilityIcon(vuln.type)}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-github-muted">
                      {vuln.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {finding.vulnerabilities.length > 3 && (
                  <span className="text-sm text-gray-500 dark:text-github-muted">
                    +{finding.vulnerabilities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedFinding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-github-surface rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text">
                  {selectedFinding.repositoryName} - Security Details
                </h3>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="text-gray-500 dark:text-github-muted hover:text-gray-700 dark:hover:text-github-text"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`px-3 py-1 rounded-full ${getRiskLevelBg(selectedFinding.riskScore)}`}>
                    <span className={`font-medium ${getRiskLevelColor(selectedFinding.riskScore)}`}>
                      {getRiskLevelText(selectedFinding.riskScore)} Risk ({selectedFinding.riskScore}/100)
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-github-muted">
                    Scanned {formatScanDate(selectedFinding.scanDate)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-github-text">
                  Vulnerabilities ({selectedFinding.vulnerabilities.length})
                </h4>
                
                {selectedFinding.vulnerabilities.map((vuln, index) => (
                  <div key={index} className="border border-gray-200 dark:border-github-border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className={getSeverityColor(vuln.severity)}>
                        {getVulnerabilityIcon(vuln.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(vuln.severity)} bg-opacity-10`}>
                            {vuln.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-github-muted">
                            {vuln.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <h5 className="font-medium text-gray-900 dark:text-github-text mb-1">
                          {vuln.description}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-github-muted mb-2">
                          Found in <code className="bg-gray-100 dark:bg-github-bg px-1 rounded">{vuln.file}</code> at line {vuln.line}
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          <h6 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Remediation Suggestion:
                          </h6>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {vuln.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}