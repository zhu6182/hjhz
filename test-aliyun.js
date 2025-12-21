
// 本地测试脚本：测试阿里云 Key 是否有效
// 运行方法：node test-aliyun.js

const apiKey = "sk-1c829a6cab1a462181f6ff268f067995"; // 你的 Key

async function test() {
  console.log("Testing Aliyun API...");

  try {
    // 测试通义万相-图像生成 (最基础的功能)
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        input: {
          prompt: "A beautiful wooden chair, realistic photo",
        },
        parameters: {
          size: '1024*1024',
          n: 1
        }
      })
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("API Call Failed!");
    } else {
      console.log("API Call Successful! Task ID:", data.output?.task_id);
    }

  } catch (error) {
    console.error("Network Error:", error);
  }
}

test();
