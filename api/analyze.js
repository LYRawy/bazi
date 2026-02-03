// api/analyze.js
export const config = {
  runtime: 'edge', // 使用最快的边缘计算模式
};

export default async function handler(req) {
  // 1. 检查是不是 POST 请求
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 2. 获取前端发来的数据
    const { birthDate, birthCity, mbti } = await req.json();

    // 3. 从 Vercel 保险柜里拿钥匙 (用户看不见)
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务端未配置 API Key' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. 组装 Prompt (这里可以偷偷把 DeepSeek 的名字藏起来)
    const prompt = `
      用户画像：
      - 出生时间(公历)：${birthDate}
      - 出生地点：${birthCity} (请参考该地经纬度考虑真太阳时偏差，无需列出计算过程，直接融入分析)
      - MBTI人格：${mbti}

      任务要求：
      请扮演一位"隐世的命理与心理学双修宗师"（不要提及你是AI，也不要提及DeepSeek）。
      请为用户进行【八字命盘】与【潜意识人格】的交叉深度推演。
      
      输出章节：
      1. 🏷️ **原本的你 vs 现在的你** (解析八字日主与MBTI的冲突或共鸣)
      2. ⚔️ **你的内在战争** (结合十神格局，分析内耗根源)
      3. 💰 **搞钱与事业天赋** (哪些行业能让你发财又开心)
      4. ❤️ **情感避坑指南** (你需要什么样的伴侣)
      
      语气风格：一针见血、既有玄学的神秘感，又有心理学的治愈感。Markdown格式排版。
    `;

    // 5. 替用户向 DeepSeek 发请求
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位精通周易与荣格心理学的专家。' },
          { role: 'user', content: prompt }
        ],
        temperature: 1.3 // 让它更有创意一点
      })
    });

    const data = await response.json();

    // 6. 把结果还给前端
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
