# 0.4 界面设计与实现约定

用户参考图是前端实现原则，不是社交页面的视觉稿。本版把备课工作台作为主要界面，保留已验证的课程格式和计算引擎。

## 设计

- 左侧固定工作区导航，按“我的课堂、课堂排程、资源适配、AI 助手”组织工作；顶部显示课程、保存状态、语言。
- 白色卡片、浅灰页面、深绿色主操作，统一间距、边框、圆角、字体和焦点样式。无需远程字体或图片。
- 课堂概览直接显示课程、时长、组数和待处理问题，不用大幅宣传区占据编辑空间。
- 新建、导入、载入示例、应用草稿都明确确认替换；取消保留当前课程。学习组、资源和活动采用同一组表单组件。
- AI 内容先审阅再应用；材料替代由教师确认。错误有可执行的返回入口，不能用成功样式掩盖未完成或本次未找到排程。
- 小屏导航和工具栏折行，表单单列；时间线只在自己的容器横向滚动。阿拉伯语使用逻辑方向属性，数字时间范围独立采用从左到右的方向。
- 原生表单标签、可见键盘焦点、对话框标题与描述、状态播报；尊重系统减少动画设置。

## 依赖选择

开发时安装并锁定 React / ReactDOM、Radix Dialog、Lucide React；esbuild 只在构建时使用。统一组件源码在仓库内维护，避免增加多个同类 UI 和图标库。

[React createRoot](https://react.dev/reference/react-dom/client/createRoot) 用于组件渲染；[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) 提供对话框的焦点与键盘行为；[Lucide React](https://lucide.dev/guide/react/) 提供实际使用的内联 SVG 图标；[esbuild](https://esbuild.github.io/api/) 将模块和使用到的依赖构建为一个生产脚本。

没有拖拽、多栏拖动或复杂共享状态需求，因此不加入 dnd-kit、react-resizable-panels、Zustand 或 Motion。参考图中的库是举例，不作为逐个安装清单。

## 教师交付

单文件 HTML 包含生产脚本、样式、图标、计算 Worker 和完整第三方授权；没有 CDN 组件、远程字体和 API 配置。教师不用 npm、Node、Python 或开发工具。Skill 本地桥接仍只使用宿主已有的 Python 标准库；普通聊天复制粘贴不需要安装 Skill。

源码重建需开发者运行 `npm ci`；不能沿用 0.3 的“无 npm 安装重建”声明。具体执行证据以 `release-0.4.0-verification.md` 为准。
