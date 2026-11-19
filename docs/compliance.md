# Evidence rules and compliance checks

This desk checks records. It neither certifies legal compliance nor decides whether a loss is insured. A qualified reviewer checks the policy, schedule and endorsements before reliance.

Sources opened 19 November 2026:

- [ACORD certificate FAQ](https://www.acord.org/docs/default-source/forms/acordcertificatesfaq): a certificate supplies information and does not change a policy. Endorsements change coverage. This supports requiring document references, a human review and separate endorsement fields. It does not supply a minimum cover limit or a statutory deadline.
- [New Zealand Privacy Commissioner: principles](https://www.privacy.org.nz/privacy-principles/): principle 8 concerns accuracy before use, principle 9 limits retention, and principle 5 concerns storage security. A review queue and retention-purpose review support these duties. They do not prove compliance with the whole Act.

## Checks implemented

| Finding | Meaning and basis |
|---|---|
| NO_REQUIREMENTS | No rules were recorded for the supplier. Set requirements from the actual contract. |
| MISSING_COVERAGE | No policy record matches the required coverage name. |
| LOW_LIMIT | One policy's recorded limit falls below the contract requirement. No summing policies or excess layers. |
| CURRENCY_MISMATCH | The recorded currency differs. No implicit conversion. |
| EXPIRED / NOT_YET_EFFECTIVE | The requested date lies outside the recorded period. Expiry day flags for review because this desk has no policy expiry times. |
| NO_DOCUMENT_REFERENCE | A certificate row alone cannot be verified without a document reference. |
| REVIEW_REQUIRED | No current successful human evidence review, latest review rejected, or the policy changed since verification. Supports accuracy checks and ACORD's distinction between certificate and policy. |
| ADDITIONAL_INSURED_UNCONFIRMED / WAIVER_UNCONFIRMED | A contract requires the field but the recorded evidence is false or unknown. The reviewer must read the endorsement, not merely a checked certificate box. |
| Retention review list | No review date or an elapsed review date. A person records the ongoing lawful purpose or arranges an approved disposal process. Nothing is automatically deleted. |

All monetary thresholds come from the profile's contract reference. The demonstration limits are invented example requirements, not statutory amounts. The 60-day renewal window and 14-day follow-up interval are configurable workflow choices, not legal deadlines. Retention review dates are selected by the operator, not a universal retention period.

A successful result says only `record checks met`. No insurance is bound, no claim is settled, and no supplier is authorised to work. Claims-made coverage, aggregate depletion, exclusions, cancellation notices, endorsement wording, jurisdiction and time-of-day require human interpretation. `--on` uses the current recorded profile and latest review, so it does not establish the historical state of knowledge.
