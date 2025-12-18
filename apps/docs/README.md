# VCEcom Documentation

Docusaurus-based documentation site for the VCEcom ecommerce platform.

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Serve production build locally
pnpm serve
```

## Deployment

Documentation is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to `main` or `dev` branches.

Manual deployment:

```bash
pnpm deploy
```

## Structure

- `docs/` - Markdown documentation files
- `src/` - React components and pages
- `static/` - Static assets (images, etc.)
- `docusaurus.config.ts` - Docusaurus configuration

## Features

- Mermaid diagrams for flowcharts and architecture diagrams
- Versioning support (ready for v1.0.0)
- Search functionality
- Responsive design with dark mode
- GitHub Pages deployment
