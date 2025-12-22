# 实施方案：修复 Gemini 模型 404 错误

用户明确拒绝 Canvas 方案。我们将坚持使用 Gemini API，但必须修复当前的 `404` 错误（模型不存在）。

## 核心任务
将 `geminiService.ts` 中的模型名称从不存在的 `gemini-2.5-flash-image-preview-05-20` 修改回真实可用的 `gemini-2.0-flash-exp`。

## 详细步骤
1.  **修改 `services/geminiService.ts`**：
    *   找到 `editFurnitureColor` 方法。
    *   将模型名称改回 `gemini-2.0-flash-exp`。
    *   保留 `generateContent` 调用逻辑。
    *   **预期结果**：
        *   不会再报 404 错误。
        *   如果模型返回文本（描述图片），前端将降级显示原图（这是目前 Gemini API 的限制，但至少流程是通的）。
        *   如果模型在未来升级支持绘图，该逻辑将自动生效。

2.  **验证**：
    *   确保控制台不再出现 `models/... not found` 的红色报错。

这将解决当前的报错问题，保持代码逻辑使用 Gemini AI。
