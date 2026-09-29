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
    '--remote-debugging-port=9258',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_showcase_' + Date.now(),
    '--window-size=1280,850'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9258/json/version');
      if (res.ok) { wsUrl = (await res.json()).webSocketDebuggerUrl; break; }
    } catch (e) {}
    await sleep(200);
  }

  const cdp = new SimpleCDP(wsUrl);
  await cdp.connect();

  async function createSession(url, width = 1280, height = 850) {
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
    await sendS('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 600
    });
    return { sendS, targetId: t.targetId };
  }

  // 1. Homepage desktop navbar
  console.log('Chụp trang chủ desktop...');
  const sHome = await createSession('http://localhost:8080/index.html');
  await sleep(1500);
  const shotHomeHdr = await sHome.sendS('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 1280, height: 260, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'new_logo_navbar_home.png'), Buffer.from(shotHomeHdr.data, 'base64'));

  // 1.2 Footer on homepage
  const shotHomeFtr = await sHome.sendS('Page.captureScreenshot', {
    clip: { x: 0, y: 550, width: 1280, height: 300, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'new_logo_footer_home.png'), Buffer.from(shotHomeFtr.data, 'base64'));

  // 2. Về chúng tôi - Brand identity card
  console.log('Chụp trang Về chúng tôi...');
  const sAbout = await createSession('http://localhost:8080/ve-chung-toi.html');
  await sleep(1500);
  
  // Scroll to brand identity card
  await sAbout.sendS('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.brand-identity-card');
      if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(600);
  const shotAboutCard = await sAbout.sendS('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'new_logo_about_identity.png'), Buffer.from(shotAboutCard.data, 'base64'));

  // 3. Mobile navbar
  console.log('Chụp mobile navbar...');
  const sMob = await createSession('http://localhost:8080/index.html', 390, 844);
  await sleep(1500);
  const shotMob = await sMob.sendS('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 390, height: 160, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'new_logo_mobile_navbar.png'), Buffer.from(shotMob.data, 'base64'));

  console.log('Hoàn thành chụp các ảnh showcase!');
  cdp.close();
  chromeProc.kill();
}

run().catch(console.error);
