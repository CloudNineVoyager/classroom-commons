# Changelog / 更新记录

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
