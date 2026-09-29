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
    '--remote-debugging-port=9230',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_logo_proc_' + Date.now(),
    '--window-size=1200,900'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9230/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await sleep(200);
  }

  if (!wsUrl) {
    chromeProc.kill();
    console.error('Không thể kết nối Chrome CDP');
    process.exit(1);
  }

  const cdp = new SimpleCDP(wsUrl);
  await cdp.connect();

  const newTarget = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const attachRes = await cdp.send('Target.attachToTarget', { targetId: newTarget.targetId, flatten: true });
  const sessionId = attachRes.sessionId;

  async function sendSession(method, params = {}) {
    const id = cdp.id++;
    return new Promise((resolve, reject) => {
      cdp.callbacks.set(id, { resolve, reject });
      cdp.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');

  // Read the uploaded brand badge file as base64
  const badgeImgPath = path.resolve(__dirname, '../images/scentpod-brand-badge.png');
  const badgeBase64 = fs.readFileSync(badgeImgPath).toString('base64');
  const dataUrl = `data:image/png;base64,${badgeBase64}`;

  // Evaluate script to process image
  const evaluationResult = await sendSession('Runtime.evaluate', {
    expression: `(async () => {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = "${dataUrl}";
      });

      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // First canvas to measure & extract center
      const cvs = document.createElement('canvas');
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample paper background color from corners
      // Top-left average
      let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
      for (let y = 10; y < 50; y++) {
        for (let x = 10; x < 50; x++) {
          const idx = (y * w + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
          bgCount++;
        }
      }
      bgR /= bgCount;
      bgG /= bgCount;
      bgB /= bgCount;

      // Find the circular emblem bounds
      // Center is around x=512, y=279
      // Let's create:
      // 1. Transparent PNG of the emblem (dark brown lines preserved, paper transparent)
      // 2. Champagne gold version for dark mode (#f3c677 / #e5a93b)
      // 3. Circular badge cut

      // Create cropped emblem canvas (square centered on circle)
      // Circle diameter is approx 460px
      const emblemSize = 480;
      const startX = Math.round((w - emblemSize) / 2);
      const startY = Math.round((h - emblemSize) / 2);

      // Function to process pixel: calculate opacity of ink
      function makeTransparentCanvas(gold = false) {
        const outCvs = document.createElement('canvas');
        outCvs.width = emblemSize;
        outCvs.height = emblemSize;
        const outCtx = outCvs.getContext('2d');
        const outImgData = outCtx.createImageData(emblemSize, emblemSize);
        const outData = outImgData.data;

        for (let y = 0; y < emblemSize; y++) {
          for (let x = 0; x < emblemSize; x++) {
            const srcX = startX + x;
            const srcY = startY + y;
            const srcIdx = (srcY * w + srcX) * 4;
            const dstIdx = (y * emblemSize + x) * 4;

            const r = data[srcIdx];
            const g = data[srcIdx + 1];
            const b = data[srcIdx + 2];

            // Distance from paper background
            // Background is around 245, 240, 230
            // Dark ink is around 90, 60, 40
            const diff = (bgR - r) * 0.3 + (bgG - g) * 0.59 + (bgB - b) * 0.11;
            
            // Calculate alpha smoothly
            let alpha = 0;
            if (diff > 8) {
              alpha = Math.min(255, Math.pow((diff - 8) / 75, 1.1) * 255);
            }

            if (alpha > 0) {
              if (gold) {
                // Gold gradient / luxury champagne: #f5cf82 to #df9f38
                const gradRatio = y / emblemSize;
                const gr = Math.round(245 - gradRatio * 20);
                const gg = Math.round(207 - gradRatio * 45);
                const gb = Math.round(130 - gradRatio * 70);
                outData[dstIdx] = gr;
                outData[dstIdx + 1] = gg;
                outData[dstIdx + 2] = gb;
              } else {
                // Original rich dark mocha brown #543b2b
                outData[dstIdx] = 78;
                outData[dstIdx + 1] = 53;
                outData[dstIdx + 2] = 36;
              }
              outData[dstIdx + 3] = Math.round(alpha);
            } else {
              outData[dstIdx + 3] = 0;
            }
          }
        }
        outCtx.putImageData(outImgData, 0, 0);
        return outCvs.toDataURL('image/png');
      }

      // Also create a circular badge crop of the original paper texture
      const badgeCvs = document.createElement('canvas');
      badgeCvs.width = emblemSize;
      badgeCvs.height = emblemSize;
      const bCtx = badgeCvs.getContext('2d');
      bCtx.beginPath();
      bCtx.arc(emblemSize/2, emblemSize/2, emblemSize/2 - 2, 0, Math.PI * 2);
      bCtx.closePath();
      bCtx.clip();
      bCtx.drawImage(img, startX, startY, emblemSize, emblemSize, 0, 0, emblemSize, emblemSize);
      const circleBadgeDataUrl = badgeCvs.toDataURL('image/png');

      const transPng = makeTransparentCanvas(false);
      const goldPng = makeTransparentCanvas(true);

      return {
        w, h,
        bg: { bgR, bgG, bgB },
        transPng,
        goldPng,
        circleBadgeDataUrl
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const resVal = evaluationResult.result.value;
  console.log('Background sampled:', resVal.bg);

  // Save generated images
  function saveBase64Png(base64Data, filename) {
    const raw = base64Data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.resolve(__dirname, '../images', filename), Buffer.from(raw, 'base64'));
    console.log('Saved images/' + filename);
  }

  saveBase64Png(resVal.transPng, 'scentpod-logo-transparent.png');
  saveBase64Png(resVal.goldPng, 'scentpod-logo-gold.png');
  saveBase64Png(resVal.circleBadgeDataUrl, 'scentpod-logo-badge.png');

  cdp.close();
  chromeProc.kill();
  console.log('Hoàn thành xử lý ảnh logo!');
}

main().catch(console.error);
