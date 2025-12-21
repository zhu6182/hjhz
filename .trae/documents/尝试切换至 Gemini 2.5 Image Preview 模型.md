# 实施方案：切换至 Gemini 2.5 Flash Image Preview 模型

用户提供了一个特定的模型名称 `gemini-2.5-flash-image-preview-05-20`，这可能是一个具备更强图像处理能力的预览版模型。我们将尝试切换至该模型，看看是否能解锁真正的图像编辑能力。

## 修改步骤
1.  **修改 `services/geminiService.ts`**：
    *   在 `editFurnitureColor` 方法中，将调用的模型名称从 `gemini-2.0-flash-exp` 修改为 `gemini-2.5-flash-image-preview-05-20`。
    *   **保留错误处理**：万一这个模型名称不对或没权限 (404/403)，我们需要能够优雅降级（捕获错误并返回原图），避免应用崩溃。

2.  **验证逻辑**：
    *   虽然我们不知道这个模型的具体输入输出格式，但既然是 Gemini 系列，通常兼容 `generateContent` 接口。
    *   我们会打印出响应结果，观察它是否真的返回了图片数据。

这将是一次极具价值的尝试！
