// api/analyze.js
export const config = {
  runtime: 'edge', // 保持 Edge 模式，这是速度的关键
};

export default async function handler(req) {
  // 1. 跨域处理 (保持不变)
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

    // 2. 呼叫 DeepSeek (深度大师版)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: '你是一位精通《三命通会》与荣格心理学的资深咨询师。你的风格是：一针见血、不讲客套话、直击灵魂深处的矛盾。拒绝泛泛而谈的巴纳姆效应，必须结合八字格局给出具体的痛点分析。' 
          },
          { 
            role: 'user', 
            content: `请深度剖析这位求测者：${birthDate}出生于${birthCity}，MBTI为${mbti}。
            
            请从以下三个维度进行约 600 字的深度推演：
            1. 【核心冲突】：结合八字日主与MBTI，揭露他内心最深层的纠结是什么？（如：表面的温和与内心的狂野）
            2. 【情感宿命】：他在亲密关系中重复犯的错误模式是什么？
            3. 【觉醒建议】：不要给鸡汤，给出一条虽然痛苦但能让他蜕变的具体建议。
            
            要求：排版清晰，语气如老友夜谈，深刻且动人。` 
          }
        ],
        max_tokens: 1200, // 增加 Token 上限，允许它写长文
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `DeepSeek Error: ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
