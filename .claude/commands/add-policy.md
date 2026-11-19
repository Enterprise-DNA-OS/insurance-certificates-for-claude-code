---
description: "Record policy evidence"
---

# Record policy evidence

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- add-policy --code=<CODE> --vendor=<supplier> --coverage=<name> --number=<policy> --insurer=<name> --currency=NZD --limit=<amount> --effective=YYYY-MM-DD --expires=YYYY-MM-DD --evidence=<reference> --actor=<person>
```

Read the document. Add --additional-insured=true/false and --waiver=true/false only from checked evidence, otherwise omit for unknown. Record renewals under new codes. Never change an old row to impersonate renewal history.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
