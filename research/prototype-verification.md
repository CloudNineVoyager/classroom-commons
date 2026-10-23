# Prototype verification · 2026-10-22

Version 0.2.0, Windows development environment. All classroom data used for verification was synthetic. No paid model request was made.

This is the initial prototype record. The follow-up adaptation, 21 current automated tests, Windows packaging fix, and live-host blockers are recorded in [host acceptance](host-acceptance.md).

## Passed

- `npm run build`: standalone HTML and identical Skill asset generated with no third-party npm dependency.
- `npm test`: 13 tests passed. Includes missing-resource handling, teacher confirmation, teacher/group/resource collisions, reading restrictions, attention gaps, prerequisites, bounded-search status, delay preservation, malformed imports, credential-field stripping, language completeness and standalone script/CSP consistency.
- `python -m unittest discover -s test -p "test_*.py"`: 3 tests passed. Covers local bridge access control, request/result matching, stale-result rejection, project preservation and session reuse. The bridge's shape check intentionally defers detailed classroom validation to the workbench.
- `python -X utf8 .../skill-creator/scripts/quick_validate.py skills/classroom-commons`: Skill structure passed. UTF-8 mode was needed because the validator otherwise reads Chinese text with the Windows GBK default.
- Browser UI at the bridge's loopback HTTP URL: saved a Chinese request, read it from the host side, delivered a synthetic candidate with matching request ID, saw it awaiting review, applied it, reviewed and adopted the example resource alternative, generated a schedule showing “constraint checks passed”. Browser warning/error log was empty. Screenshot: `.qa/workbench.png` (local, not committed).
- Release packager created both ZIPs; archive integrity checks passed.

## Still outstanding

- Opening the downloadable HTML directly under `file://` could not be exercised with the available browser automation: its URL policy permits only HTTP/HTTPS. No alternate browser or policy bypass was attempted. The same bundled HTML was exercised over local HTTP; its script was also syntax-checked and its CSP hash verified.
- WorkBuddy, Codex installer flows and Doubao real-account usage have not been accepted end to end. Native arbitrary Skill import in Doubao remains unconfirmed; use the generic copy-and-paste route until verified.
- Actual browser download/import round-trip, physical printing/PDF save, disconnected-network execution, macOS/Linux and mobile browsers have not been separately exercised.
- Real rural-teacher usability, native-language translation review and classroom effectiveness require pilot testing.

The offline file contains its code, styles, worker and logo. It requests no remote assets or AI endpoint. This implementation property does not substitute for the outstanding device and teacher trials above.
