---
description: "Export all records"
---

# Export all records

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- export <new-file.json>
```

Write to ignored exports/ and ensure the destination parent exists. Never overwrite. The snapshot contains private source payloads and history. It is not an automatic restoration backup.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
