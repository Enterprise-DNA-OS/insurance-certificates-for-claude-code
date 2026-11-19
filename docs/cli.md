# CLI reference

Use npm run certificates -- <command>. Reads are human tables by default; --json returns complete machine-readable values. Long human cells are truncated to 65 characters; inspect JSON before acting on a finding. Match suppliers by code, case-insensitive exact name or partial identifier. Ambiguity lists candidates and exits 1.

Mutations need --actor. Unrecognised flags fail. Values containing spaces need shell quotes. Commands and recipes:

## Supplier responsibility

`vendors`

Show the supplier, assigned owner, requirement profile and evidence workload.

## Contract requirements

`profiles`

Read the contract reference and explain each required cover and currency. Do not invent statutory limits.

## Recorded policies

`policies`

List recorded policy periods and limits. A record is not confirmation that a loss is covered.

## Renewals due

`renewals-due`

Show expired records and the next 60 days. Old policies stay visible after renewal. Cross-check requirements-check before saying a supplier lacks current evidence.

## Evidence review queue

`review-queue`

List unreviewed, rejected and changed documents. Read the original policy and endorsements before proposing a review.

## Coverage gaps

`requirements-check`

Explain missing requirements, cover, currency mismatches, low limits and unconfirmed endorsements. Record checks met is not a coverage decision. Use --on=YYYY-MM-DD only for current evidence evaluated at another date, never historical knowledge.

## Evidence and privacy checks

`compliance`

Read docs/compliance.md. Report contract evidence gaps and retention reviews. Separate internal schedules from legal obligations.

## Outstanding evidence

`attention`

Name each supplier, gap and responsible owner, then list stale follow-ups. Do not send reminders.

## Weekly insurance evidence meeting

`weekly-review`

Run requirements-check, renewals-due and compliance as well. Summarise blockers, near renewals, reviewer workload and records needing a retention-purpose decision.

## Supplier file

`record <supplier>`

Read policies and history together. Use the exact code or unambiguous name from vendors. If ambiguous, show candidates and ask.

## Review history

`history`

Show the recorded actor, timestamp and evidence reference. Do not imply a cryptographic audit log or historical state reconstruction.

## Add requirement profile

`add-profile --code=<CODE> --name=<name> --contract=<reference> --actor=<person>`

Read the operator-provided contract first. Record its reference. Add individual coverage rules through add-rule.

## Add required coverage

`add-rule --profile=<code> --coverage=<name> --currency=NZD --minimum=<amount> --actor=<person>`

Read profiles and the source contract. Use --additional-insured=true or --waiver=true only when required. Thresholds are contractual, not invented law. Quote flags containing spaces.

## Add supplier

`add-vendor --code=<CODE> --name=<name> --owner=<person> --profile=<profile> --actor=<person>`

Check vendors for duplicates. Record a stable code and legal name. Optional --region and --retention=YYYY-MM-DD record local operating choices.

## Record policy evidence

`add-policy --code=<CODE> --vendor=<supplier> --coverage=<name> --number=<policy> --insurer=<name> --currency=NZD --limit=<amount> --effective=YYYY-MM-DD --expires=YYYY-MM-DD --evidence=<reference> --actor=<person>`

Read the document. Add --additional-insured=true/false and --waiver=true/false only from checked evidence, otherwise omit for unknown. Record renewals under new codes. Never change an old row to impersonate renewal history.

## Record evidence review

`review <policy-code> --verdict=verified --evidence=<reviewed-document> --note=<finding> --actor=<person>`

A person supplies the actual review. Read the policy, schedule and required endorsements. Use rejected when evidence fails. Never auto-verify an import or equate a certificate tick-box with an endorsement. Present requirements-check afterward.

## Assign contract requirements

`assign-profile <supplier> --profile=<code> --actor=<person>`

Read the supplier and source contract. Confirm the intended profile from the brief and rerun requirements-check afterward.

## Log a follow-up

`log <supplier> --note=<what-happened> --actor=<person>`

Record what actually happened. A draft is a draft, not a sent request. Read the supplier history first.

## Review retention purpose

`retention-review <supplier> --due=YYYY-MM-DD --note=<purpose-and-decision> --actor=<person>`

Read docs/compliance.md and the supplier file. Record the operator-approved reason for continued retention and a future review date. Do not automatically delete anything.

## Import COISoftware records

`import coisoftware <csv> --mapping=<map.json> --actor=<person> --dry-run`

Read docs/replace-coisoftware.md first. Inspect real headers, map stable codes, and test a sample. Show counts before committing the authorised import without --dry-run. Vendor-only imports do not contain policy history. Preserve evidence separately. Reconcile totals and keep all imported policies unreviewed.

## Export all records

`export <new-file.json>`

Write to ignored exports/ and ensure the destination parent exists. Never overwrite. The snapshot contains private source payloads and history. It is not an automatic restoration backup.

## Draft evidence follow-up

`draft-renewal <supplier>`

Read record and requirements-check first. The script writes drafts/ and never sends. Show the draft in chat. Mark expired historical policies with current replacement evidence where relevant.

## Data handling

Imports are atomic and support --dry-run. Duplicate source codes, missing mapped columns, changed rows and invalid values abort. Numeric limits preserve two decimal places. Check currency rather than converting implicitly. Export refuses to replace a file and includes all six record sets. History and reviews are append-only for ordinary database operations, not tamper-proof against the database owner.

Current requirements are evaluated against current records. --on changes the coverage date only. It does not reconstruct past requirements or what was known at the time. The exclusive expiry-day convention is a review flag, not interpretation of a policy's expiry time.
