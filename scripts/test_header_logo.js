const { spawn } = require('child_process');
const fs = require('fs');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9254',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_hdrlogo_' + Date.now(),
    '--window-size=1280,800'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9254/json/version');
      if (res.ok) { wsUrl = (await res.json()).webSocketDebuggerUrl; break; }
    } catch (e) {}
    await sleep(200);
  }

  const WebSocket = global.WebSocket || require('ws');
  const ws = new WebSocket(wsUrl);
  await new Promise(res => ws.onopen = res);

  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(new Error(msg.error.message));
      else cb.resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    const curId = id++;
    return new Promise((resolve, reject) => {
      callbacks.set(curId, { resolve, reject });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  const newTarget = await send('Target.createTarget', { url: 'http://localhost:8080/index.html' });
  const attach = await send('Target.attachToTarget', { targetId: newTarget.targetId, flatten: true });
  const sessionId = attach.sessionId;

  function sendSession(method, params = {}) {
    const curId = id++;
    return new Promise((resolve, reject) => {
      callbacks.set(curId, { resolve, reject });
      ws.send(JSON.stringify({ id: curId, method, params, sessionId }));
    });
  }

  await sendSession('Page.enable');
  await sleep(1500);

  // Dynamically test injecting the new logo into the navbar
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const brandLogo = document.querySelector('.brand-logo');
      if (brandLogo) {
        brandLogo.innerHTML = '<img src="images/scentpod-logo-gold.png" alt="ScentPod" class="brand-logo-img" style="height: 44px; width: 44px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(229,169,59,0.5));"><span>Scent<span class="accent">Pod</span></span>';
      }
    })()`
  });

  await sleep(500);

  const shot = await sendSession('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 1280, height: 260, scale: 1 }
  });

  const artifactDir = '/Users/minmin091299/.gemini/antigravity-ide/brain/fbf92e3f-5923-4a37-b465-cd8ed2e53135';
  fs.writeFileSync(artifactDir + '/navbar_new_logo_live_test.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved navbar_new_logo_live_test.png');

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
