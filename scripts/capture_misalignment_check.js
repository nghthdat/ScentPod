const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = global.WebSocket || require('ws');
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const artifactDir = '/Users/minmin091299/.gemini/antigravity-ide/brain/fbf92e3f-5923-4a37-b465-cd8ed2e53135';
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9260',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_misalign_' + Date.now(),
    '--window-size=1280,1000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9260/json/version');
      if (res.ok) { wsUrl = (await res.json()).webSocketDebuggerUrl; break; }
    } catch (e) {}
    await sleep(200);
  }

  const cdp = new SimpleCDP(wsUrl);
  await cdp.connect();

  async function createSession(url) {
    const t = await cdp.send('Target.createTarget', { url });
    const a = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
    const sid = a.sessionId;
    function sendS(method, params = {}) {
      const curId = cdp.id++;
      return new Promise((resolve, reject) => {
        cdp.callbacks.set(curId, { resolve, reject });
        cdp.ws.send(JSON.stringify({ id: curId, method, params, sessionId: sid }));
      });
    }
    await sendS('Page.enable');
    return { sendS };
  }

  // 1. san-pham.html #combo section
  const sSanpham = await createSession('http://localhost:8080/san-pham.html');
  await sleep(1500);

  // Scroll to #combo
  await sSanpham.sendS('Runtime.evaluate', {
    expression: `document.getElementById('combo').scrollIntoView({ behavior: 'instant', block: 'start' })`
  });
  await sleep(800);

  const shotCombo = await sSanpham.sendS('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'check_combo_section.png'), Buffer.from(shotCombo.data, 'base64'));
  console.log('Saved check_combo_section.png');

  // Scroll to single products
  await sSanpham.sendS('Runtime.evaluate', {
    expression: `document.querySelector('.product-grid').scrollIntoView({ behavior: 'instant', block: 'start' })`
  });
  await sleep(800);

  const shotSingle = await sSanpham.sendS('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'check_single_grid.png'), Buffer.from(shotSingle.data, 'base64'));
  console.log('Saved check_single_grid.png');

  cdp.close();
  chromeProc.kill();
}

run().catch(console.error);
