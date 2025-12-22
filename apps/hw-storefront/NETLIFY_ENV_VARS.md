# Netlify Environment Variables for HW Storefront

## Required Environment Variables

### `VITE_API_URL` (Required)

**Description**: Backend API URL used by the storefront to make API calls. This must be publicly accessible and properly configured for CORS.

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

**How to Set in Netlify**:
1. Go to Site Settings → Environment Variables
2. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend API URL (e.g., `https://hw.vcecom.vestcodes.co`)
   - **Scopes**: Select Production, Deploy Previews, and Branch Deploys
3. Click "Save"

**Via Netlify CLI**:
```bash
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co"
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context production
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context deploy-preview
```

## Optional Environment Variables

### `VITE_RAZORPAY_KEY_ID` (Optional)

**Description**: Razorpay public key ID for payment processing. This is safe to expose in the browser as it's a public key.

**When to Use**: Required if you want to enable Razorpay payments in the storefront.

**Format**: Razorpay key ID format (e.g., `rzp_test_...` or `rzp_live_...`)

**Examples**:
- Test: `rzp_test_Rqng1P7pOzqaBf`
- Production: `rzp_live_YourProductionKeyId`

**Security Note**: This is a public key and can be safely exposed in client-side code. Never use the secret key here.

**How to Set in Netlify**:
```bash
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_Rqng1P7pOzqaBf"
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_live_YourProductionKey" --context production
```

## Environment Variable Validation

The app includes runtime validation that:

1. **Checks for required variables** when the app runs in production
2. **Validates URL format** to ensure proper configuration
3. **Provides clear error messages** if variables are missing or invalid

### Validation Behavior

- **Development**: Uses fallback values if env vars are not set
- **Production**: Validates and throws errors if required vars are missing

### Validation Errors

If you see errors like:

```
Missing required environment variable: VITE_API_URL
```

**Solution**: Add the variable in Netlify site settings.

If you see errors like:

```
Invalid VITE_API_URL format: "invalid-url"
```

**Solution**: Ensure the URL starts with `http://` or `https://` and includes a valid hostname.

## Setting Variables for Different Environments

### Production

```bash
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context production
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_live_YourProductionKey" --context production
```

### Deploy Previews

```bash
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context deploy-preview
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_Rqng1P7pOzqaBf" --context deploy-preview
```

### Branch Deploys

```bash
netlify env:set VITE_API_URL "https://hw.vcecom.vestcodes.co" --context branch-deploy
netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_Rqng1P7pOzqaBf" --context branch-deploy
```

## Testing Environment Variables

After setting environment variables in Netlify:

1. **Redeploy** your application (variables are only available after redeployment)
2. **Check build logs** for any errors
3. **Test the application** to ensure API calls work correctly
4. **Check browser console** for any runtime errors

## Security Notes

- `VITE_*` variables are **exposed to the browser** - never include secrets
- Only use public keys/IDs in `VITE_*` variables
- Ensure your backend API has proper CORS configuration for your Netlify domain
- `VITE_RAZORPAY_KEY_ID` is safe to expose (it's a public key)

## Troubleshooting

### Variable Not Available After Setting

- Variables are only available after redeployment
- Ensure the variable is set for the correct environment (Production/Deploy Preview/Branch Deploy)
- Check that the variable name matches exactly (case-sensitive)
- Variables prefixed with `VITE_` are available in the browser

### API Calls Fail

- Verify `VITE_API_URL` points to the correct backend
- Check backend CORS configuration allows your Netlify domain
- Ensure backend is accessible from the internet (not localhost)
- Check browser console for CORS errors

### Build Fails

- Check build logs for specific errors
- Ensure required variables are set in Netlify
- Verify URL format matches requirements
- Check that pnpm and Node.js are properly configured

### Routes Return 404

- Ensure SPA redirect rule is configured in `netlify.toml`
- Verify `publish` directory is set to `apps/hw-storefront/dist`
- Check that `index.html` exists in the dist directory

## Viewing Environment Variables

**Via Netlify CLI**:
```bash
# List all environment variables
netlify env:list

# View specific variable
netlify env:get VITE_API_URL
```

**Via Netlify Dashboard**:
1. Go to Site Settings → Environment Variables
2. View all variables and their scopes

