# 实施方案：接入阿里云通义万相 (Wanx)

用户已提供阿里云 DashScope API Key，我们将把图像生成服务从 Gemini 迁移到通义万相。这将解决图片无变化的问题。

## 1. 环境变量配置 (我来做本地，用户做线上)
*   **本地**：更新 `.env.local`，添加 `DASHSCOPE_API_KEY`。
*   **线上**：提醒用户去 Vercel 添加该变量。

## 2. 后端开发 (Serverless Function)
*   **创建 `api/generate-image.js`**：
    *   这是一个 Vercel Serverless Function。
    *   接收前端的 Prompt 和 图片。
    *   调用阿里云通义万相 API (HTTP 调用，不依赖额外 SDK 以保持轻量)。
    *   模型选择：`wanx-v1` (图生图/风格重绘)。
    *   返回生成后的图片 URL。

## 3. 前端对接
*   **修改 `services/geminiService.ts`**：
    *   重命名为 `services/aiService.ts` (更准确)。
    *   `analyzeFurniture`：保留 Gemini (因为它读图很强)。
    *   `editFurnitureColor`：改为调用我们自己的 `/api/generate-image`。

## 4. 依赖清理
*   移除代码中对 Gemini 绘图部分的无效调用。

这将彻底打通“改色”流程。
