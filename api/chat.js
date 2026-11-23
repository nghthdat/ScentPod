const { generateAdvisorResponse, loadCatalog } = require('../scripts/ai_shopping_assistant');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) { body = {}; }
    } else if (!body) {
      body = await new Promise(resolve => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); }
        });
      });
    }

    const sessionId = (body && body.sessionId) || req.headers['x-session-id'] || 'sess_' + Date.now();
    const userMessage = (body && (body.message || body.query)) || '';
    const history = (body && body.history) || [];

    if (!userMessage.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, error: 'Tin nhắn không được để trống.' }));
      return;
    }

    const result = await generateAdvisorResponse({
      sessionId,
      message: userMessage,
      history
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: true,
      ...result
    }));
  } catch (err) {
    console.error('[Vercel API /api/chat Error]:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: true,
      sessionId: req.headers['x-session-id'] || 'sess_fallback',
      reply: 'Chào bạn! Kết nối AI đang chuyển sang chế độ dự phòng. Dưới đây là 4 mùi nến thơm 50g chính thức của ScentPod (đồng giá 85.000đ/hũ) rất hợp gu sinh viên!',
      suggestedProducts: (loadCatalog().products || []).slice(0, 4)
    }));
  }
};

