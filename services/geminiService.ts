
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FurnitureAnalysis } from "../types";
import { backendService } from './backendService';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // 允许 API Key 为空，避免前端初始化直接崩溃
    // 如果没有 Key，将在实际调用 API 时报错，或者使用 Mock 数据
    // 注意：Vite 要求环境变量必须以 VITE_ 开头才能在客户端访问
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || 'PLACEHOLDER_KEY';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeFurniture(base64Image: string): Promise<FurnitureAnalysis> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: 'image/png',
              },
            },
            {
              text: `Analyze this image and identify the main piece of furniture. Return ONLY a JSON object with properties: "type" (short name like 'Sofa', 'Cabinet'), "material" (predominant material), and "description" (a brief 1-sentence physical description).`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              material: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["type", "material", "description"]
          }
        }
      });

      return JSON.parse(response.text || '{}') as FurnitureAnalysis;
    } catch (err) {
      console.warn("API limit reached, using fallback mock data for testing");
      // Fallback Mock Data
      return {
        type: "模拟家具(API超限)",
        material: "默认材质",
        description: "由于API配额限制，这是模拟的识别结果，您可以继续测试改色流程。"
      };
    }
  }

  async listModels() {
    try {
      const response = await this.ai.models.list();
      const models: any[] = [];
      // @ts-ignore
      for await (const model of response) {
        models.push(model);
      }
      console.log("All Available Models List:", models);
      
      // Filter image generation models
      const imageModels = models.filter(m => 
        m.name.includes('image') || 
        m.supportedGenerationMethods?.includes('generateImage') ||
        m.supportedGenerationMethods?.includes('image')
      );
      console.log("Image Gen Models:", imageModels);
      
      return models;
    } catch (error) {
      console.error("Failed to list models:", error);
      return null;
    }
  }

  async editFurnitureColor(
    base64Image: string,
    furnitureType: string,
    colorAndTexture: string,
    hex: string
  ): Promise<string> {
    try {
      console.log('Starting Aliyun Wanx generation...');
      
      // A. 先把 Base64 上传到 Supabase 获取 URL
      // 将 base64 转为 File 对象
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "temp_upload.jpg", { type: "image/jpeg" });
      
      const uploadedUrl = await backendService.uploadTexture(file);
      if (!uploadedUrl) {
        throw new Error("Failed to upload temp image to Supabase");
      }
      console.log('Image uploaded to Supabase:', uploadedUrl);

      // B. 提交任务给 Vercel Function (转发给阿里)
      // 使用更具体的 Prompt
      const stylePrompt = `${colorAndTexture} texture, ${furnitureType}, high quality, realistic photo, 8k resolution`;
      
      const submitRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          image_url: uploadedUrl,
          prompt: stylePrompt
        })
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok || !submitData.output || !submitData.output.task_id) {
        throw new Error(submitData.message || 'Failed to submit task to Aliyun');
      }

      const taskId = submitData.output.task_id;
      console.log('Task submitted, ID:', taskId);

      // C. 轮询任务状态
      return await this.pollTaskStatus(taskId);

    } catch (error) {
      console.error("Error generating image with Aliyun:", error);
      // 降级：如果出错，返回原图，避免前端白屏
      return base64Image;
    }
  }

  // 轮询辅助函数
  private async pollTaskStatus(taskId: string): Promise<string> {
    const maxRetries = 30; // 最多轮询 30 次 (约 60秒)
    const interval = 2000; // 2秒一次

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, interval));

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          task_id: taskId
        })
      });

      const data = await res.json();
      
      if (data.output && data.output.task_status === 'SUCCEEDED') {
        if (data.output.results && data.output.results.length > 0) {
          // 成功！返回生成的图片 URL
          return data.output.results[0].url; 
        }
      } else if (data.output && data.output.task_status === 'FAILED') {
        throw new Error('Aliyun task failed: ' + data.output.message);
      }
      
      console.log(`Polling task ${taskId}: ${data.output?.task_status}...`);
    }

    throw new Error('Task timed out');
  }
}

export const geminiService = new GeminiService();
