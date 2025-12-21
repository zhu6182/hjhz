
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

  // 2. 前端 Canvas 改色 (替代 AI 生成，保证结构不变)
  async editFurnitureColor(base64Image: string, furnitureType: string, targetColor: string, hexCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // 1. 绘制原图
          ctx.drawImage(img, 0, 0);

          // 2. 混合模式改色 - 增强版算法
          
          // 第一层：Color 模式 (强制改变色相和饱和度，保留明度)
          // 这是实现“改色”最关键的一步，能让颜色真的变过去
          ctx.globalCompositeOperation = 'color';
          ctx.fillStyle = hexCode;
          ctx.globalAlpha = 0.8; // 强度调高，确保颜色显现
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 第二层：Multiply 模式 (正片叠底)
          // 用于加深颜色并融合纹理，避免画面发灰
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = hexCode;
          ctx.globalAlpha = 0.4; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 第三层：Overlay 模式 (叠加)
          // 增加对比度和光泽感，让画面更通透
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = hexCode;
          ctx.globalAlpha = 0.2;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 4. 重置混合模式
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;

          // 导出结果
          const resultBase64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(resultBase64);
        } catch (err) {
          console.error("Canvas processing error:", err);
          resolve(base64Image); // 出错返回原图
        }
      };
      img.onerror = (err) => {
        console.error("Image load error:", err);
        resolve(base64Image);
      };
      img.src = base64Image;
    });
  }

  // 轮询辅助函数 (不再需要)
  // private async pollTaskStatus(taskId: string): Promise<string> { ... }
}

export const geminiService = new GeminiService();
