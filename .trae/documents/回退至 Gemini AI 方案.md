# 实施方案：回退至 Gemini 方案

用户决定放弃 Canvas 方案，回退至最初的 Gemini 方案。虽然目前 Gemini 可能无法生成完美的改色图片（常返回原图），但这样可以保持架构统一，等待未来模型升级。

## 修改步骤
1.  **修改 `services/geminiService.ts`**：
    *   移除 `backendService` 引用（不再需要先上传到 Supabase）。
    *   移除 Canvas 绘图逻辑。
    *   恢复调用 `this.ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" })`。
    *   构造 Prompt 请求 AI 修改图片。
    *   处理响应：尝试解析图片，如果失败则返回原图。

2.  **清理**：
    *   确保没有遗留的阿里云相关代码。

这将使应用逻辑回归到纯 Google Gemini 技术栈。
