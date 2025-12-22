
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

  // 2. 使用 Replicate (ControlNet) 进行 AI 改色
  // 这是真正的 AI 改色，保留结构，改变材质
  async editFurnitureColor(base64Image: string, furnitureType: string, targetColor: string, hexCode: string): Promise<string> {
    try {
      console.log('Starting Replicate generation...');
      
      // A. 上传图片到 Supabase 获取公开 URL
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "temp_replicate.jpg", { type: "image/jpeg" });
      
      const uploadedUrl = await backendService.uploadTexture(file);
      if (!uploadedUrl) {
        throw new Error("Failed to upload image to Supabase");
      }
      console.log('Image uploaded:', uploadedUrl);

      // B. 调用 Replicate 接口
      const prompt = `${targetColor} ${furnitureType}, interior design, photorealistic, 8k, detailed texture`;
      
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: uploadedUrl,
          prompt: prompt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Replicate API failed');
      }

      if (data.output && data.output.length > 0) {
        // Replicate 返回的是图片 URL 数组，取最后一张（通常是结果图）
        // ControlNet Canny 模型通常返回 [边缘图, 结果图] 或者直接 [结果图]
        // 我们取最后一张比较保险
        const resultUrl = data.output[data.output.length - 1];
        
        // 为了避免跨域问题，我们最好把这个 URL 转回 Base64，或者直接返回 URL
        // 这里直接返回 URL，App.tsx 里的 img src 可以直接用
        return resultUrl;
      }
      
      throw new Error('No output from Replicate');

    } catch (error) {
      console.error("Replicate generation error:", error);
      // 降级：返回原图，避免白屏
      return base64Image;
    }
  }

  // 轮询辅助函数 (不再需要)
  // private async pollTaskStatus(taskId: string): Promise<string> { ... }
}

export const geminiService = new GeminiService();
