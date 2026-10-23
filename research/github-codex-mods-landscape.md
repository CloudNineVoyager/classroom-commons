# Codex mods：GitHub 现状与候选缺口调研

检索日期：2026-10-21（America/New_York）。本段覆盖教育、影音、家庭档案、制造与维修、无障碍。公开网页检索后打开作者仓库 README 或具体文档；没有安装、运行第三方代码，没有登录账户或调用付费服务。README 中的能力属于作者公开声明，不是本次实测结论。

## 结论边界

本轮抽查的大领域均找到供 agent 使用的相近工具。“Codex 没有官方按钮”不等于“GitHub 没人做”；给 MCP 加 Codex 配置、翻译、换名字、做一键安装，不能据此证明功能空白。这些工作仍可以有分发与易用性价值。下面的机会是有限检索中发现的**较窄组合缺口**，不是全网不存在证明。全球可用应靠通用文件和任务形态，不以某一国家平台、账户或行政流程为前提。

## 已有仓库与反证

| 领域 | 作者一手仓库 | 本次确认的公开范围 | 对选题的意义 |
|---|---|---|---|
| 视频课程转技能 | [Lum1104/video-to-skill](https://github.com/Lum1104/video-to-skill)，并打开 [SKILL.md](https://github.com/Lum1104/video-to-skill/blob/main/SKILL.md) | 明确面向 Claude Code 和 Codex；课程媒体、时间戳证据、生成 Skill、教学/练习/应用；声明可续接 | “把视频变成技能再应用”已经有直接同类，不能作为空白 |
| 教程还原 | [sato-note/reverse-engineer-ai-video-tutorial](https://github.com/sato-note/reverse-engineer-ai-video-tutorial)，并打开[具体 Skill](https://github.com/sato-note/reverse-engineer-ai-video-tutorial/blob/main/skills/reverse-engineer-ai-video-tutorial/SKILL.md) | Codex/Cursor，视频教程到证据指南、按指南复现场景 | “看教程并复刻”也已有，必须进一步缩小问题 |
| 通用教学工作区 | [talocode/skills](https://github.com/talocode/skills) | README 列出跨会话教学工作区、课程资料和学习记录；也有教程视频、YouTube 分析等 skills | 教学、内容分析都不能仅因不是官方插件就视为缺失 |
| 视频剪辑 | [PlbKin190/video-editor-mcp](https://github.com/PlbKin190/video-editor-mcp) | 本地 FFmpeg：探测、剪切、拼接、变换、叠加、混音、JSON 时间线、QA；文档列出 9 个工具 | 通用“让 Codex 剪视频”已有执行层 |
| AI 视频制作 | [Guojiz/comfyui-minimax-h3-studio](https://github.com/Guojiz/comfyui-minimax-h3-studio) | Codex 默认宿主、ComfyUI 工作流、分段/连续性/QC；作者将长视频实现未验证状态明确区分 | 一句话视频、长视频连续性方案已有；不要重新包装成首次发明 |
| 家庭文件管理 | [OrellBuehler/paperless-mcp](https://github.com/OrellBuehler/paperless-mcp) | Paperless 文档检索、批量修改、分类、语义搜索、页提取与年度检查 | 文档归档、收件箱整理、证件查缺不能笼统称空白 |
| 家庭文件查缺 | [barryw/PaperlessMCP](https://github.com/barryw/PaperlessMCP) | README 直接给出税务资料检索、批量标签、收据上传、保险资料缺失检查例子 | “家庭材料缺了什么”已有明确定位 |
| 家谱 | [nikkoxgonzales/mcp-grampsweb](https://github.com/nikkoxgonzales/mcp-grampsweb) | Gramps Web 检索、人物/事件/来源/引文创建、祖先与后代查询 | 家谱连接器不是空白；不能靠新增 Codex 配置形成创新 |
| 口述史 | [crisishistory/HistoryAIToolkit](https://github.com/crisishistory/HistoryAIToolkit) | 音视频采访处理、转写、生成后续采访问题；README 自述为不稳定、部分可用的概念验证 | 采访转写、追问已有思路与代码；可能缺的是细分成品流程 |
| CAD | [neka-nat/freecad-mcp](https://github.com/neka-nat/freecad-mcp) | FreeCAD 模型创建编辑、Python、文档检查、FEM；需要 FreeCAD addon 与 MCP server | 通用制造/CAD agent 接入相当拥挤 |
| 家电维修 | [sadishihab/fixit-mcp](https://github.com/sadishihab/fixit-mcp) | 手册引文、故障码、症状、设备登记、保修日期；目前 README 还给出无需 AWS 的本地 SQLite 演示 | “拍设备、查手册、问故障、查保修”不宜再称独有；基础反证已很强 |
| 家庭维护 | [ritwikareddykancharla/homekeeper-alexa](https://github.com/ritwikareddykancharla/homekeeper-alexa) | 手册、维护计划与历史、耗材、保修；Alexa+ 宿主仍有模拟器边界 | “记住所有家电并提醒维护”也已有，不能只换宿主 |
| 图纸打印 | [storytold/vectorcraft](https://github.com/storytold/vectorcraft) | 原生矢量应用，MCP 与 JSON 控制；README 指向海报/缝纫版型跨页打印 | 生成 SVG、分页打印、接 MCP 不是空白 |
| 服装版型 | [danzeeeman/patternForge](https://github.com/danzeeeman/patternForge) | 参数设计、模拟；导出 A4/Letter 分页 PDF、10cm 校准框、制作说明、DXF、几何检查 | “把设计变可打印制作包”已有非常接近的独立产品 |
| 刺绣 | [Stitchwright/StitchFoundry 的作者文档](https://github.com/Stitchwright/StitchFoundry/blob/main/docs/embroidery.md) | 刺绣设计与导出、机器适配、MCP；还包括设计比较 | 手工艺并非完全没人做，连版本比较也有反证 |
| 读屏辅助 | [marlon-sousa/screen-readers-mcp](https://github.com/marlon-sousa/screen-readers-mcp) | Windows NVDA，按键、speech/braille 捕获；其他读屏桥接为计划 | 真实读屏交互已有执行层，跨平台范围需要逐项核查 |
| 读屏测试 | [mikewolfd/voiceover-mcp](https://github.com/mikewolfd/voiceover-mcp) | Guidepup 虚拟读屏和 macOS VoiceOver；文档区分二者证据效力 | 不应把无障碍测试笼统当空白 |
| 无障碍 skills | [Community-Access/accessibility-agents](https://github.com/Community-Access/accessibility-agents)，另看[作者发布记录](https://github.com/Community-Access/accessibility-agents/releases) | 作者发布记录声明 Codex 直接安装 80 个 skills，覆盖网页/文档等审查 | Codex 专用无障碍技能集合已有，数量本身不带来差异 |
| 视频口述影像 | [microsoft/ai-audio-descriptions](https://github.com/microsoft/ai-audio-descriptions) | 视频→对白空隙→可编辑 WebVTT→TTS 混音；Studio 和 CLI；需要 Azure | 给盲人视频添加旁白已有端到端一手实现 |
| 教程 UI 漂移 | [KirtiJha/reel](https://github.com/KirtiJha/reel) | YAML 驱动真实网页/CLI 的演示、check/diff/review/heal；失败时重新解析与修复步骤 | “检测 UI 变化并修复演示”也已有，下面机会必须限制到第三方旧教程迁移 |

## 可继续验证的 3 个窄 mod

以下都是**产品推断**，实现前还应读取最接近仓库更完整的功能清单和问题区，并拿真实输入试用；目前不承诺独创。

### 1. Tutorial Patch：第三方旧教程的版本迁移卡

用户给一个已经过时的教程片段，以及自己当前版本软件的截图/界面。Codex 逐步输出“原教程时间点→当前对应操作→目标状态证据→仍无法对应的步骤”，形成可在学习过程中打开的小卡。第一版只支持一个具体桌面工具、一个 5–10 分钟片段，不做完整课程库。

最接近的 [video-to-skill](https://github.com/Lum1104/video-to-skill) 和 [教程复现 Skill](https://github.com/sato-note/reverse-engineer-ai-video-tutorial) 已处理理解与应用；[reel](https://github.com/KirtiJha/reel) 处理自己编写的演示规约漂移。这里的差异是**对没有结构化脚本的第三方历史视频，交付可审阅的版本映射与失效步骤补丁**。差异是否足够大，置信度为中低；若上述 Skill 已完整覆盖，应改为贡献扩展。

最小验收：拿同一软件两个版本和一个真实旧教程，找到至少一个已改名/移动的操作；每个替代步骤都指向当前实际界面证据，不能通过“推测软件大概这样”验收。

### 2. Memory Witness：保留分歧的家庭口述史整理

用户给两位亲人的录音和少量旧照片。Codex 生成带原音时间戳的事件卡，**把相互冲突的日期、名字、地点并排保留**，生成仅针对冲突的下一次采访提问；导出私藏全文与家人分享版时，能逐处看到哪些内容被隐去。第一版用本地文件，不搭建社交平台或家谱服务。

最接近的 [HistoryAIToolkit](https://github.com/crisishistory/HistoryAIToolkit) 已有转写和追问，[Gramps MCP](https://github.com/nikkoxgonzales/mcp-grampsweb) 已有家谱来源与引文。潜在差异是**不把多人的回忆合成一个伪确定故事，围绕分歧保留音频证据、追问与两种分享版本的关联**。置信度中低；口述史领域已有大量非 agent 工具，不能宣称全新领域。

最小验收：两段对同一事件有矛盾的采访，所有矛盾仍能回到原音；未经用户确认不把其中一个版本写成唯一事实；分享版可以追溯到明确的删改清单。

### 3. Build Ledger：小型实物制作的改动影响卡

从一个低风险的小制作开始，例如纸板收纳盒或木工拼装件：用户上传图纸、材料尺寸与做了一半的照片，并说“我把板厚从 12mm 换成了 15mm”。Codex 列出受影响的零件、接缝和未完成工序，区分原计划尺寸、用户实测值和待确认值，保存为下次继续制作能直接使用的状态卡。重点是**做了一半发生变更后，哪些尚未制作的部分需要跟着改**。

最接近的 [FreeCAD MCP](https://github.com/neka-nat/freecad-mcp) 可以改名义模型，[patternForge](https://github.com/danzeeeman/patternForge) 可以生成有检查的制作包，[StitchFoundry](https://github.com/Stitchwright/StitchFoundry/blob/main/docs/embroidery.md) 也能比较设计。这里的潜在差异是**真实施工/制作过程中的已完成状态与实测偏差，驱动剩余步骤变更**，而不是重做一个生成器或 CAD 包装器。置信度低到中；应进一步检查具体领域的工坊项目管理与装配工具。

最小验收：同一实物项目跨两次会话，能指出已切割零件不能随参数自动改变，给出剩余零件的具体受影响列表；照片不能作为可靠毫米级测量的替代。限制到非承重、非电气、非专业安全结论的小作品，以免范围失控。

## 暂不建议作为首批独创 mod 的方向

- 通用视频下载/字幕提取/课程总结/课程转技能：直接同类明显。
- 通用文档归档、保修查询、家电维护：Paperless、FixIt、HomeKeeper 已覆盖核心价值。
- 通用剪视频、做图、做 CAD、导出可打印图纸：基础工具与完整应用都已有。
- 无障碍审计、真实读屏 MCP、对白空隙配旁白：现有一手项目充分，优先贡献或复用。
- 仅把上述项目翻译成英文、多语言、加 Codex 安装命令：可以改善分发，但不应宣传成核心功能创新。

## 具体检索词

检索均使用公开网页搜索，以下为本轮实际查询；搜索范围故意超出 Codex，也包括 Claude/通用 agent/MCP 和独立应用反证。

```text
site:github.com MCP server video editing ffmpeg blender education tutorial
site:github.com MCP CAD FreeCAD repair manufacturing
site:github.com MCP personal documents family archive paperless accessibility screen reader
site:github.com "MCP" "paperless"
site:github.com "MCP" "screen reader"
site:github.com "skills" "tutorial" "video" "Codex"
site:github.com "MCP" "genealogy"
site:github.com "MCP" "repair manual"
site:github.com "skills" "family archive"
site:github.com "MCP" "video" "audio description"
site:github.com "agent skill" "video" "continuity"
site:github.com "MCP" "warranty" "manual"
site:github.com "MCP" "audio description" accessibility
site:github.com "skill" "Codex" "practice" "course"
site:github.com "MCP" "oral history"
site:github.com "MCP" "appliance" "maintenance"
site:github.com "Codex" "accessible" "PDF" "skill"
site:github.com "MCP" "sewing" OR "knitting" OR "woodworking"
site:github.com "agent skill" "oral history"
site:github.com "MCP" "genealogy" "Gramps"
site:github.com "audio description" "generate" "ffmpeg"
site:github.com "tutorial" "version drift" "agent"
site:github.com "MCP" "sewing pattern"
site:github.com "agent skill" "woodworking"
site:github.com "Codex" "knitting"
site:github.com "pattern" "print" "calibration" "sewing"
site:github.com "oral history" "AI" transcript contradiction
site:github.com "tutorial" "UI drift" agent
site:github.com "repair" "handover" "MCP"
site:github.com "craft" "progress" "agent skill"
```

## 限制

这是定向样本调查，不是 GitHub 全量抓取；没有关键词命中不能证明不存在。未登录 GitHub 的网页/代码索引可能漏掉新仓库、未索引文件、私有仓库、非英文命名和非 GitHub 项目。本次没有实测可安装性、真实输入输出、跨平台和许可可复用性；不以 stars、README、模拟演示或测试通过替代生产可用性证据。网页检索结果与打开时的 README 有少量版本变化，本文以实际打开的作者页面为优先，未锁定 commit，后续实施前要固定版本并重新读许可证。

## 桌面 mod、通用功能与进一步反证

以下为主代理补充调查；均已打开作者仓库、README 或具体文档。

| 类别 | 一手来源 | 确认范围与判断 |
|---|---|---|
| 直接的 mod 集合 | [nicosuave/modex](https://github.com/nicosuave/modex)，[README](https://raw.githubusercontent.com/nicosuave/modex/main/README.md) | 可选模型槽位、主题图标、任务分栏、自定义 CLI；将所选 mod 构建进单独签名的 macOS 应用。证明“Codex mods 仓库”已有先例；不是全球跨平台通用实现。 |
| macOS 启动动画 | [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | 自定义图片、文字、透明背景、跳过动画；外部启动器临时加入页面动画。不能再把动画功能视为空白。 |
| Windows 启动动画 | [yanami-sec/codex-startup-animation-windows](https://github.com/yanami-sec/codex-startup-animation-windows) | 作者明确提供 Store 版 Codex 的动画入口、图片/文字设置、预热；因此也不能凭 macOS 上游写“尚无 Windows”推导全生态缺失。作者只声明一台 Windows 11 机器的实际验证；本次未实测。 |
| 主题 | [than0112/codex-theme-engine](https://github.com/than0112/codex-theme-engine) | 通过 Chromium DevTools 对运行中的渲染器应用主题；已有独立主题方向。 |
| 桌面增强启动器 | [qqheling/codexplusplus](https://github.com/qqheling/codexplusplus/blob/main/README_EN.md) | 声明 Windows/macOS 安装包、CDP 注入、管理面板、用户脚本；通用启动器/管理器也已有相近路线。 |
| 插件/技能管理 | [qxcnm/Codex-Manager](https://github.com/qxcnm/Codex-Manager/blob/main/docs/en/README.md) | README 列出 Skills/Plugins、ZIP/目录导入、卸载等；不能把安装管理功能视为无人覆盖。 |
| 教育 | [GarethManning/education-agent-skills 的 Codex 指南](https://github.com/GarethManning/education-agent-skills/blob/main/docs/CODEX.md) | Codex 本地插件/独立技能，教学设计、间隔练习、评价等。教育大类有直接覆盖。 |
| 字幕生产 | [starinzlob/translate-video-subtitles](https://github.com/starinzlob/translate-video-subtitles) | 术语校正、双语排版、时间轴、烧录和客观检查均在 README 中；“字幕＋术语一致性＋交付检查”也已有完整同类定位。 |
| 木工 | [ShopPrentice/shopprentice](https://github.com/ShopPrentice/shopprentice) | Codex 技能与 Fusion 360 MCP，参数化家具建模、执行及检查。木工设计不是空白。 |
| 服装 | [adriendelmas/pattern-making-skill](https://github.com/adriendelmas/pattern-making-skill) | Codex 可读取的制版技能、1:1 SVG/DXF、接缝检查、10cm 校准框；相近产品比“只有一个 CAD 接口”更完整。 |
| 音乐 | [katiahayati/kengraver](https://github.com/katiahayati/kengraver) | Codex 识谱技能，扫描谱转 MusicXML、渲染校阅，另有声乐歌词注释技能。一般识谱转换不是空白。 |
| 文件撤销 | [Nainish-Rai/agent-rollback](https://github.com/Nainish-Rai/agent-rollback) | 快照、diff、恢复、MCP 与 Codex hooks；已有独立撤销工具定位。README 的“唯一”等自述未被本调查采信。 |
| 跨文档变更传播 | [Euraika-Labs/Codex-Code-Game-Studios 技能表](https://github.com/Euraika-Labs/Codex-Code-Game-Studios/blob/main/docs/studio/skills-reference.md) | 游戏设计文档已有跨文档一致性审查及 propagate-design-change；因此 Ripple 也不能宣传为首次提出变更传播。 |
| Office 执行层 | [onecer/AIOffice](https://github.com/onecer/AIOffice) | 同一 CLI/MCP 编辑 DOCX/XLSX/PPTX、跨文档取图表数据、统一替换接口。Ripple 的区别必须是事实依赖与语义影响关系，不能只做批量替换或文档转换。 |
| 活动工作区 | [jpoehnelt/session-party](https://github.com/jpoehnelt/session-party) | 从征集到运行单的活动工作区，README 列出 MCP/REST；仓库页面显示已归档。不能声称活动领域没有 agent 可用工具，也不据归档状态推导其功能失效。 |

## 建议优先验证的产品候选

下面排序是产品判断，非市场需求验证或独创性认证。mod 均以 Codex 为理解、规划、交互与执行宿主；不另起一个必须购买模型订阅的独立 AI 产品。中文互联网可提供创意，交付围绕通用文件、单位和任务进行设计。

### 第一候选：Ripple — 多文件联动改稿

- 场景：教师、小团队、活动组织者、研究者、设计师修改一个事实后，相关文档常有不同表达。例如 40 人改为 60 人，会影响预算数量、座位表、用餐数量、通知与演示稿，不能仅查找替换“40”。
- mod 输出：持久的事实—文件位置关联、受影响清单、按文件显示的修改建议、未知依赖与歧义项；用户采纳后由 Codex 执行，并再次查找遗漏。单纯复制一段“一致性检查”提示词不能算实现完成。
- 最近反证：上表的游戏设计变更传播技能，以及 AIOffice 的 Office 编辑/跨文件数据能力。已读公开页面未见它们明确交付面向日常办公的上述完整组合；尚未逐项审计其全部代码。
- 首版范围：同一活动的一个 DOCX 通知与一个 XLSX 预算表；只支持人数这一种变更。后续再增加 PPTX、日期、金额等。不要一开始承诺支持任意二进制格式。
- 最小验证：人数改变后，数量项和相关公式结果一致；电话号码、历史统计等恰好同数字的无关内容不被改；用户手工改过的位置出现冲突提示；重开会话仍可识别已采纳关联。
- 机会置信度：中。用户价值与是否足够易用仍待实际用户试用。

### 第二候选：PrintCheck — 实物打印校准

- 场景：教师教具、纸艺、缝纫、桌游组件的 PDF/SVG 在换纸张、打印机或打印设置后发生比例和拼接问题。
- 核心：用户先打印校准页并输入实际测量值，Codex 记录打印条件，定位缩放/边距问题，生成经补偿的新版；错页和拼接偏移可由带标记的回拍辅助检查。
- 最近反证：patternForge、vectorcraft、pattern-making-skill 已有分页、1:1 导出或校准框。独有候选范围是**实际纸张结果→实测反馈→补偿再输出**，不是再次生成一个 10cm 方框。
- 首版范围：一个有已知尺寸的 SVG、一个纸张配置和用户尺量输入；暂不靠随手照片推断毫米级尺寸。
- 最小验证：人为引入 95% 缩放，用实测长度求补偿，再次打印后检查误差；真正的纸张结果是验收条件，数字 PDF 页面尺寸正确不足以验收。
- 机会置信度：中低。还应验证实际打印习惯、操作成本以及现有专业打印软件的替代程度。

### 第三候选：Rehearsal — 运行单延误推演

- 场景：直播、课程、研讨会、小型演出已经有运行单，某段延误，希望保住结束时间。
- 核心：Codex 读取运行单中固定结束、最短时长、人员与设备依赖，给出可行与不可行的调整方案，同步生成主持稿和人员安排的修改清单。
- 最近反证：Session Party 已有完整活动工作区；本 mod 只做已有运行单的临场变更与方案比较，不再复制一个活动 SaaS。
- 首版范围：CSV 运行单＋Markdown 主持稿；用户明确标出不可压缩项目，不自动向任何人发送变更。
- 最小验证：注入 12 分钟延误；不能压缩固定项目；人员/设备冲突仍能被发现；约束无解时明确报告无解，不能靠把所有时间整体后移伪称解决。
- 机会置信度：中低；本次未检索到同定位的完整 Codex mod，不代表不存在。

## 主代理补充的实际定向查询

```text
site:github.com Codex mods extensions plugins
site:github.com Codex skills non coding workflows
site:github.com Codex desktop customization animation
site:github.com codex "mod" desktop marketplace
site:github.com codex mod manager installer marketplace desktop
site:github.com codex "undo" "files" plugin rollback
site:github.com "codex" "subtitle" skill
site:github.com "agent skills" "subtitle" "localization"
site:github.com "codex" "woodworking"
site:github.com "MCP" "cut list" woodworking
site:github.com "codex" "cross-document" consistency
site:github.com "MCP" "document" "change propagation"
site:github.com "codex" "document" "propagation"
site:github.com "agent skill" "cross-document" update
site:github.com "cross-document" "docx" "pptx" agent
site:github.com "MCP" "event" "run of show"
site:github.com "codex" "run of show" delay
site:github.com "codex" "print calibration"
site:github.com "MCP" "print calibration"
site:github.com "skill" "print" "calibration" "pattern"
site:github.com "print" "calibration" "paper" "MCP"
site:github.com "codex" "jianpu"
site:github.com "agent skill" "musicxml"
site:github.com codex startup animation Windows
```

检索完成后的决定：先保留这份调查作为选题依据；尚未安装现有 mod、实现候选功能、创建 GitHub 远程仓库或发布代码。依用户当前“先看有没有，再找缺口”的阶段完成调查，不把研究文档当作已交付 mod。

## 2026-10-22 补充：乡村教师与资源受限课堂的细分机会

检索日期：2026-10-22（America/New_York）。这轮只做 12 个定向查询，搜索范围包括全球乡村、复式班/多年龄课堂、无印刷预算、单设备离线课堂与临时代课；打开作者仓库 README/具体 Skill 确认范围。未安装、运行或实测第三方项目。

### 明确的反证

| 窄需求 | 作者一手证据 | 对判断的影响 |
|---|---|---|
| 复式班/乡村教师 AI | [Adhish-Krishna/Sudar](https://github.com/Adhish-Krishna/Sudar) | 明确定位 multigrade classrooms，按年级和历史表现生成练习、视觉解释、问答等。乡村和混龄不是无人涉足的群体。其 README 未呈现按分钟检查教师注意力冲突与学生等待时长的功能；这只是公开文档观察。 |
| 乡村教师手机辅导 | [Orenda-Project/rumi-platform](https://github.com/Orenda-Project/rumi-platform) | README 直接提 rural schools、multigrade classrooms，覆盖教案、课堂录音辅导、阅读评估、多语音频等。不能用“为乡村教师生成教案”主张创新。 |
| 完整临时代课包 | [KRASA-AI/education-ai-skills](https://github.com/KRASA-AI/education-ai-skills) | README 直接列 Substitute Lesson Plan Generator：一课时/一天/多日，交代流程、独立任务、管理话术、无需原老师课程软件、返回原老师的 note-back 表。另有 Teacher Attention Equity Auditor，回顾谁获得了教师个别/小组关注并重新分配。代课接力和注意力公平分析都已有直接反证。 |
| 代课可执行教案 | [SkillMedev/skills 的 lesson-plan-builder](https://github.com/SkillMedev/skills/blob/main/skills/lesson-plan-builder/SKILL.md) | 包含分段时间、教师/学生行为、材料、形成性检查，并要求通过陌生代课老师可执行性检查。仅多写一张“老师做什么、学生做什么”的表，不够形成明显差异。 |
| 换班与交接简报 | [ShemHooks/acad-schedule](https://github.com/ShemHooks/acad-schedule) | 作者 README 声称有 AI Substitute Finder、Class Handover Brief、分组建议；整体是 Kenya CBC 学校管理系统。该能力未实测；足以反驳“教师交接没人做”。 |
| 单设备离线学习 | [yuelinou999/Beacon](https://github.com/yuelinou999/Beacon) | 实际打开的 README 将范围限定为七年级数学、确定性练习/间隔复习、家长视图。浏览器离线模型目前只接入一个 review 功能，其余 AI 表面仍走 Ollama。搜索摘要中“complete offline classroom”的宽承诺不能直接当作完整实测能力。 |
| 离线本地课堂服务器 | [Ilakiancs/OptiLearn](https://github.com/Ilakiancs/OptiLearn) | 老师笔记本跑本地模型，通过 LAN 为学生设备提供多语辅导、测验与报告等。核心形态仍需要服务器设备与学生设备，不能等同“全班唯一一部手机”。 |
| 单手机/投影、离线单文件课堂 | [h2ohojat/kelas-zende](https://github.com/h2ohojat/kelas-zende) | 波斯文 README 明确宣称一个 HTML 文件可在手机/投影设备无网络无安装运行，包含讲解、诊断反馈、分步提示、投票、报告；提供分数与密度教学示例、模板、提示词生成器以及桥接协议。这是“离线教学包”很接近的直接反证；加 Codex 适配本身不能当创新。 |
| 无印刷预算的现实约束 | [kcelestinomaria/overlooked-bench](https://github.com/kcelestinomaria/overlooked-bench) | 这是 benchmark，而不是成品备课器；教育项明确测试给定班额、零印刷预算下教案是否可实施。它说明这个失效模式已有公开定义，可能可参考其验收思路，但不能当作用户需求规模或工具可靠性的证据。 |

### 保留的两个候选：缺口在约束闭环，不能叫“乡村 AI 教案”

**候选 A：复式班注意力排程器（优先，置信度中）。**

第一版只服务一名老师、同室 2–3 个学习组、一节 35–45 分钟的课。输入各组人数/可独立完成任务的时间上限、必须由老师示范的步骤、不会识字的小组约束、全班唯一黑板/教具。输出每分钟“老师在哪组、其余组具体做什么”的泳道图，并做明确检查：老师不能同时直接教学两组；学生任务不能依赖老师当时的讲解；同一教具不能重复占用；不能把不会读题的儿童安排成长期自学。老师说“第一组多花了 6 分钟”后，重新排剩余时间并列出被压缩或取消的目标。

最接近的是 Sudar 的分层任务生成、KRASA 的注意力公平回顾，以及大量学校课表冲突检查工具。差异应锁定为**一节课内部的教学依赖、教师注意力、共享材料与学生等待时间的联合约束检查＋延误重排**。它不是全校周课表，也不是三份并列教案。12 次检索未找到公开文档明确完整覆盖该组合的直接 Codex mod；不能据此证明不存在。

最小验收：给出含两个“必须老师在场”的重叠任务，必须报冲突；把一个低龄组的自主活动上限设成 4 分钟，不能悄悄排成 12 分钟；演示延误后仍有可执行剩余方案。时间限制应由老师提供，不把 AI 建议当作普适教学标准。

**候选 B：零额外耗材的教案改造与降级包（第二，置信度中低）。**

用户给一份现有教案和真实库存，例如“38 人、只有黑板/粉笔/石子/一本教材，无打印、无学生设备”。Codex 把每一步所需资源与库存逐项核对，指出缺口，给出保留同一学习目标的具体替代活动、黑板版布局、口头指令、全班反馈收集方法。若只有一部老师手机，可预先生成本地教案/倒计时/离线音频；若投影临时坏了，则切换到不依赖投影的方案。**课堂上不需要 Codex 联网或本地大模型，Codex 在课前生成和修改产物。**

直接反证是 kelas-zende 的单文件课堂和通用 lesson-plan-builder 的材料清单；Rumi 也可以接受资源约束。因此差异不能停留在“生成离线 HTML、低资源、手机可开”，而是**对现成教案逐步做资源依赖核对，给出目标保持的替换，关联正常/断电/无投影三套实施步骤**。如果试用现有工具已经能稳定做到，应扩展现有项目，而不是强行新建同类。

最小验收：库存写 0 台学生设备，结果不能再要求扫码或手机作答；印刷预算为 0，不能产出必须人人拿到练习纸的唯一方案；必须保留原教案要检验的能力，不能把“学生动手分类”替换成仅听讲后声称等效。

**暂不保留为首发：通用代课接力包。** KRASA 的公开范围已经覆盖准备、课堂实施与返回原老师的记录；acad-schedule 还有交接简报。除非真实访谈发现非常具体的断点，例如连续多位代课教师之间某一步状态无法接续，否则它目前更像已有功能的重新包装。

### 本轮实际 12 个检索词

```text
site:github.com multigrade classroom lesson planner teacher scheduling
site:github.com offline classroom one phone projector lesson teacher
site:github.com "substitute teacher" "lesson" AI
site:github.com "multigrade" "AI"
site:github.com "multigrade" lesson teacher rotation
site:github.com "multigrade" classroom AI teacher assistant
site:github.com "lesson" "no printing" teacher
site:github.com "one device" "classroom" "offline" teacher lesson
site:github.com "multigrade" "rotation"
site:github.com "multigrade" "schedule"
site:github.com "lesson" "no printer" AI
site:github.com "low-resource" "lesson plan" materials
```

本轮限制：以上只确认公开定位与文档范围，未确认各仓库真实部署和课堂效果。未对所有目录或历史版本做穷尽代码审查；“README 未呈现”不能写成“代码一定没有”。没有把关键词零命中写成全网空白。候选需求和验收示例是本次产品推断，还需要向真实复式班教师核实其高频性与愿意采用的交付形态。
