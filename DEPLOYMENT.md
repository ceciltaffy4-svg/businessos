# Business OS — Deployment Checklist

## Prerequisites

- [ ] Node.js >= 18
- [ ] npm >= 9
- [ ] Windows SDK (for native modules)
- [ ] Ollama (optional, for AI features)

## Build Steps

```bash
# 1. Install dependencies
npm install

# 2. Rebuild native modules for Electron
npm run postinstall

# 3. Generate installer assets
node resources/generate-icons.js

# 4. Build the application
npm run build

# 5. Create Windows installer
npm run dist:win
```

## Installer Configuration

| Setting | Value |
|---------|-------|
| App ID | `com.businessos.app` |
| Product Name | Business OS |
| Installer | NSIS (x64) |
| Install Mode | Per-user (default), per-machine option |
| Desktop Shortcut | Created |
| Auto-start | No |
| Auto-update channel | `latest` |

## Post-Install Verification

- [ ] App launches without console errors
- [ ] Database initializes (check `%APPDATA%/business-os/data.db`)
- [ ] WAL mode is active
- [ ] Seed data loads (default products, customers, etc.)
- [ ] POS terminal opens and processes a test sale
- [ ] Dashboard displays analytics
- [ ] AI Assistant connects to Ollama (if running)
- [ ] Backup runs (check `%APPDATA%/business-os/backups/`)
- [ ] License activation works (Settings → License)
- [ ] Update check works (Settings → Updates)

## Windows Installer Signing

To enable code signing, add to `electron-builder.yml`:

```yaml
win:
  certificateFile: ./certs/cert.p12
  certificatePassword: <password>
  signDlls: true
```

Or sign the generated installer afterward:

```bash
signtool sign /fd SHA256 /a /f cert.p12 /p <password> /tr http://timestamp.digicert.com dist/Business\ OS-1.0.0-setup-x64.exe
```

## Update Server Setup

1. Host the update files on a static server or S3 bucket
2. Configure the URL in `electron-builder.yml` under `publish.provider`
3. Build with `npm run publish` to upload artifacts

### Update Server Directory Structure

```
updates.businessos.app/
  latest.yml              # metadata for current release
  Business OS-1.0.0-setup-x64.exe
  Business OS-1.0.0-setup-x64.exe.blockmap
```

Update files are generated automatically by `npm run dist`.

## Release Process

```bash
# 1. Bump version
npm version patch   # or minor / major

# 2. Build and package
npm run release

# 3. Test the installer
# Install on a clean Windows VM

# 4. Publish update
npm run publish
```

## Rollback Plan

- Keep previous installer executables in the update server
- Update `latest.yml` to point to the previous version
- Users who haven't updated will get the previous version on next check
- Users who already updated must manually reinstall

## Database Backup

The app automatically backs up the database daily to `%APPDATA%/business-os/backups/`.
Backups older than 30 days are automatically cleaned up.

### Manual Backup

- Via Automation: `window.api.automation.backup()`
- Via File: Copy `%APPDATA%/business-os/data.db` to a safe location

## Data Directory

```
%APPDATA%/business-os/
  data.db                 # SQLite database (WAL mode)
  data.db-wal             # WAL journal
  data.db-shm             # Shared memory file
  backups/
    business-os-2026-01-01.zip
    ...
  logs/                   # Application logs (future)
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Check `%APPDATA%/business-os/` for corruption; delete `data.db` to reset |
| better-sqlite3 errors | Run `npm run postinstall` to rebuild native module |
| Blank white screen | Check DevTools console; ensure preload.js loads |
| AI not connecting | Install Ollama from https://ollama.ai and pull a model (`ollama pull llama3.2`) |
| Updates not showing | Verify update server URL and `latest.yml` exist |
| License activation fails | Ensure machine ID is stable; contact support for a new key |

## Support

- Email: ceciltaffy4@gmail.com

