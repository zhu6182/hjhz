
// 移除 edge runtime，使用默认的 nodejs runtime，兼容性更好
export const config = {
  maxDuration: 60, // 增加超时时间
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, image_url, prompt, task_id } = req.body;
    
    // 直接硬编码 Key，排除环境变量读取失败的可能性
    // 注意：这是不推荐的实践，但为了排查问题先这样，确认能跑通后再改回环境变量
    const apiKey = "sk-1c829a6cab1a462181f6ff268f067995";

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable'
    };

    // 场景 1: 提交任务
    if (action === 'submit') {
      if (!image_url || !prompt) {
        return res.status(400).json({ error: 'Missing image_url or prompt' });
      }

      console.log('Submitting task to Aliyun:', { image_url, prompt });

      // 优化：使用更强的 Prompt 约束，并尝试调整参数以获得更写实的效果
      const body = {
        model: 'wanx-style-repaint-v1',
        input: {
          image_url: image_url,
          style_index: 0 // 0: 复刻原图结构
        },
        parameters: {
          // 强化写实风格，强调材质替换而非风格转换
          style_prompt: `${prompt}, photorealistic, detailed texture, 8k resolution, interior design photography, keep original structure`,
          size: '1024*1024',
          n: 1
        }
      };

      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Aliyun API Error Response:', data);
        return res.status(500).json({ error: data.message || data.code || 'Aliyun API failed' });
      }

      return res.status(200).json(data);
    }

    // 场景 2: 查询任务状态
    if (action === 'check') {
      if (!task_id) {
        return res.status(400).json({ error: 'Missing task_id' });
      }

      const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
