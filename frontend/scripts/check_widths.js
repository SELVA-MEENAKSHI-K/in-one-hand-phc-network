import fs from 'fs';

async function main() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const cur = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) {
        ws.removeEventListener('message', handler);
        if (d.error) rej(d.error); else res(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  const widths = [1440, 1280, 1024, 768, 500, 390];
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
    await delay(500);

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const ret = {};
        ret.width = window.innerWidth;
        ret.scrollWidth = document.documentElement.scrollWidth;
        ret.hasHScroll = document.documentElement.scrollWidth > window.innerWidth;
        
        const sidebar = document.querySelector('.app-sidebar');
        const main = document.querySelector('.app-main-wrapper');
        const content = document.querySelector('.app-main-content');
        const header = document.querySelector('.app-header');
        
        ret.sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
        ret.mainRect = main ? main.getBoundingClientRect() : null;
        ret.contentRect = content ? content.getBoundingClientRect() : null;
        ret.headerRect = header ? header.getBoundingClientRect() : null;
        
        const overflowing = [];
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 2) {
            overflowing.push({
              tag: el.tagName,
              className: (typeof el.className === 'string' ? el.className.slice(0, 40) : ''),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            });
          }
        }
        ret.overflowingCount = overflowing.length;
        ret.overflowingSamples = overflowing.slice(0, 5);
        return ret;
      })()`,
      returnByValue: true
    });

    console.log('WIDTH', w, ':', JSON.stringify(evalRes.result.value, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\screen_${w}.png`, Buffer.from(ss.data, 'base64'));
  }

  ws.close();
}

main().catch(console.error);
