---
name: release-manager
description: Manage semver version bumps, desktop packaging verification, Git tag lifecycle, and automated GitHub Actions release publishing for CodeMind.
---

# Release Manager Skill

This skill defines the step-by-step workflow for shipping updates and new versions of CodeMind to end users.

## Workflow

### 1. Pre-Release Verification
Run local automated checks to guarantee all tests pass and bundles compile without errors:
```bash
# 1. Run full test suite
npm run test

# 2. Build React renderer
npm run build:react

# 3. Build Electron main process
npm run build:electron
```

### 2. Semantic Version Bump
Update the version string across `package.json` manifests:
1. In `package.json` (root): update `"version": "x.y.z"`
2. In `desktop/electron/package.json`: update `"version": "x.y.z"`
3. In `backend/package.json`: update `"version": "x.y.z"`

### 3. Commit Changes Atomically
Commit the version bump with an atomic commit:
```bash
git add package.json desktop/electron/package.json backend/package.json
git commit -m "chore(release): bump version to x.y.z" -m "Update root, electron, and backend package versions for the v(x.y.z) production release."
git push origin main
```

### 4. Create and Push Version Tag
Tagging triggers `.github/workflows/release.yml` on GitHub Actions:
```bash
git tag vx.y.z
git push origin vx.y.z
```

### 5. Verify the Release
1. Monitor the GitHub Actions run: `https://github.com/symon9/code-mind/actions`
2. Verify all 3 distribution assets appear on GitHub Releases:
   - `CodeMind-Setup-x.y.z.exe`
   - `CodeMind-Setup-x.y.z.exe.blockmap`
   - `latest.yml`
3. Existing users will receive the update automatically via `electron-updater` upon application restart.
