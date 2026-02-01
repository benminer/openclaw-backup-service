# OpenClaw Agent Dashboard - Developer Guide

A REST API and web dashboard running on Ampt that backs up and restores OpenClaw agent workspace files to @ampt/storage (S3 wrapper). Enables migrating an agent to a new server by pulling down backups.

## Reference Implementation

When stuck on Ampt patterns (SPA routing, static files, storage, etc.), reference **~/eva-apps/thefrontrow** -- it uses the same stack (Ampt + React + Express) and has working examples of common patterns.

## Architecture & Tech Stack

- **Platform**: Ampt (serverless AWS abstractions)
- **Runtime**: Node.js 22 with TypeScript
- **Framework**: Express v5
- **Storage**: Ampt Storage (S3 wrapper)
- **Auth**: Bearer token via Ampt params
- **Linter/Formatter**: Biome
- **Logging**: Pino + Morgan

## Project Structure

```
backend/
├── index.ts                 # Main entry, Express app
├── routes/
│   └── backup.ts            # All backup/restore endpoints
├── middleware/
│   └── auth.ts              # Bearer token auth
└── tsconfig.json            # With @/ path aliases
```

No frontend -- API only.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Health check |
| GET | /api/stats | Read | Backup stats (totals, labels, latest) |
| POST | /api/backup | Write | Get presigned upload URL (auto-prunes old backups) |
| POST | /api/backup/prune | Write | Manually prune old backups for a label |
| GET | /api/backups | Read | List all backups |
| GET | /api/restore/:label/:timestamp | Read | Get presigned download URL |
| DELETE | /api/backup/:label/:timestamp | Write | Delete a backup |

Presigned URLs are used for upload/download to avoid the 6MB API payload limit.

## Ampt Platform Specifics

### Running the Dev Server

**CRITICAL**: You must source the .env file first to set your AMPT_API_KEY:

```bash
cd ~/eva-apps/openclaw-agent-dashboard
source .env
ampt
```

This starts the Ampt dev server which **syncs live** -- code changes are pushed to your sandbox automatically. You can:
- Make code changes and they deploy instantly
- Check logs in the terminal
- Hit the live sandbox API directly via curl/fetch
- Run `ampt logs` for real-time log streaming

### Environment Variables (Ampt Params)

```typescript
import { params } from '@ampt/sdk'

const apiKey = params('BACKUP_API_KEY')  // Auth token for API access
```

Set params in the Ampt dashboard or via CLI: `ampt params set BACKUP_API_KEY <value>`

### Storage Patterns

```typescript
import { storage } from '@ampt/sdk'

const backups = storage('backups')

// Write
await backups.write('/default/2026-01-31T17:00:00Z.tar.gz', buffer, {
  metadata: { label: 'default', createdAt: '...', fileCount: 42 }
})

// Read
const data = await backups.read('/path/file.tar.gz', { buffer: true })

// List (async generator)
const list = await backups.list('/default/', { recursive: true })

// Presigned URLs (for >6MB files)
const uploadUrl = await backups.getUploadUrl('/path/file.tar.gz')
const downloadUrl = await backups.getDownloadUrl('/path/file.tar.gz')

// Delete
await backups.remove('/path/file.tar.gz')

// File info
const { lastModified, size, metadata } = await backups.stat('/path/file.tar.gz')
```

### Local Script Execution

```bash
AMPT_STAGE=prod ampt run ./backend/scripts/my-script.ts
```

## Code Style & Standards

### Biome Configuration

- **Indentation**: 2 spaces
- **Line width**: 120 characters
- **Quotes**: Single quotes
- **Semicolons**: No (ASI)
- **Trailing commas**: None
- **Arrow parens**: Always

### TypeScript Conventions

- Always use arrow functions
- Variables/functions: `camelCase`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Import Organization

```typescript
// 1. External dependencies
import { storage, params } from '@ampt/sdk'
import express from 'express'

// 2. Internal aliases
import { authMiddleware } from '@/middleware/auth'

// 3. Relative imports
import { backupRouter } from './routes/backup'
```

### Dependency Management

Frontend dependencies (React, react-router-dom, react-markdown, etc.) go in `devDependencies`, NOT `dependencies`. Vite bundles them at build time so they don't need to be in the production node_modules. Only backend runtime deps (express, @ampt/sdk, etc.) go in `dependencies`.

### Import Path Aliases

Backend uses `@/` alias:
- `@/*` → `backend/*`

### Commenting Guidelines

Keep comments minimal. Only for:
1. TODO items
2. Strange edge cases / workarounds
3. Complex business logic not obvious from code

Never restate what the code does.

## Development Workflow

### Making Changes

1. Start the dev server (`source .env && ampt`)
2. Edit code -- changes sync live to your sandbox
3. Test endpoints against the sandbox URL
4. Check logs in the ampt terminal
5. Run `npm run biome:check` before committing
6. Run `npm run typecheck` to verify types

### Before Committing

```bash
npm run typecheck && npm run biome:check
```

### Deployment

```bash
ampt deploy          # Deploy to default stage
ampt deploy --name prod  # Deploy to production
```

### Ampt Feedback Loop

When you encounter friction, bugs, or UX issues with the Ampt platform while developing, create a Linear task on **Ben's Personal board** (`BENS_LINEAR_KEY`) tagged with `ampt-feedback`. Focus on the **WHY** -- what were you trying to do, what went wrong, and why it matters for AI agent developers. This is first-hand feedback to improve Ampt.

### Auto-Deploy Policy

**Deploy to prod freely** after code review is complete and all feedback has been addressed. No need to ask -- just ship it.

### Linting & Formatting

```bash
npm run biome:check          # Check backend
npm run biome:check:fix      # Auto-fix issues
npm run biome:format         # Format all files
```

## Testing the API

```bash
# Health check
curl https://<sandbox-url>/api/health

# Get upload URL
curl -X POST https://<sandbox-url>/api/backup \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"label": "default"}'

# List backups
curl https://<sandbox-url>/api/backups \
  -H "Authorization: Bearer <api-key>"

# Get download URL
curl https://<sandbox-url>/api/restore/default/2026-01-31T17:00:00Z \
  -H "Authorization: Bearer <api-key>"
```

## Key Design Decisions

### Why Presigned URLs?

Ampt has a 6MB API payload limit. Agent workspaces can exceed this. Presigned URLs let the client upload/download directly to S3, bypassing the limit.

### Why Labels?

Supports multiple agents backing up to the same service. Each agent uses a unique label (defaults to "default").

### Why tar.gz?

Single-file transfer is simpler and more reliable than multi-file APIs. The client tars up the workspace before upload and untars after download.
