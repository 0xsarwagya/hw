# Vercel Deployment Setup Guide

This guide explains how to set up GitHub Actions to deploy `apps/hw-storefront` and `apps/admin` to Vercel.

## Prerequisites

1. Vercel account with access to your organization
2. GitHub repository with Actions enabled
3. Both apps already linked to Vercel projects

## Required GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### 1. VERCEL_TOKEN
- **Description**: Vercel API token for authentication
- **How to get**: 
  1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
  2. Create a new token
  3. Copy the token value
- **Required**: Yes

### 2. VERCEL_ORG_ID
- **Description**: Your Vercel organization/team ID
- **How to get**:
  1. Go to [Vercel Team Settings](https://vercel.com/teams)
  2. Select your team
  3. The Team ID is in the URL or Settings → General
- **Required**: Yes

### 3. VERCEL_PROJECT_ID_HW_STOREFRONT
- **Description**: Vercel project ID for hw-storefront app
- **How to get**:
  1. Go to your hw-storefront project in Vercel
  2. Go to Settings → General
  3. Copy the "Project ID"
- **Required**: Yes

### 4. VERCEL_PROJECT_ID_ADMIN
- **Description**: Vercel project ID for admin app
- **How to get**:
  1. Go to your admin project in Vercel
  2. Go to Settings → General
  3. Copy the "Project ID"
- **Required**: Yes

## Setup Steps

### 1. Link Projects to Vercel (One-time setup)

Run these commands locally to link your projects:

```bash
# Link hw-storefront
cd apps/hw-storefront
vercel link

# Link admin
cd ../admin
vercel link
```

This creates `.vercel` directories with project configuration.

### 2. Configure Vercel Projects

Ensure both projects in Vercel are configured correctly:

**HW Storefront:**
- Framework: Next.js
- Root Directory: `apps/hw-storefront`
- Build Command: `cd ../.. && pnpm --filter @vestcodes/vcecom-hw-storefront build`
- Output Directory: `.next`
- Install Command: `cd ../.. && pnpm install`

**Admin:**
- Framework: Next.js
- Root Directory: `apps/admin`
- Build Command: `cd ../.. && pnpm --filter @vestcodes/vcecom-admin build`
- Output Directory: `.next`
- Install Command: `cd ../.. && pnpm install`

### 3. Add GitHub Secrets

Add all required secrets to your GitHub repository as described above.

### 4. Push and Test

Push your changes to trigger the workflow:

```bash
git add .
git commit -m "Add Vercel deployment workflow"
git push
```

The workflow will:
- Run on pushes to `main`/`master` (production deployments)
- Run on pull requests (preview deployments)
- Only deploy apps that have changed (via Turborepo)
- Post deployment URLs as PR comments

## How It Works

1. **Change Detection**: Turborepo detects which apps have changed
2. **Build**: Each changed app runs `vercel build` to create `.vercel/output`
3. **Deploy**: Each app runs `vercel deploy --prebuilt` to deploy the build
4. **Caching**: Builds and deployments are cached for faster subsequent runs
5. **PR Comments**: Deployment URLs are automatically posted to pull requests

## Environment Variables

Environment variables should be configured in Vercel dashboard for each project:
- Production environment variables
- Preview environment variables
- Development environment variables (if needed)

The workflow uses `VERCEL_ENV` to distinguish between:
- `production`: Main/master branch deployments
- `preview`: Pull request deployments

## Troubleshooting

### Build Fails
- Check that all dependencies are installed correctly
- Verify build commands in `package.json` are correct
- Check Vercel project settings match the configuration

### Deployment Fails
- Verify `VERCEL_TOKEN` is valid and has correct permissions
- Check that project IDs are correct
- Ensure projects are linked correctly (`.vercel` directories exist)

### No Deployment Created
- This is normal if no changes were detected in the app
- Turborepo skips unchanged apps for efficiency
- Check the workflow logs to see which apps were processed

## References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

