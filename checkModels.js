
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Node 18+ has native fetch, but sometimes it fails in certain envs.
// We can try to rely on native fetch first.

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.config({ path: envPath });
const apiKey = process.env.GEMINI_API_KEY;

console.log("Checking models with API Key ending in:", apiKey ? apiKey.slice(-4) : "None");


if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    console.error("Please set a valid GEMINI_API_KEY in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

async function listModels() {
  try {
    const response = await ai.models.list();
    
    console.log("\nAvailable Models:");
    const models = [];
    // The response structure depends on the SDK version, usually it's an async iterable or has a 'models' property
    // For @google/genai 1.x it might be different from @google/generative-ai
    // Let's try to iterate if it's iterable, or print it
    
    // In @google/genai (new SDK), models.list returns a response object
    if (response && response.models) {
        for (const model of response.models) {
            models.push(model);
        }
    } else {
        // Fallback or just print structure
        console.log("Response structure:", Object.keys(response));
    }

    // Filter for likely image generation models
    const imageModels = models.filter(m => 
        m.name.includes('image') || 
        m.name.includes('vision') || 
        m.supportedGenerationMethods?.includes('generateImage') ||
        m.supportedGenerationMethods?.includes('image')
    );

    console.log("\n--- All Models ---");
    models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));

    console.log("\n--- Likely Image Gen Models ---");
    imageModels.forEach(m => console.log(`- ${m.name}`));

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
