# Insurance Certificates for Claude Code: operating instructions

For internal procurement, facilities and insurance evidence reviewers. Business, operator and exact contractual requirements are supplied at installation. Demo records are fictional.

Read README.md and docs/compliance.md before making a coverage-related statement. Start every answer from current CLI data. Read before writing, show ambiguous candidates, and never invent evidence or an actor.

## One path for each job

| Request | Command |
|---|---|
| Supplier responsibility | /vendors |
| Contract requirements | /profiles |
| Recorded policies | /policies |
| Renewals due | /renewals-due |
| Evidence review queue | /review-queue |
| Coverage gaps | /requirements-check |
| Evidence and privacy checks | /compliance |
| Outstanding evidence | /attention |
| Weekly insurance evidence meeting | /weekly-review |
| Supplier file | /record |
| Review history | /history |
| Add requirement profile | /add-profile |
| Add required coverage | /add-rule |
| Add supplier | /add-vendor |
| Record policy evidence | /add-policy |
| Record evidence review | /review |
| Assign contract requirements | /assign-profile |
| Log a follow-up | /log |
| Review retention purpose | /retention-review |
| Import COISoftware records | /import |
| Export all records | /export |
| Draft evidence follow-up | /draft-renewal |
| Change fields or rules | /customise |
| Add a read-only report | /new-view |
| Generate paperwork | /documents |
| View this week | /view |

The recipes live in .claude/commands/. scripts/certificates.mjs is the only business CLI. Use --json for precise output and --actor on changes. Run help to list the commands. Quote arguments containing spaces.

## Rules

- Never send a message or issue insurance. Draft locally, show it in chat, and leave sending to the person.
- Never claim verified coverage from a certificate. Record checks met describes only the recorded fields.
- Preserve imported raw rows. A changed source row must be reviewed, not silently overwritten.
- Record renewals as new policies and reviews as append-only entries.
- Requirements come from the operator's contract. The seed's limits and schedules are fictional examples.
- No customer or secret data in commits. imports/, exports/, .data/, generated documents and drafts are ignored.
- No deletion without an explicit request. Retention review records a decision, not automatic disposal.
- The local database owner is privileged. Shared operation requires separately tested scoped access.
- Test every rule change on a disposable database before applying a new migration to real records.

## Files

supabase/migrations/ holds the schema. scripts/lib/db.mjs chooses local PGlite or DATABASE_URL Postgres. brand.json, documents.json and views.json define the read-only paperwork. docs/replace-coisoftware.md describes the mapped import and its limits.

Omni by Enterprise DNA installs, customises and operates this desk: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=coisoftware&utm_medium=instructions
