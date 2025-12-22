# 实施方案：接入 Replicate (ControlNet) 实现高质量 AI 改色

为了解决之前 AI 改色结构变形的问题，我们将接入 Replicate 平台，利用 **Stable Diffusion + ControlNet** 技术。通过 ControlNet 的边缘检测 (Canny/Lineart)，可以强制 AI 在生成新材质时严格遵守原图的线条结构，实现“换皮不换骨”的完美效果。

## 1. 环境变量配置
*   **本地**：更新 `.env.local`，添加 `REPLICATE_API_TOKEN`。
*   **线上**：提醒用户在 Vercel 后台添加该变量。

## 2. 后端开发 (Vercel Serverless Function)
*   **创建 `api/replicate.js`**：
    *   作为中转服务，保护 API Key。
    *   接收图片 URL 和 Prompt。
    *   调用 Replicate API (模型选择 `jagilley/controlnet-canny` 或类似高性能 ControlNet 模型)。
    *   处理 Replicate 的异步轮询逻辑 (提交 -> 等待 -> 返回结果)。

## 3. 前端改造 (`services/geminiService.ts`)
*   **保留 Gemini 识别**：继续使用 Gemini 分析家具类型。
*   **重构改色逻辑**：
    *   先将 Base64 图片上传至 Supabase Storage 获取公开 URL (复用 `backendService` 的上传功能)。
    *   调用 `/api/replicate` 接口。
    *   返回生成的高清图片。

## 4. 依赖安装
*   虽然可以用 `fetch` 直接调用，但为了代码整洁，我们可能需要安装 `replicate` npm 包，或者直接封装 HTTP 请求（推荐直接 HTTP 请求以减少依赖体积）。

这将是本项目最硬核的一次升级。
