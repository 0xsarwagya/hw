# Netlify Deployment Setup for HW Storefront

This guide covers deploying the HW Storefront (Vite + React) app to Netlify with proper environment variable configuration.

## Prerequisites

- Netlify account
- Backend API deployed and accessible
- Domain configured (optional)

## Quick Setup

### 1. Install Netlify Vite Plugin

The `@netlify/vite-plugin` is already added to `vite.config.ts`. If you need to install it:

```bash
cd apps/hw-storefront
pnpm add -D @netlify/vite-plugin
```

### 2. Connect Repository to Netlify

**Via Netlify Dashboard:**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Base directory**: Leave empty (root of repo) or set to `apps/hw-storefront` if deploying separately
   - **Build command**: `pnpm --filter @vestcodes/vcecom-hw-storefront build`
   - **Publish directory**: `apps/hw-storefront/dist`
   - **Node version**: `20.x`

**Via Netlify CLI:**
```bash
cd apps/hw-storefront
netlify init
# Follow prompts to link/create project
# When asked for build command: pnpm --filter @vestcodes/vcecom-hw-storefront build
# When asked for publish directory: apps/hw-storefront/dist
```

### 3. Configure Environment Variables

**Via Netlify Dashboard:**
1. Go to Site Settings → Environment Variables
2. Add the following variables:

**Required:**
- `VITE_API_URL` = `https://hw.vcecom.vestcodes.co`

**Optional:**
- `VITE_RAZORPAY_KEY_ID` = `rzp_test_Rqng1P7pOzqaBf` (or your production key)

**Via Netlify CLI:**
```bash
cd apps/hw-storefront
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co"
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_Rqng1P7pOzqaBf"
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context production
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context deploy-preview
```

### 4. Deploy

**Via Netlify Dashboard:**
- Push to your repository - Netlify will auto-deploy

**Via Netlify CLI:**
```bash
cd apps/hw-storefront
# Deploy to production
netlify deploy --prod

# Or deploy a preview
netlify deploy
```

## Configuration Files

### `netlify.toml`

The `netlify.toml` file is configured with:
- Build command for monorepo
- Publish directory
- SPA redirects (required for React Router)
- Security headers
- Cache headers for static assets

### `vite.config.ts`

The Vite config includes:
- `@netlify/vite-plugin` for Netlify platform primitives
- React plugin
- Build optimizations
- Path aliases

## Environment Variables

### Required Variables

#### `VITE_API_URL` (Required)

**Description**: Backend API URL used by the storefront to make API calls.

**Format**: Must be a valid HTTP/HTTPS URL

**Examples**:
- Production: `https://hw.vcecom.vestcodes.co`
- Staging: `https://staging-api.vcecom.vestcodes.co`
- Development: `http://localhost:3001`

**Validation**:
- ✅ Must start with `http://` or `https://`
- ✅ Must include a valid hostname
- ❌ Cannot be empty in production
- ❌ Cannot be a relative URL

### Optional Variables

#### `VITE_RAZORPAY_KEY_ID` (Optional)

**Description**: Razorpay public key ID for payment processing. This is safe to expose in the browser.

**Example**: `rzp_test_Rqng1P7pOzqaBf` (test) or `rzp_live_...` (production)

**Note**: This is a public key and can be safely exposed in client-side code.

## SPA Configuration

The storefront is a Single Page Application (SPA) using React Router. The `netlify.toml` includes a redirect rule to serve `index.html` for all routes:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures React Router can handle client-side routing correctly.

## Security Headers

The configuration includes security headers:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` - Allows embedding in same origin
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

## Caching Strategy

- **Static assets** (`/assets/*`): Cached for 1 year (immutable)
- **HTML files**: Not cached (always fresh)
- **Other files**: Default Netlify caching

## Troubleshooting

### Build Fails

- Ensure `pnpm` is available in Netlify build environment
- Check that build command matches monorepo structure
- Verify Node.js version is set to 20.x

### API Calls Fail

- Verify `VITE_API_URL` points to the correct backend
- Check backend CORS configuration allows your Netlify domain
- Ensure backend is accessible from the internet (not localhost)
- Check browser console for CORS errors

### Routes Return 404

- Ensure the SPA redirect rule is in `netlify.toml`
- Verify `publish` directory is set to `apps/hw-storefront/dist`
- Check that `index.html` exists in the dist directory

### Environment Variable Not Available

- Variables prefixed with `VITE_` are available in the browser
- Ensure variables are set in Netlify site settings
- Redeploy after adding/changing variables
- Check that variable names match exactly (case-sensitive)

## Custom Domain

To add a custom domain:

1. Go to Site Settings → Domain management
2. Add your domain (e.g., `storefront.vcecom.vestcodes.co`)
3. Follow DNS configuration instructions
4. Update `VITE_API_URL` if needed

## Local Development with Netlify Plugin

The `@netlify/vite-plugin` provides Netlify platform primitives in your local dev server:

```bash
cd apps/hw-storefront
pnpm dev
```

This gives you access to:
- Serverless functions
- Edge functions
- Blobs
- Cache API
- Image CDN
- Redirects & rewrites
- Headers
- Environment variables

## Monitoring

- Check Netlify deploy logs for build errors
- Monitor function logs for runtime errors
- Use Netlify Analytics for performance monitoring
- Check browser console for client-side errors

## Additional Resources

- [Netlify Vite Documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Netlify Vite Plugin](https://www.npmjs.com/package/@netlify/vite-plugin)
- [Vite Documentation](https://vitejs.dev/)

