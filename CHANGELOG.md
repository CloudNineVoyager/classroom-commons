# Changelog / 更新记录

## 0.6.6 — prepared 2026-10-30 (publication timestamp: GitHub Release / 实际发布时间以GitHub Release为准)

- 新增整本备课册JSON备份和导入，可一次带走已保存的多节课，在其他浏览器或设备中导回；不需要账号、AI或API。
- 导入前预览新增/跳过数量并确认；相同课程内容自动去重，同名但修改过的课保留为独立副本，新生成内部ID避免覆盖已有课。
- 导入只合并备课副本，不替换当前课程、已有副本或上课计时。容量超过20节时整批拒绝；确认时重新检查最新备课册，避免覆盖其他窗口此前保存的课。
- 错文件、超过25MB、损坏内容或存储失败时保留原数据并给出操作提示；坏排程保留课程并标记重新检查。连续选文件时，旧文件的慢读取不会覆盖新预览。
- 提供中、英、西、阿四语及RTL入口。整本备份只包含已另存的备课副本，不包含当前课尚未另存的修改。

English: export all saved lesson copies as one JSON backup and import them into another browser or device. Preview new/skipped counts, confirm a non-destructive merge, skip identical content and regenerate IDs. Reject the whole import if it would exceed 20 lessons; recheck current storage on confirmation. Reject invalid or oversized backups, preserve data on storage failure and ignore superseded file reads. Current lessons and clocks stay unchanged. No account or API required.

## 0.6.5 — prepared 2026-10-28 (local only, unreleased / 仅本地准备，未独立发布)

- 新增“本机备课册”：在首页手动保存最多20节课的独立副本，保留分组、材料、活动、替代说明和有效排程，刷新后可以再次打开复用。
- 继续编辑当前课不覆盖旧副本；打开备课前可备份当前课程或取消。尚未排程的副本明确提示先重新排程。
- 每份备课可单独导出为按课程名命名的JSON，用已有“打开项目”导回；移除副本前可取消或先导出备份，移除不改变当前课程。
- 存储满或不可用时如实显示保存失败；无法读取已有备课册时保留原数据。损坏排程保留活动并要求重新检查，不存AI笔记或API凭据。
- 中、英、西、阿四语与RTL可用；不依赖AI、API或账号。备课册保存在当前浏览器，换设备、浏览器、清理数据或移动HTML前需导出备份。

English: added an offline lesson shelf for up to 20 manually saved lesson copies, retaining groups, materials, activities and checked schedules. Copies survive reload and remain independent of current edits. Open with replacement confirmation, export individual course JSON backups, or remove a copy after confirmation without changing the current lesson. Storage failures are reported; unreadable shelf data is preserved. AI notes and API credentials are excluded. Available in four languages and RTL; backups are needed before changing browser/device or HTML location.

## 0.6.4 — 2026-10-28 (prepared 2026-10-25)

- 新增离线分组任务单：从通过检查的排程生成HTML，各学习组单独整理并按实际时间排序，显示时间段、目标、材料数量、指导方式、前置活动及已采纳的调整说明。
- 每项活动附纸面完成勾选框；打印时每组另起一页，长内容可跨页，支持A4 / Letter及浏览器另存PDF。
- 不会独立阅读的学习组显示教师口头讲解和示范提示。中、英、西、阿四语及RTL可离线使用。
- 缺材料、排程冲突或课程修改后未重新检查时阻止导出；保存任务单不修改课程、排程或上课计时，不需要AI或API。

English: export offline task sheets per learning group from a checked schedule, with chronological activities, timing, objectives, materials, teaching mode, prerequisites, adopted adjustments and paper completion boxes. Each group starts a new printed page; A4 and Letter are supported. Includes oral briefing guidance for groups unable to read, four languages and RTL. Unchecked or stale lessons cannot export; the lesson and clock remain unchanged.

## 0.6.3 — 2026-10-24

- 重做工作台排版：以真实课程名为主标题，分开课程信息、学习组摘要和工具入口；桌面浅色导航、移动端顶部导航，统一表单和控件。
- 内嵌开源中文宋体标题与三种黑体字重，恢复正常中文间距；移除宣传标语、大色块和卡片装饰。保留克制的交互反馈和减少动画支持，字体无需联网或安装。
- 新增“复制活动”：在原活动下方生成具有独立ID的副本，保留组别、时长、目标、材料、前置活动与替代方案，可单独修改。
- 复制后自动选中副本名称，方便立即重命名；清除旧排程并重置上课计时，要求重新生成排程。
- 达到24项活动时禁用复制；四种界面语言均可离线使用，不依赖AI或API。

English: redesigned course-centered typography and navigation, with embedded OFL serif/sans font subsets, normal Chinese spacing, responsive and RTL layouts. Duplicate a teaching activity below the original with independent data, retaining its settings, materials, prerequisites and alternative. Focus moves to the copy title; old schedules and lesson clocks reset for replanning. The 24-activity limit applies. Available offline in all four interface languages.

## 0.6.2 — 2026-10-24

- 上课模式新增“从指定活动继续”：按时间、学习组和活动名选择，定位到活动的排程开始时间。
- 定位后自动暂停；核对各组当前活动、老师指导组和剩余时间，再点“继续上课”。可前进跳过已完成阶段，也可返回较早活动。
- 定位同步更新所有组，不修改活动、课程文件或原排程。中、英、西、阿四语均可离线使用。

English: teaching mode can now jump to any scheduled activity. Choose by time, group and activity; the clock pauses at its scheduled start and updates every group. Review the classroom before continuing. Jump forwards or backwards without changing saved activities or schedules. Available offline in all four interface languages.

## 0.6.1 — 2026-10-23

- 新增离线上课模式：基于已有课堂排程开始计时，支持暂停、继续、归零和下课自动停止。
- 实时显示老师当前应带的学习组、各组正在进行的活动与目标、本活动剩余时间，以及下一项活动与切换倒计时。
- 切换工作台页面继续计时；后台刷新延迟后按实际经过时间定位活动，不累计计时回调误差。编辑课程、重新排程或刷新页面会重置计时。
- 上课模式支持中文、英文、西班牙文和阿拉伯文，全程离线，不需要账号、AI或API。计时不会修改保存的课程与排程。
- 新增11项计时与控制器检查，覆盖暂停/继续、精确交界、后台延迟、课堂结束、重排重置和课程不被修改。

English: new offline teaching mode with start, pause, resume and reset; live teacher-group focus, group activities/objectives, remaining time and upcoming transitions. Navigation preserves the clock; lesson edits, replanning or page reload reset it. Late refreshes use elapsed timestamps, and the clock stops at lesson end. Four interface languages; no account, AI or API needed. The saved lesson and schedule are unchanged.

使用：打开课程并生成有效排程 → 在“课堂排程”页顶部点“开始上课”。课间打断可暂停，恢复后点“继续上课”。本版不提供声音提醒，刷新页面不会恢复计时。

Teacher update: save your lesson project first, open the new workbench, then use Open project to import the backup. Keep the previous HTML if you need to roll back. Never overwrite your saved lesson JSON with example files.

## 0.6.0

Original lesson-book home, responsive navigation and existing offline planning workflow. Historical validation is in research/release-0.6.0-verification.md.
