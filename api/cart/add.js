const { addToCart } = require('../../scripts/ai_shopping_assistant');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

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

  const sessionId = (body && body.sessionId) || req.headers['x-session-id'] || 'sess_default';
  const productId = body && body.productId;
  const quantity = parseInt(body && body.quantity, 10) || 1;

  const result = addToCart(sessionId, productId, quantity);
  res.statusCode = result.success ? 200 : 400;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result));
};

