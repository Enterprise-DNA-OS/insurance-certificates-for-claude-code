# Import COISoftware records

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- import coisoftware <csv> --mapping=<map.json> --actor=<person> --dry-run
```

Read docs/replace-coisoftware.md first. Inspect real headers, map stable codes, and test a sample. Show counts before committing the authorised import without --dry-run. Vendor-only imports do not contain policy history. Preserve evidence separately. Reconcile totals and keep all imported policies unreviewed.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
