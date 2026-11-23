const { getCart, addToCart, updateCart, clearCart } = require('../scripts/ai_shopping_assistant');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const sessionId = url.searchParams.get('sessionId') || req.headers['x-session-id'] || 'sess_default';

  if (req.method === 'GET') {
    const cart = getCart(sessionId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: true, ...cart }));
    return;
  }

  if (req.method === 'POST') {
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

    const sess = (body && body.sessionId) || sessionId;
    const action = (body && body.action) || url.searchParams.get('action') || '';
    const productId = body && body.productId;
    const quantity = body && parseInt(body.quantity, 10);

    let result;
    if (action === 'clear' || url.pathname.endsWith('/clear')) {
      result = clearCart(sess);
    } else if (action === 'update' || url.pathname.endsWith('/update')) {
      result = updateCart(sess, productId, quantity);
    } else {
      // Default: add
      result = addToCart(sess, productId, isNaN(quantity) ? 1 : quantity);
    }

    res.statusCode = result.success ? 200 : 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result));
    return;
  }

  res.statusCode = 405;
  res.end();
};

