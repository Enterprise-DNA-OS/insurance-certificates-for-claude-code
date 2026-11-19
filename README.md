# Insurance Certificates for Claude Code

Know whose insurance evidence is missing, which renewal needs a follow-up, and who checked the policy behind a certificate.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Start with fictional records. | Your coverage names, contract requirements, document intake and COISoftware export mapping. | Installed through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=coisoftware&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=coisoftware&utm_medium=managed) |

For procurement, facilities and insurance evidence reviewers. Works with Claude Code, Codex, OpenCode or Cursor. The database is the product. The agent runs the recorded jobs.

This is a certificate review desk. It checks recorded evidence against your recorded contractual requirements. It does not issue insurance, assess coverage for a claim, read scanned certificates automatically or send messages. COISoftware also supplies document extraction and hosted intake. [Scope and research](docs/research.md).

## Quick start

Node 20.6 or later on Windows or Linux:

```bash
npm install
npm run demo
npm test
npm run certificates -- requirements-check --json
npm run view
npm run docs
```

PGlite stores local records in `.data/db`. `DATABASE_URL` selects Postgres. Use a fresh database for a business: migrate, import, reconcile and review. Never seed fictional data into business records. Demo seeding is idempotent and its dates are relative to first use. All companies, policies and evidence references in the demo are fictional.

## Five weekly jobs

1. `/review-queue`: check documents nobody has verified, including changed records.
2. `/requirements-check`: compare each required coverage with one complete policy record.
3. `/renewals-due`: list the next 60 days and expired records.
4. `/attention`: combine coverage gaps with follow-ups older than 14 days.
5. `/weekly-review`: review coverage, renewals and retention-review dates together.

A requirement is met only by one policy with the right currency and sufficient limit, a current period, recorded required endorsements, a document reference and a current verification. Limits from separate policies are never added. An unknown endorsement is never treated as present. An imported certificate is unreviewed until a person records a check. An expired policy remains in renewal history even after replacement; review the current requirements check alongside it.

The expiry date is an exclusive boundary in this date-only desk. On that day it flags the record for review. Actual policy times, exclusions, aggregate exhaustion and claims-made retroactive dates need a reviewer and the full wording. `--on` checks today's recorded evidence against a chosen coverage date. It is not a reconstruction of what was known on that past date. [Rules and sources](docs/compliance.md).

## Ten questions to ask from your own records

These are working questions the CLI answers today, not unsupported claims that COISoftware cannot answer them.

1. Which suppliers have no recorded requirement profile? (`requirements-check`)
2. Which coverage types have no certificate at all? (`requirements-check`)
3. Which apparent limit matches use the wrong currency? (`requirements-check`)
4. Which required endorsements remain unconfirmed? (`requirements-check`)
5. Which certificates expire within 60 days? (`renewals-due`)
6. Which current records changed after the last verification? (`review-queue`)
7. Which future-dated policies leave a gap today? (`requirements-check`)
8. Which owners have not logged a follow-up in 14 days? (`attention`)
9. Which suppliers need a retention-purpose review? (`compliance`)
10. Who recorded each review and follow-up, and what evidence did they cite? (`record`, `history`)

## Your first hour: ten things to ask for

1. Create our first requirement profile with its contract reference.
2. Add the required coverage types and currencies.
3. Add our suppliers and the person responsible for each.
4. Map an authorised COISoftware vendor export.
5. Test the import before saving records.
6. Reconcile supplier counts with the export.
7. Record a certificate and its document reference.
8. Verify the full policy and required endorsements.
9. Put our name, colours and logo in `brand.json`.
10. Use `/customise` to add our own review rule with a migration and test.

## Bring your records across

```bash
npm run certificates -- import coisoftware imports/vendors.csv --mapping=imports/vendors-map.json --actor=Reviewer --dry-run
```

Remove `--dry-run` to save. COISoftware documents vendor-list and result exports. The exact headers and result layout are not public, so the saved mapping is required. Synthetic examples in `tests/fixtures` demonstrate this desk's mapping, not an account export verified against the vendor. Vendor imports do not invent coverage. Flat coverage exports can be mapped separately with `kind: policies`; nested or key/value result exports need a reviewed flattening step first. [Switching guide](docs/replace-coisoftware.md).

## Documents, views and safe operation

`npm run docs` produces an evidence review and renewal brief for each relevant supplier. `npm run view` produces a read-only weekly snapshot. `/draft-renewal` writes a local draft for the owner to review. No command sends mail or calls a vendor service.

`export` writes six record sets, including source payloads and append-only history, to a new JSON file. This is an interchange snapshot, not an automatic restore. Back up the database and referenced evidence files separately and test restoration. Generated reports contain private records. Shared use needs scoped authenticated access, protected document storage and tested backups. Database objects revoke PUBLIC access and enable row-level security; the local owner connection is privileged, not a multi-user permission system.

`npm test` uses a disposable database and exercises all 23 CLI commands, valid and invalid records, rollback, repeated imports, evidence changes, expiry boundaries, immutable history, drafts and escaped HTML. A manual CI workflow covers Windows, Linux and Postgres 16. [CLI reference](docs/cli.md).

MIT licensed. Not affiliated with COISoftware or Anthropic. Hosting and coding-agent costs are separate. [30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=coisoftware&utm_medium=readme).
