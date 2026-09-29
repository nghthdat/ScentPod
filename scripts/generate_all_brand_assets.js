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

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9244',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_assets_' + Date.now(),
    '--window-size=1200,900'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9244/json/version');
      if (res.ok) {
        wsUrl = (await res.json()).webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await sleep(200);
  }

  const cdp = new SimpleCDP(wsUrl);
  await cdp.connect();

  const newTarget = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attachRes = await cdp.send('Target.attachToTarget', { targetId: newTarget.targetId, flatten: true });
  const sessionId = attachRes.sessionId;

  function sendSession(method, params = {}) {
    const curId = cdp.id++;
    return new Promise((resolve, reject) => {
      cdp.callbacks.set(curId, { resolve, reject });
      cdp.ws.send(JSON.stringify({ id: curId, method, params, sessionId }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');

  const badgeImgPath = path.resolve(__dirname, '../images/scentpod-brand-badge.png');
  const badgeBase64 = fs.readFileSync(badgeImgPath).toString('base64');

  const evalRes = await sendSession('Runtime.evaluate', {
    expression: `(async () => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = "data:image/png;base64,${badgeBase64}"; });

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const cvsSrc = document.createElement('canvas');
      cvsSrc.width = w; cvsSrc.height = h;
      const ctxSrc = cvsSrc.getContext('2d', { willReadFrequently: true });
      ctxSrc.drawImage(img, 0, 0);
      const srcData = ctxSrc.getImageData(0, 0, w, h).data;

      // Circle center: cx = 512, cy = 290, radius = 230
      const cx = 512;
      const cy = 290;
      const size = 500;
      const half = size / 2;
      const cropX = cx - half;
      const cropY = cy - half;

      // Sample paper background
      let bgR = 248, bgG = 241, bgB = 232;

      // Helper to generate transparent cutout
      function renderCutout(type) {
        // type: 'gold', 'original', 'white'
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const d = imgData.data;

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const sx = cropX + x;
            const sy = cropY + y;
            if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

            const sIdx = (sy * w + sx) * 4;
            const dIdx = (y * size + x) * 4;

            const r = srcData[sIdx];
            const g = srcData[sIdx + 1];
            const b = srcData[sIdx + 2];

            // Ink difference from paper background
            const diff = (bgR - r) * 0.3 + (bgG - g) * 0.59 + (bgB - b) * 0.11;
            
            // Subtle paper texture noise filter (ignore small dust/mottling < 9)
            if (diff > 9) {
              const alpha = Math.min(255, Math.pow((diff - 9) / 80, 1.05) * 255);

              if (type === 'gold') {
                // Luxury champagne gold gradient from top (#f9d788) to bottom (#e0a23e)
                const t = y / size;
                const gr = Math.round(250 - t * 24);
                const gg = Math.round(218 - t * 52);
                const gb = Math.round(140 - t * 76);
                d[dIdx] = gr;
                d[dIdx + 1] = gg;
                d[dIdx + 2] = gb;
              } else if (type === 'white') {
                d[dIdx] = 255;
                d[dIdx + 1] = 255;
                d[dIdx + 2] = 255;
              } else {
                // Original warm mocha brown: #543b2b
                d[dIdx] = 78;
                d[dIdx + 1] = 53;
                d[dIdx + 2] = 36;
              }
              d[dIdx + 3] = Math.round(alpha);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        return c.toDataURL('image/png');
      }

      // Generate cropped icon mark only (candle + flame + circle, tighter crop)
      function renderMark(type) {
        // Candle + flame is inside x: 440..584, y: 100..380 in 1024x558 space
        // Let's create a 320x320 icon centered on the candle and flame
        const markSize = 320;
        const markCX = 512;
        const markCY = 240; // centered between flame (y=111) and candle base (y=371)
        const mx = markCX - markSize / 2;
        const my = markCY - markSize / 2;

        const c = document.createElement('canvas');
        c.width = markSize;
        c.height = markSize;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(markSize, markSize);
        const d = imgData.data;

        for (let y = 0; y < markSize; y++) {
          for (let x = 0; x < markSize; x++) {
            const sx = mx + x;
            const sy = my + y;
            if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

            // Exclude text below (y > 385 in global coords)
            if (sy > 380) continue;

            const sIdx = (sy * w + sx) * 4;
            const dIdx = (y * markSize + x) * 4;

            const r = srcData[sIdx];
            const g = srcData[sIdx + 1];
            const b = srcData[sIdx + 2];

            const diff = (bgR - r) * 0.3 + (bgG - g) * 0.59 + (bgB - b) * 0.11;
            if (diff > 9) {
              const alpha = Math.min(255, Math.pow((diff - 9) / 80, 1.05) * 255);
              if (type === 'gold') {
                const t = y / markSize;
                const gr = Math.round(250 - t * 24);
                const gg = Math.round(218 - t * 52);
                const gb = Math.round(140 - t * 76);
                d[dIdx] = gr;
                d[dIdx + 1] = gg;
                d[dIdx + 2] = gb;
              } else {
                d[dIdx] = 78;
                d[dIdx + 1] = 53;
                d[dIdx + 2] = 36;
              }
              d[dIdx + 3] = Math.round(alpha);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        return c.toDataURL('image/png');
      }

      // Circular badge with parchment paper texture
      const badgeCvs = document.createElement('canvas');
      badgeCvs.width = 500;
      badgeCvs.height = 500;
      const bCtx = badgeCvs.getContext('2d');
      bCtx.beginPath();
      bCtx.arc(250, 250, 240, 0, Math.PI * 2);
      bCtx.clip();
      bCtx.drawImage(img, cropX, cropY, size, size, 0, 0, 500, 500);

      return {
        goldPng: renderCutout('gold'),
        mochaPng: renderCutout('original'),
        whitePng: renderCutout('white'),
        markGoldPng: renderMark('gold'),
        markMochaPng: renderMark('original'),
        badgePng: badgeCvs.toDataURL('image/png')
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const res = evalRes.result.value;

  function save(b64, name) {
    const raw = b64.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.resolve(__dirname, '../images', name), Buffer.from(raw, 'base64'));
    console.log('Saved images/' + name);
  }

  save(res.goldPng, 'scentpod-logo-gold.png');
  save(res.mochaPng, 'scentpod-logo-transparent.png');
  save(res.whitePng, 'scentpod-logo-white.png');
  save(res.markGoldPng, 'scentpod-logo-mark-gold.png');
  save(res.markMochaPng, 'scentpod-logo-mark.png');
  save(res.badgePng, 'scentpod-logo-badge.png');

  cdp.close();
  chromeProc.kill();
  console.log('All brand assets successfully generated!');
}

main().catch(console.error);
