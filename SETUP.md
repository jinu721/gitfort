# GitFort Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd gitfort
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure GitHub OAuth (Required for Login)**
   - Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
   - Create a new OAuth App with:
     - **Application name**: GitFort
     - **Homepage URL**: `http://localhost:3000`
     - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local`:
     ```env
     GITHUB_CLIENT_ID=your_client_id_here
     GITHUB_CLIENT_SECRET=your_client_secret_here
     ```

4. **Generate Required Keys**
   ```bash
   # Generate NEXTAUTH_SECRET (32+ characters)
   openssl rand -base64 32
   
   # Generate ENCRYPTION_KEY (exactly 32 characters)
   openssl rand -hex 16
   ```

5. **Update .env.local**
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-generated-secret-here
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ENCRYPTION_KEY=your-32-character-encryption-key
   NODE_ENV=development
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Optional Configuration

### Database (MongoDB)
For full functionality, configure MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/gitfort
```

### Email Notifications
For email notifications:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Troubleshooting

### Login Not Working
1. **Check GitHub OAuth Configuration**
   - Ensure callback URL is exactly: `http://localhost:3000/api/auth/callback/github`
   - Verify Client ID and Secret are correct

2. **Check Environment Variables**
   - Ensure `.env.local` exists and has required variables
   - Restart development server after changing environment variables

3. **Check Console Errors**
   - Open browser developer tools
   - Look for authentication errors in console

### Common Issues

**"Configuration Error"**
- Missing or invalid GitHub OAuth credentials
- Check your `.env.local` file

**"Access Denied"**
- GitHub OAuth app not properly configured
- Check callback URL in GitHub settings

**"Verification Error"**
- NEXTAUTH_SECRET not set or too short
- Generate a new secret with `openssl rand -base64 32`

## Features Available

### ✅ Working Features
- GitHub OAuth authentication
- Responsive dashboard with dark/light theme
- Navigation between sections
- Landing page with proper branding

### 🔧 Requires Configuration
- Streak monitoring (needs GitHub API access)
- Security scanning (needs repository access)
- Analytics (needs GitHub API access)
- CI/CD monitoring (needs GitHub Actions access)
- Email notifications (needs SMTP configuration)
- Data persistence (needs MongoDB)

### 📋 Testing Checklist
1. ✅ Visit `http://localhost:3000`
2. ✅ Click "Sign In" or "Get Started"
3. ✅ Complete GitHub OAuth flow
4. ✅ Access dashboard
5. ✅ Navigate between sections
6. ✅ Toggle dark/light theme
7. ✅ Test responsive design

## Production Deployment

1. **Update Environment Variables**
   ```env
   NEXTAUTH_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. **Secure Secrets**
   - Use strong, unique secrets
   - Never commit secrets to version control

3. **Database**
   - Use MongoDB Atlas or similar cloud database
   - Configure proper connection string

4. **GitHub OAuth**
   - Update callback URL to production domain
   - May need separate OAuth app for production

## Support

If you encounter issues:
1. Check this setup guide
2. Review console errors
3. Verify environment configuration
4. Check GitHub OAuth app settings