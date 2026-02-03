// api/analyze.js
export default async function handler(req, res) {
  // 1. 允许跨域调用 (解决一部分连接问题)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 检查请求方式
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { birthDate, birthCity, mbti } = req.body;

    // 3. 检查 Key 是否存在 (关键！)
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("错误：服务端未找到 API Key"); // 这行会显示在 Vercel Logs 里
      return res.status(500).json({ error: '服务端配置错误：未找到 API Key，请在 Vercel Settings 检查环境变量' });
    }

    console.log("正在请求 DeepSeek..."); // 记录日志

    // 4. 发起请求
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位精通八字与心理学的专家。' },
          { role: 'user', content: `分析用户：${birthDate}出生于${birthCity}，MBTI为${mbti}。请给出八字与性格的简短深度分析。` }
        ],
        stream: false
      })
    });

    // 5. 检查 DeepSeek 是否拒绝了我们
    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API 报错:", errorText);
      return res.status(response.status).json({ error: `DeepSeek 报错: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("服务器内部错误:", error);
    return res.status(500).json({ error: `服务器内部错误: ${error.message}` });
  }
}
