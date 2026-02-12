export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50 dark:bg-github-bg">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 dark:border-github-border bg-gradient-to-b from-zinc-200 dark:from-github-surface pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border dashboard-card lg:p-4">
          GitHub Control Center
        </p>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-github-text">
          Personal GitHub Control Center
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left gap-4">
        <div className="dashboard-card group px-5 py-4 transition-colors hover:border-dashboard-primary hover:bg-gray-50 dark:hover:bg-github-surface">
          <h2 className="mb-3 text-2xl font-semibold text-dashboard-success">
            Streak Monitor
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-gray-600 dark:text-github-muted">
            Track your GitHub contribution streaks automatically
          </p>
        </div>

        <div className="dashboard-card group px-5 py-4 transition-colors hover:border-dashboard-warning hover:bg-gray-50 dark:hover:bg-github-surface">
          <h2 className="mb-3 text-2xl font-semibold text-dashboard-warning">
            Security Scanner
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-gray-600 dark:text-github-muted">
            Automated security vulnerability scanning for repositories
          </p>
        </div>

        <div className="dashboard-card group px-5 py-4 transition-colors hover:border-dashboard-info hover:bg-gray-50 dark:hover:bg-github-surface">
          <h2 className="mb-3 text-2xl font-semibold text-dashboard-info">
            Analytics
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-gray-600 dark:text-github-muted">
            Comprehensive analytics and visualization of GitHub activity
          </p>
        </div>

        <div className="dashboard-card group px-5 py-4 transition-colors hover:border-dashboard-primary hover:bg-gray-50 dark:hover:bg-github-surface">
          <h2 className="mb-3 text-2xl font-semibold text-dashboard-primary">
            CI/CD Monitor
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-gray-600 dark:text-github-muted">
            Monitor CI/CD pipeline health across repositories
          </p>
        </div>
      </div>
    </main>
  );
}