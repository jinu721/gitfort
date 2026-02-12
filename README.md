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

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values:
   - **GitHub OAuth**: Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/applications/new)
   - **MongoDB**: Create a MongoDB Atlas cluster at [MongoDB Cloud](https://cloud.mongodb.com/)
   - **SMTP**: Configure email service (Gmail App Password recommended)
   - **Secrets**: Generate secure keys using `openssl rand -base64 32` and `openssl rand -hex 16`

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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