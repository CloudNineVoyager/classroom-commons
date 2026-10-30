# v0.6.6 cloud merge and release verification

Verified on 2026-10-30 UTC in the cloud Linux workspace. This records preparation and testing, not a claim that GitHub publication has happened.

## Source and merge

- Public remote main: `6aa38d35937ae83d4d0fe82818a7b1b00b6599bf` (v0.6.3).
- Feature baseline: `2c0e001e2f0d727271ec8698a8b5cf90c1d63620` (v0.6.4, descendant of main).
- Sole supplied input: `Classroom-Commons-update-0.6.6-library-backup.zip`, SHA256 `bd88f062bd7a29af3d9ce88b370c013ddbb22a62f0b9ea02fe18a77697b6cad0`.
- All 14 incremental files and 7 release assets matched the update manifest's new SHA256 and byte counts. The manifest's original hashes describe local v0.6.5, which is not present on the remote; they were compared, not falsely claimed to match v0.6.4.
- Safely inspected the complete source archive to restore the missing v0.6.5 lesson-library functionality. All incremental files matched that complete source byte-for-byte. No source deletion was needed.
- Preserved remote README introductions, download/privacy guidance and other independent content; updated current version/download links and added backup/migration guidance. Historical release descriptions and screenshot labels retain their actual versions.
- Restored the remote v0.6.4 changelog date (2026-10-28, prepared 2026-10-25); the supplied local source had incorrectly used its planned date 2026-10-26. Marked v0.6.5 as local-only preparation, not an independent GitHub release, and v0.6.6 as preparation with actual publication time determined by GitHub. Original local verification records retain their historical preparation dates and explicit non-publication statements.
- Retained unchanged course-file format, group sheets, fonts/OFL, licenses and build scripts. No new runtime dependencies.

## Cloud checks

Runtime: Node v24.22.1, npm 11.9.0, Python 3.12.14.

- `npm ci`: passed using a writable workspace npm cache. An initial dependency-review attempt failed because the default npm cache was unavailable; the workspace-cache attempt succeeded. Dependencies were initially fetched with scripts disabled, and the sole install script (esbuild) was reviewed before the complete installation.
- `npm run build`: passed; standalone HTML 1,222,066 bytes, 29 bundled packages. SHA256 `a3d703b5983372b511e29d51f9acc73c1a8caf08c75b8079d71386e66a1ae506`, equal to the supplied functional build.
- `npm test`: 101 passed, none failed or skipped.
- `python -m unittest discover -s test -p 'test_*.py' -v`: 26 discovered, 25 passed, 1 skipped. The skipped test is `test_copied_session_can_start_while_an_existing_reader_finishes`, requiring Windows file-sharing semantics.
- `python scripts/release.py`: passed. All artifacts and manifest were regenerated together after documentation merge; no supplied old archive was reused.
- Diff whitespace check passed with CRLF treated as line endings, preserving the repository's existing line-ending style.

## Limits

No cloud browser interaction or second physical-device test was performed here. The supplied local browser verification remains a separate historical record. Windows-specific sharing behavior was not rerun in this Linux environment. Real classroom use, physical mobile devices, native-language review, and real free-account host workflows remain unverified as documented previously. No remote write, force-push, tag replacement or About change was performed by this preparation task.
