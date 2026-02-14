'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'

export default function Home() {
  const { data: session } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenModal = () => {
    setShowLoginModal(true)
  }

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      await signIn('github', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative">
      {/* Floating Sign In Button */}
      <div className="fixed top-6 right-6 z-50">
        {session ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-full transition-colors shadow-lg"
          >
            Dashboard
          </Link>
        ) : (
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-full transition-colors shadow-lg"
          >
            Sign In
          </button>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:py-32 sm:px-6">
        <div className="text-center max-w-4xl mx-auto">
          
          <div className="relative flex justify-center mb-6 sm:mb-8">
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-[8rem] sm:text-[12rem] md:text-[16rem] font-bold text-[#161b22] select-none pointer-events-none opacity-30"
                style={{ fontFamily: 'var(--font-fjalla-one)' }}
              >
                GitFort
              </span>
            </div>
            {/* Logo floating in front */}
            <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32">
              <Image
                src="/gitfort-logo.png"
                alt="GitFort Logo"
                width={128}
                height={128}
                className="rounded-2xl w-full h-full object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
            <span className="text-white">Automate your</span>
            <br />
            <span className="text-[#2ea043]">GitHub workflow</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#7d8590] mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
            Monitor repositories, track contributions, scan for vulnerabilities, 
            and optimize your development process with intelligent automation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
            {session ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-full transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Open Dashboard
              </Link>
            ) : (
              <button
                onClick={handleOpenModal}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-full transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Get Started
              </button>
            )}
            
            <a
              href="https://github.com/jinu721/gitfort"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-transparent hover:bg-[#21262d] text-[#7d8590] hover:text-white border border-[#30363d] hover:border-[#7d8590] text-sm font-medium rounded-full transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View Source
            </a>
          </div>
        </div>
      </main>
      {/* Features Section */}
      <div id="features" className="py-12 sm:py-16 border-t border-[#21262d]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
              Core Features
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                title: "Streak Monitoring",
                description: "Track contribution streaks with intelligent notifications and risk detection.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: "Security Scanning",
                description: "Automated vulnerability detection for secrets, API keys, and sensitive data.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: "Analytics Engine",
                description: "Deep insights with interactive charts, heatmaps, and performance metrics.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                title: "CI/CD Monitoring",
                description: "Pipeline health tracking with build success rates and failure analysis.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                title: "Smart Automation",
                description: "Automated maintenance tasks and repository optimization workflows.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                title: "Team Insights",
                description: "Collaboration metrics and team performance analytics for better productivity.",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div key={index} className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 sm:p-4 hover:border-[#238636] transition-all duration-300 group">
                <div className="flex items-center space-x-3 mb-2 sm:mb-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#238636]/10 rounded-md flex items-center justify-center text-[#2ea043] group-hover:bg-[#238636]/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-[#7d8590] text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-24 border-t border-[#21262d]">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
            Ready to get started?
          </h2>
          <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
            Join developers who use GitFort to monitor and optimize their GitHub repositories.
          </p>
          {!session && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-full transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Get Started Free
            </button>
          )}
        </div>
      </div>

      <footer className="border-t border-[#21262d] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-fjalla-one)' }}>GitFort</span>
            </div>
            <p className="text-[#7d8590] text-sm">
              © 2026 GitFort. Built for developers.
            </p>
          </div>
        </div>
      </footer>
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-fjalla-one)' }}>Sign in to GitFort</h3>
              <p className="text-[#7d8590] mb-8">Connect your GitHub account to get started</p>
              
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-2 px-4 rounded-full text-sm font-medium transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  'Continue with GitHub'
                )}
              </button>
              
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-[#7d8590] hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}