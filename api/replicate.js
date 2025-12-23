
// api/replicate.js
export const config = {
  maxDuration: 60, // 增加超时时间，图片生成需要时间
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      const hasToken = !!replicateToken;
      let authOk = false;
      let detail = null;
      if (hasToken) {
        const headers = {
          "Authorization": `Token ${replicateToken}`,
          "Content-Type": "application/json",
        };
        const ping = await fetch("https://api.replicate.com/v1/models/google/imagen-3-fast", { headers });
        authOk = ping.ok;
        if (!authOk) {
          const body = await ping.json().catch(() => null);
          detail = body?.detail || `HTTP ${ping.status}`;
        }
      }
      return res.status(200).json({ ok: true, hasToken, authOk, detail });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_url, prompt, model, aspect_ratio, safety_filter_level } = req.body;
    
    // 使用 Replicate API Token
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return res.status(500).json({ error: 'Server config error: Missing REPLICATE_API_TOKEN' });
    }

    const headers = {
      "Authorization": `Token ${replicateToken}`,
      "Content-Type": "application/json",
    };

    let version = null;
    let input = null;
    let useImagen = model === 'google/imagen-3-fast';
    let useNanoBanana = model === 'google/nano-banana';

    if (useImagen) {
      if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
      }

      const modelResp = await fetch("https://api.replicate.com/v1/models/google/imagen-3-fast", {
        headers,
      });
      const modelInfo = await modelResp.json();
      if (!modelResp.ok) {
        return res.status(500).json({ error: modelInfo.detail || 'Failed to get model info' });
      }
      version = (modelInfo.latest_version && modelInfo.latest_version.id) || null;
      if (!version) {
        return res.status(500).json({ error: 'Failed to resolve model version' });
      }

      input = {
        prompt,
        aspect_ratio: aspect_ratio || '16:9',
        safety_filter_level: safety_filter_level || 'block_medium_and_above',
      };
    } else if (useNanoBanana) {
      if (!prompt || !image_url) {
        return res.status(400).json({ error: 'Missing image_url or prompt' });
      }
      const modelResp = await fetch("https://api.replicate.com/v1/models/google/nano-banana", {
        headers,
      });
      const modelInfo = await modelResp.json();
      if (!modelResp.ok) {
        return res.status(500).json({ error: modelInfo.detail || 'Failed to get model info' });
      }
      version = (modelInfo.latest_version && modelInfo.latest_version.id) || null;
      if (!version) {
        return res.status(500).json({ error: 'Failed to resolve model version' });
      }
      input = {
        prompt,
        image_input: [image_url],
      };
    } else {
      if (!image_url || !prompt) {
        return res.status(400).json({ error: 'Missing image_url or prompt' });
      }
      console.log('Starting Replicate generation with prompt:', prompt);

      const modelVersion = "aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613";
      version = modelVersion;
      input = {
        image: image_url,
        prompt: prompt + ", photorealistic, interior design, high quality, 8k",
        a_prompt: "best quality, extremely detailed",
        n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, cartoon, painting, illustration",
        num_samples: 1,
        image_resolution: 512,
        ddim_steps: 20,
        scale: 9,
        eta: 0,
      };
    }
    
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        version,
        input,
      }),
    });

    const startData = await startResponse.json();
    
    if (startResponse.status !== 201) {
      console.error("Replicate Error:", startData);
      return res.status(500).json({ error: startData.detail || "Failed to start prediction" });
    }

    const predictionId = startData.id;
    console.log("Prediction started, ID:", predictionId);

    // 2. 轮询结果 (Vercel Function 有执行时间限制，这里简单轮询几次)
    // 如果超时，让前端继续轮询或处理
    let prediction = startData;
    let attempts = 0;
    
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      attempts < 30 // 最多轮询 30 次 (约 30-60秒)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 等 2 秒
      attempts++;

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            "Authorization": `Token ${replicateToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      prediction = await pollResponse.json();
      console.log(`Polling status: ${prediction.status}`);
    }

    if (prediction.status === "succeeded") {
      return res.status(200).json({ output: prediction.output });
    } else {
      return res.status(500).json({ error: `Prediction failed or timed out: ${prediction.status}` });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
