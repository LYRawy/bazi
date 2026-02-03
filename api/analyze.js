// api/analyze.js
export const config = {
  runtime: 'edge', // 必须保留 Edge 模式
};

export default async function handler(req) {
  // 1. 跨域处理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 2. 请求方法检查
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { birthDate, birthCity, mbti } = await req.json();
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No API Key found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. 呼叫 DeepSeek (字数挑战版)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是精通八字与MBTI的性格分析专家，说话犀利、准确。' },
          // 修改点：请求约 400 字，争取在 25s 内卡点完成
          { role: 'user', content: `请详细分析：${birthDate}出生于${birthCity}，MBTI为${mbti}的人。请结合八字五行和心理学，给出约400字的深度性格解析，不要废话。` }
        ],
        max_tokens: 800, // 放宽 Token 限制，允许生成更多内容
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `DeepSeek Error: ${errorText}` }), {
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });
  }
}
