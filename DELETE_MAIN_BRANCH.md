# Delete Main Branch from GitHub

Since `main` is currently the default branch on GitHub, you need to change the default branch first before deleting it.

## Steps to Delete Main Branch

### 1. Change Default Branch to Dev

1. Go to your GitHub repository: https://github.com/Vestcodes/vcecom
2. Click on **Settings** (top right of the repository)
3. In the left sidebar, click on **Branches**
4. Under **Default branch**, click the **switch/edit icon** (pencil icon)
5. Select **`dev`** from the dropdown
6. Click **Update**
7. Confirm the change in the popup

### 2. Delete Main Branch from GitHub

After changing the default branch, you can delete `main`:

```bash
git push origin --delete main
```

Or delete it directly from GitHub:
1. Go to the repository
2. Click on **Branches** (or go to `https://github.com/Vestcodes/vcecom/branches`)
3. Find the `main` branch
4. Click the trash icon to delete it

## Current Branch Structure

After deletion, you'll have:
- **dev** - Development branch (default, no releases)
- **beta** - Beta releases
- **prod** - Production releases

## Note

The local `main` branch has already been deleted. Once you delete it from GitHub, the repository will only have `dev`, `beta`, and `prod` branches.

