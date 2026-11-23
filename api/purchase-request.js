const { submitPurchaseRequest } = require('../scripts/ai_shopping_assistant');

// In-flight concurrency lock to prevent duplicate submissions
const inFlightLocks = new Set();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

  const rawSession = req.headers['x-session-id'] || 'sess_default';

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

    const sessionId = (body && body.sessionId) || rawSession;
    const customerInfo = (body && (body.customerInfo || body.orderInfo)) || body || {};

    if (inFlightLocks.has(sessionId)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        success: false,
        error: 'Yêu cầu của bạn đang được xử lý, vui lòng không nhấn gửi liên tiếp.'
      }));
      return;
    }

    inFlightLocks.add(sessionId);

    try {
      const result = await submitPurchaseRequest(sessionId, customerInfo);
      const statusCode = result.success ? 200 : 400;
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(result));
    } finally {
      inFlightLocks.delete(sessionId);
    }
  } catch (err) {
    console.error('[API /api/purchase-request Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: false,
      error: 'Lỗi máy chủ khi xử lý yêu cầu mua hàng: ' + err.message
    }));
  }
};

