const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_combo_demo_' + Date.now(),
    '--window-size=1400,1000'
  ]);

  await sleep(1500);

  try {
    const res = await fetch('http://localhost:9230/json');
    const tabs = await res.json();
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const cdp = new SimpleCDP(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    // 1. Navigate to san-pham.html
    console.log('Navigating to san-pham.html...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8080/san-pham.html#combo' });
    await sleep(2000);

    // Scroll directly to #combo section
    await cdp.send('Runtime.evaluate', {
      expression: `
        const combo = document.getElementById('combo');
        if (combo) combo.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await sleep(800);

    // Capture screenshot of #combo section
    const evalCombo = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('combo');
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { x: rect.left, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
        })()
      `,
      returnByValue: true
    });

    if (evalCombo.result && evalCombo.result.value) {
      const box = evalCombo.result.value;
      const ss1 = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 20),
          width: box.width + 40,
          height: box.height + 40,
          scale: 1.5
        }
      });
      fs.writeFileSync(path.join(artifactDir, 'combo_strategic_cards_new.png'), Buffer.from(ss1.data, 'base64'));
      console.log('Saved combo_strategic_cards_new.png');
    }

    // 2. Capture the top of san-pham.html to verify Table 1 is gone
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 0);`
    });
    await sleep(600);

    const ss2 = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1400,
        height: 800,
        scale: 1.5
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'san_pham_no_table_top.png'), Buffer.from(ss2.data, 'base64'));
    console.log('Saved san_pham_no_table_top.png');

    cdp.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
