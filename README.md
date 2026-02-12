# GitHub Control Center

A comprehensive dashboard application that provides developers with advanced monitoring, analytics, and security scanning capabilities for their GitHub repositories.

## Features

- **Streak Monitor**: Track GitHub contribution streaks automatically
- **Security Scanner**: Automated security vulnerability scanning for repositories
- **Analytics**: Comprehensive analytics and visualization of GitHub activity
- **CI/CD Monitor**: Monitor CI/CD pipeline health across repositories

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React Server Components
- **Styling**: TailwindCSS with responsive design
- **Authentication**: NextAuth.js with GitHub OAuth
- **Database**: MongoDB with Mongoose ODM
- **APIs**: GitHub REST API v4 and GraphQL API v4

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout component
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
```

## Development

This project follows ultra-atomic commit practices for precise version control and easy rollback capabilities.

## License

This project is private and proprietary.