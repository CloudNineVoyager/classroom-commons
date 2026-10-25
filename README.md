# Classroom Commons

## Download and start / 下载与开始使用

1. [Download the v0.6.3 portable toolkit / 下载便携工具包](https://github.com/CloudNineVoyager/classroom-commons/releases/download/v0.6.3/Classroom-Commons-portable.zip). Choose this ZIP for teaching, not the source-code archive. / 老师请选择便携工具包，不是源码包。
2. Extract the ZIP completely, then open **老师先看这里.html** (includes English instructions). / 完整解压后，打开 **老师先看这里.html**。
3. Use its button to open **Classroom-Commons.html** in your browser. Core planning works offline without an account or API key. / 点击入口按钮打开工作台；核心备课功能可离线使用，无需账号或 API 密钥。

[Release notes and other downloads / 更新说明与其他下载](https://github.com/CloudNineVoyager/classroom-commons/releases/tag/v0.6.3) · [Feedback and bug reports / 使用反馈与问题报告](https://github.com/CloudNineVoyager/classroom-commons/issues)

For feedback, include your toolkit version, browser, steps and expected/actual results. GitHub Issues are public: remove student names, contact details, API keys and other private information before posting. / 反馈请说明工具版本、浏览器、操作步骤及预期与实际结果。GitHub Issues 是公开的，请勿上传学生姓名、联系方式、API 密钥等隐私信息。


**Classroom Commons is a free, open-source tool designed for rural and multigrade teachers worldwide, supporting offline lesson planning, multi-group classroom scheduling, material checks and live teaching mode. Core features require no account, paid subscription or API.**

[简体中文](README.zh-CN.md) · 0.6.3 · Free open-source toolkit · [MIT](LICENSE)

The workbench, Skills, templates and features are free and open source, with no paid tier. Original code is MIT licensed. Local planning requires no account, API key, subscription or separate client. Editing, resource checks, scheduling and export run on the teacher's computer. Optional AI drafting uses an assistant the teacher already has; that assistant controls its own charges, limits and regional availability. If it asks for payment, stop AI drafting. Existing lessons remain editable and exportable locally.

Version 0.6.3 puts the current lesson first: a clear course title, group summaries and preparation tools. Embedded open-source serif/sans font subsets work offline; smaller screens use top navigation and a single column. Activities can be duplicated and edited independently before rebuilding the schedule. All local planning tools remain available without AI.

## Who this is for and how it will stay useful

We serve rural and multigrade teachers worldwide. We help organize group time, check available materials and reuse lessons; software cannot fill staffing or school funding gaps, or replace teacher judgement. The project and official updates stay free and MIT licensed, with no paid tier. Optional outside AI services may charge.

Version 0.6.1 adds English/Chinese oral lesson examples requiring no shared materials. Teacher feedback, accessibility, lower-end device checks and reviewed translations guide future updates. Plans are distinct from shipped features.

[Mission and limits](MISSION.md) · [Maintenance and roadmap](MAINTENANCE.md) · [Changelog](CHANGELOG.md)

![Teacher studio home · 0.6.3](research/assets/home-0.6.3.png)

## For teachers

1. Extract the toolkit and open **老师先看这里.html**. Its button opens the workbench; an English section is included.
2. On the home page, use Load example near the bottom, open a saved project, or start a new lesson. The main preparation button opens **Classroom**. Edit groups, time, materials and activities.
3. Review **Resource fit**, then build **Lesson flow**. Adopt alternatives only after confirming suitability.
4. Use **Save project** for an editable backup. **Offline lesson** is a handout for viewing; **Print / PDF** opens the print flow. To resume, open the original workbench and use **Open project**.

AI is optional: describe the lesson in **AI assistant**, copy the request to an existing free chat, then paste the complete reply back. Review before applying. A repair-request button handles unreadable replies; teachers do not edit code. Back up important projects: browser storage is not a backup.

The top navigation and four numbered home modules open the editing sections. Return to **Home** from the top navigation; the current-lesson card opens the lesson for editing. Use Save project near the bottom to keep a backup.

Experienced users may choose the collapsed advanced option at the bottom of **AI assistant** to use their own API service. It is off by default, may incur that provider's fees, and sends a request only when explicitly asked to draft. The key stays in memory rather than saved course files. The free local and copy-and-paste paths do not depend on it.

## Skill integration

Skill installation is optional. Import the `classroom-commons` folder only in a host that supports its format. Hosts with local file access, script execution and an existing Python 3.9+ runtime can launch the workbench and exchange drafts through a local folder. Saving a request does not wake the assistant: return to chat and ask it to prepare the lesson. Without this runtime, open the standalone file and use copy and paste. Teachers should not install developer tools.

| Host | Actual acceptance status |
| --- | --- |
| WorkBuddy | Host-specific ZIP supplied. Installation and an actual free-account lesson round trip are unfinished because window capture failed. |
| Doubao ordinary chat | Generic copy-and-paste guide supplied. Live testing was skipped at the user's request; arbitrary local Skill import is unverified. |
| Other hosts | Local bridge development checks do not establish host installation, account access or free-tier acceptance. |

The WorkBuddy ZIP is in the toolkit's `技能安装包` folder. Its metadata follows the [official Skill format](https://open.workbuddy.cn/en/docs/skill). WorkBuddy's [free experience plan](https://www.codebuddy.cn/docs/workbuddy/Pricing) has limits. Doubao ordinary chat and Doubao Work are separate products; the [ordinary chat introduction](https://www.doubao.com/legal/feature_intro) does not establish local Skill import support. See [host acceptance](research/host-acceptance.md). No host is presented as universally available or as unlimited free AI.

## What it does

- **MultiClass:** schedule one teacher across learning groups; check teacher/group collisions, prerequisites, simultaneous resource capacity, independent reading requirements and teacher-defined maximum time without teacher contact. Replan delays while preserving activities already started.
- **ResourceFit:** compare activities to actual resources and reading conditions. Review alternatives retaining the stated objective. A teacher confirms suitability before adopting one; constraint checks do not establish educational effectiveness.

The interface provides English, Chinese, Spanish and Arabic, including RTL, localized numbers and A4 / Letter output. Lesson content can use a teacher's chosen language. No national curriculum or age-based ability assumptions are hard-coded. Examples are English/Chinese; translations need native teacher review. Global adaptability is a design goal, not completed global classroom validation.

Limits: one teacher, six groups, 24 activities, 5–240 minutes, whole-minute unsplit activities. Resources represent concurrent capacity, not cumulative consumption. Blank intervals require a teacher-approved routine. The bounded search returns `unknown` when no plan is found; this is not an impossibility proof. No OCR, automatic curriculum alignment or student assessment.

## Development

The UI uses React, shared components maintained in source, Lucide icons and Radix dialogs. Dependencies are needed to build from source; teachers receive a single HTML file with its code and styles included. No remote component CDN, font or model service is needed for local planning.

Use Node.js 22+ and Python 3.9+ for packaging and optional bridge tests. These steps are for developers, never teacher setup instructions.

```sh
npm ci
npm run build
npm test
npm start
python -m unittest discover -s test -p "test_*.py"
python scripts/release.py
```

Preview: `http://127.0.0.1:4173`. `npm start` builds first; `npm run preview` serves an existing build. esbuild produces the single-file workbench with its CSS and worker included. Outputs include `releases/Classroom-Commons.html`, Skill ZIPs and a portable ZIP with teacher guides. The Skill asset comes from the same build. Third-party licenses are embedded in the HTML and included as `THIRD_PARTY_NOTICES.txt` in release ZIPs.

The bridge binds only to loopback, checks a random session token, and accesses fixed filenames in the selected workspace. No telemetry or vendor relay. Content deliberately sent to a host assistant or a user-specified API follows that provider's data policies. Use group labels rather than student identities.

Saved course files retain unfinished editor fields and checked schedules. Host mode atomically persists the course in `course.json`. The toolkit includes example courses and handouts; a source ZIP and SHA256 manifest accompany it. The [0.5 verification record](research/release-0.5.0-verification.md), [0.5 delivery review](research/product-review-0.5.0.md) and [0.4 verification record](research/release-0.4.0-verification.md) document earlier releases, not acceptance of the new 0.6 interface.

This trial release is ready for teacher review. Real teacher trials, installation acceptance in third-party hosts, and macOS/Linux execution remain outstanding. See the [repository research](research/github-codex-mods-landscape.md) for the bounded competitive survey; no claim of an entirely empty market is made.

## Licenses

Classroom Commons' original code, including its home page, interface JavaScript and CSS, is licensed under [MIT](LICENSE). The warm notebook interface is independently designed for lesson preparation. Bundled dependencies keep their respective licenses, recorded in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt). Teachers' lesson content is not relicensed by using or exporting it with this tool.

Embedded font subsets are distributed under SIL OFL 1.1, separately from the MIT code license; see app/fonts/OFL.txt.
