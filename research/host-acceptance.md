# Host adaptation and acceptance · 2026-10-22

This file records the initial host-adaptation session and its blockers. The newer 0.3.0 independent delivery, 44 automated tests, real current-Codex drafting flow, browser save/import/export checks and source rebuild are in [the delivery record](release-0.3.0-verification.md). The WorkBuddy/Doubao account acceptance limits below remain in force.

## Acceptance target

An ordinary free account completes an anonymous lesson request, returns a usable draft, and the teacher reviews, checks and exports it without buying credits, configuring an API or installing developer runtimes. Package validity and synthetic browser tests are necessary but do not meet this whole criterion.

## WorkBuddy desktop

- Installed version: 5.8.3, found in the Windows application registry and launched through the supported Computer Use API.
- A unique WorkBuddy window was selected. Accessibility text exposed the real `专家·技能·连接器` tab and the main UI. Existing conversations were not edited.
- Initial screenshot capture failed with `FrameArrived timed out: timed out waiting on channel`. Refreshed window selection and activation permitted an accessibility read. A subsequent click failed with `coordinate input geometry is unavailable`. A screenshot-backed refresh then failed with `window capture timed out: timed out waiting on channel`.
- No Skill was installed; no course request was sent; no model allowance was consumed. UI automation stopped after recovery failed. The user was asked to expand the WorkBuddy window and keep the desktop unlocked.
- A WorkBuddy-specific ZIP is now generated from the same canonical Skill body and assets, with `display_name`, bilingual descriptions, `version` and `author`. Archive metadata/resource checks passed. This does not establish WorkBuddy's own import/security-scan acceptance.
- [Official desktop import instructions](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market): `专家·技能·连接器 → 技能 → 添加技能 → 上传技能`. [Open-platform format](https://open.workbuddy.cn/en/docs/skill) documents bilingual description/version/author fields. These are source requirements, not an observed successful import.
- [Official pricing](https://www.codebuddy.cn/docs/workbuddy/Pricing) includes a limited free experience plan. A real lesson on the actual free allowance remains to be tested. No subscription or model configuration was changed.

## Doubao chat

- User steering after the initial blocker: the Edge popup remains open and the user explicitly requested skipping this test. Doubao live acceptance is now **skipped by user**, not waiting for popup dismissal. Keep the generic tutorial marked unverified; do not retry this route unless requested again.
- An existing Doubao conversation was discovered in Edge. Its content was not read or changed.
- An attempt to open a separate ordinary chat for an anonymous test was blocked: `Microsoft Edge is blocking automation because another extension UI is open on this page. Complete or dismiss that extension UI in Microsoft Edge, then ask me to continue.`
- The user was asked to close the extension popup. No alternate browser surface, raw browser command or token/cookie route was used to get around the blocker. No lesson request was sent to Doubao.
- Adaptation supplied: a normal-chat link, three-step copy/request/reply UI, complete-reply extraction, and a copyable repair request. The local UI was tested with synthetic fixtures, not a real Doubao response.
- [Doubao's ordinary chat introduction](https://www.doubao.com/legal/feature_intro) does not by itself establish support for importing this local Skill ZIP. Native arbitrary Skill installation remains unaccepted.

## Distinguish Doubao products

Doubao ordinary chat, Doubao Work, and an installed app named Doubao Studio must not be treated as one tested product. The normal-chat tutorial requires neither a Doubao Work subscription nor a cloud Skill runtime. Doubao Work's official promotional material describes Skills, but its native import and applicable free allowance have not been tested here. No account was created, no entitlement was purchased, and the Studio app was not used as evidence for ordinary Doubao compatibility.

## Local work completed this turn

- Node: 15 tests passed, including explanatory text/code fences, quoted braces/escapes, ambiguous multiple lessons, truncated replies and size limits.
- Python: 6 tests passed, covering bridge behavior plus host-specific archive metadata, canonical resource preservation and the teacher toolkit layout.
- Generic Skill validation passed with UTF-8 mode.
- Browser over loopback HTTP: the three-step UI loaded; a non-project response produced the teacher-friendly repair state; repair text copied successfully; a synthetic complete project wrapped in explanation and a code fence appeared as a reviewable draft.
- This UI check exposed a Windows CRLF/CSP hashing bug. A regression check first reproduced failure, the build normalized line endings, and both the check and browser loading then passed.
- Direct `file://` execution, actual third-party model responses, free-account inference, successful host installation, export round-trips and classroom trials remain separate acceptance items.

## Resume after the user's UI intervention

1. Doubao is skipped under the current instruction. If the user later requests resuming it and closes Edge's extension popup, inspect the current tab inventory before retrying; the earlier create-tab outcome must not be assumed. Use a new ordinary Doubao conversation, send only the anonymous sample, save the complete response locally and import it through the workbench UI.
2. After WorkBuddy is expanded, obtain a fresh unique window and verify capture before clicking. Inspect the actual Skills/upload flow. Apply any action-time confirmation required by the Computer Use skill before installing through the UI; do not bypass import/security warnings.
3. Check the actual account's free allowance before a model request. A paid account run cannot establish free-tier acceptance. If a payment/upgrade is required, stop that route and record the exact limitation.
4. For each successful route, preserve an anonymized request/response, checked schedule, exported course/handout and a screenshot. Update tutorials only to the buttons actually observed and record the product/version/account tier.

Follow-up WorkBuddy check after the skip instruction: a fresh unique window was found and activated, but screenshot capture again returned `FrameArrived timed out: timed out waiting on channel`. No input or installation was attempted. The earlier request to expand WorkBuddy remains pending.

Current state: **adaptation packages and local workflow checks complete; Doubao live acceptance skipped by user; WorkBuddy live acceptance blocked on window capture**.
