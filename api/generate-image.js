
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { action, image_url, prompt, task_id } = await req.json();
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server config error: Missing DASHSCOPE_API_KEY' }), { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable'
    };

    // 场景 1: 提交任务
    if (action === 'submit') {
      if (!image_url || !prompt) {
        return new Response(JSON.stringify({ error: 'Missing image_url or prompt' }), { status: 400 });
      }

      // 通义万相 - 图像风格重绘 (wanx-style-repaint-v1)
      // 或者使用通义万相-涂鸦作画/图像编辑，视具体需求。
      // 这里使用 style-repaint 尝试保留结构改风格/颜色。
      const body = {
        model: 'wanx-style-repaint-v1',
        input: {
          image_url: image_url,
          style_index: 0 // 0 表示复刻原图结构，主要改风格
        },
        parameters: {
          style_prompt: prompt, // 例如 "Wooden texture, walnut color"
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
      return new Response(JSON.stringify(data), { status: 200 });
    }

    // 场景 2: 查询任务状态
    if (action === 'check') {
      if (!task_id) {
        return new Response(JSON.stringify({ error: 'Missing task_id' }), { status: 400 });
      }

      const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

  } catch (error) {
    console.error('Aliyun API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
