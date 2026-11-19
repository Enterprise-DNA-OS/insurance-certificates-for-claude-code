# Review retention purpose

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- retention-review <supplier> --due=YYYY-MM-DD --note=<purpose-and-decision> --actor=<person>
```

Read docs/compliance.md and the supplier file. Record the operator-approved reason for continued retention and a future review date. Do not automatically delete anything.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
