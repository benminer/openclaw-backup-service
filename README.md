# openclaw-agent-dashboard

OpenClaw Agent Dashboard — REST API and web UI for backing up and restoring OpenClaw agent workspace files via Ampt storage.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (no auth) |
| POST | `/api/backup?label=default&fileCount=N&totalSize=N` | Get presigned upload URL |
| GET | `/api/backups?label=default` | List backups |
| GET | `/api/restore/:label/:timestamp` | Get presigned download URL |
| DELETE | `/api/backup/:label/:timestamp` | Delete a backup |

## Auth

All endpoints except `/api/health` require `Authorization: Bearer <API_KEY>` header.

Set the API key via Ampt params: `ampt params set API_KEY <your-key>`

## Usage

```bash
# Get upload URL
curl -X POST "https://your-app.ampt.app/api/backup?label=default&fileCount=42&totalSize=1024000" \
  -H "Authorization: Bearer YOUR_KEY"

# Upload the backup to the returned URL
curl -X PUT "<uploadUrl>" --data-binary @workspace.tar.gz -H "Content-Type: application/gzip"

# List backups
curl "https://your-app.ampt.app/api/backups" -H "Authorization: Bearer YOUR_KEY"

# Get download URL
curl "https://your-app.ampt.app/api/restore/default/2024-01-15T10-30-00-000Z" \
  -H "Authorization: Bearer YOUR_KEY"
```

## Development

```bash
npm install
npx ampt
```
