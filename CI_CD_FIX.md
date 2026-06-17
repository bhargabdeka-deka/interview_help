# CI/CD Issue Fix - GitHub Actions npm Cache Configuration

## 🔴 Issue Fixed

**Error**: `Dependencies lock file is not found in /home/runner/work/one-one-interview-platform/one-one-interview-platform. Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock`

**Root Cause**: GitHub Actions workflow was using `cache: 'npm'` without specifying the correct cache dependency path for the frontend subdirectory.

## ✅ Solution Applied

Updated `.github/workflows/tests.yml` to include:

```yaml
cache-dependency-path: 'frontend/package-lock.json'
```

This tells GitHub Actions exactly where to find the package-lock.json file for caching.

## 📝 Changes Made

### File: `.github/workflows/tests.yml`

**Before:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
```

**After:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: 'frontend/package-lock.json'
```

## 🚀 Next Steps

1. **Create GitHub Repository** (if not done yet):
   - Go to https://github.com/new
   - Repository name: `one-one-interview-platform`
   - Make it Public
   - Don't initialize with README

2. **Authenticate with GitHub**:
   ```bash
   # Using GitHub CLI (recommended)
   gh auth login
   
   # Or generate Personal Access Token
   # https://github.com/settings/tokens (click "Generate new token")
   ```

3. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

4. **Verify GitHub Actions**:
   - Go to your repository
   - Click "Actions" tab
   - Verify all workflows pass ✅

## 📋 All Workflow Files

### 1. `.github/workflows/tests.yml` ✅ FIXED
- Lints frontend (ESLint)
- Type checks frontend (TypeScript)
- Lints backend (Go vet)
- Builds backend

### 2. `.github/workflows/deploy-frontend.yml`
- Deploys to Vercel on push to main
- Requires secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_FRONTEND`

### 3. `.github/workflows/deploy-backend.yml`
- Deploys to Railway on push to main
- Requires secrets: `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`

## 🔐 GitHub Secrets Setup

To enable deployments, add these secrets to your GitHub repository:

**Go to**: Settings → Secrets and variables → Actions → New repository secret

### For Vercel Deployment:
1. `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
2. `VERCEL_ORG_ID` - Your Vercel organization ID
3. `VERCEL_PROJECT_ID_FRONTEND` - Frontend project ID

### For Railway Deployment:
1. `RAILWAY_TOKEN` - Get from https://railway.app/account/tokens
2. `RAILWAY_PROJECT_ID` - Your Railway project ID

## ✨ Benefits of This Fix

✅ GitHub Actions can now find package-lock.json in subdirectory
✅ npm cache works correctly
✅ CI/CD pipeline will no longer fail with missing lock file error
✅ Faster CI/CD runs (npm dependencies are cached)
✅ Consistent dependency resolution

## 📊 Workflow Status

After push to GitHub:
- **Tests job**: Runs linting and type checks ✅
- **Deploy Frontend**: Deploys to Vercel on success (requires setup) 🔄
- **Deploy Backend**: Deploys to Railway on success (requires setup) 🔄

## 🔗 References

- [GitHub Actions Node.js Setup](https://github.com/actions/setup-node)
- [npm ci Documentation](https://docs.npmjs.com/cli/v8/commands/npm-ci)
- [GitHub Actions Caching](https://github.com/actions/setup-node#caching-packages-dependencies)
