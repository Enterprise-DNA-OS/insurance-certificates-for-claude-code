# Record evidence review

Read CLAUDE.md. Start from current records.

```bash
npm run certificates -- review <policy-code> --verdict=verified --evidence=<reviewed-document> --note=<finding> --actor=<person>
```

A person supplies the actual review. Read the policy, schedule and required endorsements. Use rejected when evidence fails. Never auto-verify an import or equate a certificate tick-box with an endorsement. Present requirements-check afterward.

Use --json when checking exact values. Never invent a source document, review, actor or command result.
