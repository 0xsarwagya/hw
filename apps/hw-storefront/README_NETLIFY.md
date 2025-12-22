# Quick Netlify Deployment Guide

## Prerequisites

- Netlify account
- Backend API deployed at `https://hw.vcecom.vestcodes.co`
- Git repository connected

## Quick Deploy Steps

### 1. Install Dependencies

```bash
cd apps/hw-storefront
pnpm install
```

### 2. Create Netlify Site

**Option A: Via Dashboard**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure:
   - **Build command**: `pnpm --filter @vestcodes/vcecom-hw-storefront build`
   - **Publish directory**: `apps/hw-storefront/dist`
   - **Node version**: `20.x`

**Option B: Via CLI**
```bash
cd apps/hw-storefront
netlify init
# Follow prompts
```

### 3. Set Environment Variables

**Via Dashboard:**
- Go to Site Settings → Environment Variables
- Add:
  - `VITE_API_URL` = `https://hw.vcecom.vestcodes.co`
  - `VITE_RAZORPAY_KEY_ID` = `rzp_test_Rqng1P7pOzqaBf` (optional)

**Via CLI:**
```bash
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co"
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_Rqng1P7pOzqaBf"
```

### 4. Deploy

```bash
netlify deploy --prod
```

## Files Created

- ✅ `netlify.toml` - Netlify configuration
- ✅ `lib/env.ts` - Environment variable validation
- ✅ `NETLIFY_SETUP.md` - Detailed deployment guide
- ✅ `NETLIFY_ENV_VARS.md` - Environment variables documentation
- ✅ `vite.config.ts` - Updated with Netlify plugin
- ✅ `package.json` - Added `@netlify/vite-plugin`

## Important Notes

1. **SPA Routing**: The `netlify.toml` includes redirect rules for React Router
2. **Environment Variables**: Must be prefixed with `VITE_` to be available in the browser
3. **Build**: Uses `pnpm --filter` for monorepo builds
4. **Security**: Headers configured for security best practices

## Troubleshooting

- **Build fails**: Check Node.js version is 20.x
- **Routes 404**: Verify SPA redirects in `netlify.toml`
- **API errors**: Check `VITE_API_URL` and backend CORS settings

For detailed information, see:
- [NETLIFY_SETUP.md](./NETLIFY_SETUP.md) - Full deployment guide
- [NETLIFY_ENV_VARS.md](./NETLIFY_ENV_VARS.md) - Environment variables guide

