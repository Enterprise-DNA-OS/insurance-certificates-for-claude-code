# Add requirement profile

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- add-profile --code=<CODE> --name=<name> --contract=<reference> --actor=<person>
```

Read the operator-provided contract first. Record its reference. Add individual coverage rules through add-rule.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
