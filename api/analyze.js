// api/analyze.js
export const config = {
  runtime: 'edge', // 速度保障
};

export default async function handler(req) {
  // 1. 跨域设置
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

    // 2. 呼叫 DeepSeek (治愈系深度版)
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
            content: '你是一位温暖睿智的人生导师，精通八字命理与积极心理学。你的语言风格：优雅、深刻、充满力量与希望。你要挖掘求测者未被发现的潜能，将性格冲突解读为成长的契机。' 
          },
          { 
            role: 'user', 
            content: `请为这位求测者撰写一份“人生潜能挖掘报告”：${birthDate}生于${birthCity}，MBTI为${mbti}。
            
            请直接输出以下3个维度的深度解析（总字数控制在450字左右，确保精炼且不超时）：
            
            1. ✨【你的光芒所在】
            结合八字日主与MBTI，指出他性格中最珍贵、最动人的特质是什么？（夸得具体、高级）
            
            2. ⚔️【被误解的弱点】
            他通常认为自己的某个缺点（如敏感、固执等），在什么情况下其实是顶级的天赋？
            
            3. 🚀【给未来的信】
            给出一段富有哲理的建议，告诉他如何在接下来的日子里活出更舒展的自己。
            
            注意：拒绝说教，拒绝负面预测，要让他读完觉得浑身充满力量。` 
          }
        ],
        max_tokens: 650, 
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
