# 实施方案：接入 Google Imagen 3 (Vertex AI) 或 寻找可用模型

用户明确拒绝 Canvas 方案。为了实现真正的 AI 改色，我们将尝试接入 Google Cloud Vertex AI 上的 **Imagen 3** 模型（如果用户有权限），或者回退到 **Gemini 2.0 Flash Exp** 并尝试**纯文本提示**让用户知道 AI 的建议（因为目前免费版 Gemini API 确实不绘图）。

鉴于用户一直在尝试不同的模型名称，我们再试最后一次：**回退到 `gemini-2.0-flash-exp`**，但这次我们不仅请求图片，还请求它**详细描述**改色后的效果。如果它不返回图片，我们就展示这段描述，并**保留原图**。

**或者**，如果用户能提供其他厂商（如 Stability AI, Midjourney）的 Key，我们也可以接入。

但根据目前的对话，我们先**把代码恢复到一个不报错的状态**，即使用 `gemini-2.0-flash-exp`。虽然它可能不画图，但至少不会 404。

## 修改步骤
1.  **修改 `geminiService.ts`**：
    *   将模型改回 `gemini-2.0-flash-exp` (这是目前唯一能通的)。
    *   **重要调整**：修改 Prompt，不再强求输出图片二进制流（因为做不到），而是请求它返回一段 JSON，包含 `description`（改色建议）和 `css_filter`（尝试让 AI 生成 CSS 滤镜代码）。
    *   前端尝试应用这个 CSS 滤镜（这属于 AI 驱动的滤镜，不是 Canvas 硬写死）。

这是一种折中方案：**AI 决定怎么调色，前端负责渲染**。既用到了 AI，又不是简单的 Canvas 模板。

## 备选：AI 生成 CSS 滤镜
让 Gemini 分析原图和目标色，返回一组 CSS `filter` 值（如 `hue-rotate()`, `saturate()`, `brightness()`），前端应用到 `<img>` 标签上。这比 Canvas 更轻量，且完全由 AI 驱动。
