# Move a certificate review desk from COISoftware

[COISoftware's guide](https://coisoftware.com/guide), checked 19 November 2026, documents CSV/XLSX vendor-list exports and CSV/JSON result exports. Export from the authorised account using its Vendors page or the result page. Download the original certificates, policy schedules and endorsements separately and keep them in protected storage.

1. Create a fresh destination and run `npm run migrate`. Do not run the demo seed.
2. Place the authorised CSV in ignored `imports/`. Compare the actual headings with `tests/fixtures/vendors-map.json`. Write your own mapping there. Map a stable source ID into `code`, never a row number or a display name that can change.
3. Run one command with `--dry-run`, then the same command without it:

```bash
npm run certificates -- import coisoftware imports/vendors.csv --mapping=imports/vendors-map.json --actor=Reviewer --dry-run
```

4. Compare imported counts and original source payloads to the export. Import coverage records separately using `kind: policies` and the actual flat column headings. A vendor list contains no policy evidence and will not create it.
5. Add requirement profiles from your own contracts, assign them to suppliers, review every certificate against the full policy wording and endorsements, and record each check. Run `/requirements-check`, `/renewals-due` and `/weekly-review` before relying on the desk.

## Mapping contract

The mapping has `kind` and `columns`, a map of destination field to exact CSV heading. Required vendor fields: `code`, `name`. Optional: `owner`, `region`. Required policy fields: `code`, `vendor`, `coverage`, `policy_number`, `insurer`, `currency`, `limit_amount`, `effective_on`, `expires_on`. Optional: `additional_insured`, `waiver`, `evidence_ref`. `vendor` resolves the imported supplier code. Unknown flags, missing headers, invalid dates, amounts and ambiguous suppliers fail the import. Nothing saves if any row fails.

Codes allow letters, digits, underscores and hyphens and are normalised to uppercase. Dates must be ISO calendar dates. Currency must be three uppercase letters. Amounts are plain nonnegative decimals without separators. Endorsements use `true`, `false` or blank for unknown. Coverage names must match the profile exactly. Keep an explicit mapping for any source vocabulary or date conversion.

The public guide does not expose the exact exported headings or the structure of a certificate result. This importer is tested against synthetic mapped CSVs, not a real account export. If a result is nested JSON or a two-column field/value CSV, first flatten it into one row per coverage under reviewer control. The mapping and preparation belong to the switch and must be validated on a sample before a full load. It is not a promise of automatic full-account migration.

Identical repeated imports skip records. A changed row or collision with a manually entered code fails for review rather than overwriting verified evidence. Record a renewed policy under a new code. Original rows and the mapping are preserved. Old certificates remain in the record.

## What needs separate work

Policy PDFs, images, endorsement documents, hosted intake links, extraction templates, user permissions and sent-message history do not transfer through this CSV import. Document extraction, private upload facilities, integrations and email delivery are custom implementation work. The free desk drafts locally only. A complete backup contains the database and every referenced evidence document. `export` is a readable snapshot, not a restoration command.
