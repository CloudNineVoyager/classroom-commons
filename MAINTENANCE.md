# 怎样长期维护 / How we maintain this project

## 坚持什么 / Commitments

- 永久免费、MIT开源；不做付费解锁、不强制API或云账号，不通过售卖学生数据维持项目。 / Free MIT releases, no paid unlocks or mandatory API/cloud account, no funding through selling student data.
- 优先让已有课程继续打开，保留离线使用和导出；格式变更先提供说明与迁移办法，不静默改写老师文件。 / Preserve lesson compatibility, offline use and exports; document migrations before format changes.
- 只把做完并验证过的内容写成已完成。 / Separate shipped work from plans and unverified claims.

## 每次更新怎么做 / Release process

1. 在仓库Issues收集匿名反馈：设备/浏览器、界面语言、期望与实际行为；课堂问题注明可用材料和分组，不发学生身份或API密钥。 / Collect anonymized context and reproducible feedback through repository Issues.
2. 优先处理丢失课程、安全或无法打开，其次处理易用性、少材料案例、无障碍和翻译，再增加功能。 / Prioritize data loss, security and startup failures, then usability, examples, accessibility and translation before feature growth.
3. 小范围修改，跑相关检查和现有回归；记录哪些真实设备或宿主还没验收。 / Make small changes, run relevant regression checks and report untested devices/hosts.
4. 在CHANGELOG记录变化，发行附SHA256、教师包、源码、简明教程和回退说明。先让老师保存备份，再替换工作台文件；旧课文件通过“打开项目”导入。 / Publish change notes, checksums, teacher/source bundles and rollback instructions; back up lessons before updating.
5. 发布后继续按反馈修复；重大变更先听取使用者意见。 / Follow up on reports and consult users before major changes.

## 路线图 / Roadmap

| 状态 / Status | 内容 / Work |
| --- | --- |
| 已有 / Shipped | 离线编辑、分组排程、资源适配、四语界面、可选Skill/API / Offline editing, schedules, material checks, four languages, optional Skills/API |
| 0.6.1新增 / New | 中英零共用材料口语示例、明确全球乡村教师定位与免费承诺 / Bilingual no-shared-material examples and clear mission/free commitments |
| 近期优先，待验证 / Next, pending | 邀请乡村教师试用；记录低配设备、手机、打印和母语翻译问题 / Rural teacher trials; device, mobile, print and native-language review |
| 后续候选 / Later candidates | 教师审阅的本地活动模板、更多语言、无障碍改进 / Locally reviewed templates, further languages and accessibility improvements |

这是独立开源项目，按实际维护能力小步更新，不承诺虚假的每周发布、24小时支持或永不间断服务。当前没有已确认的全球教师试用网络。维护暂停时会在仓库说明状态、保留已有版本并欢迎社区接续；不会关闭已有离线文件或撤回MIT许可。

This is an independent open-source project. Releases follow available maintainer capacity, without a guaranteed weekly schedule or 24-hour support. A global teacher pilot network is not yet established. If maintenance pauses, document the status, retain prior releases and welcome community continuation; existing offline files and MIT rights remain usable.
