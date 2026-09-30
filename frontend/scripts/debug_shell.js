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

  // Emulate exact user viewport: 1366 x 633
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 633,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 500));

  // Take screenshot
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/ELCOT/.gemini/antigravity-ide/brain/70e1994e-dda3-4960-9588-09caee002a83/debug_1366x633.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved debug_1366x633.png');

  // Inspect the app shell elements
  const layoutInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const sel = [
        'html',
        'body',
        '#root',
        '.app-viewport-shell',
        '.app-container',
        '.app-sidebar',
        '.app-main-wrapper',
        '.app-main-content',
        '.app-header',
        '.header-top',
        '.header-actions',
        '.header-content'
      ];
      const elements = {};
      for (const s of sel) {
        const el = document.querySelector(s);
        if (el) {
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          elements[s] = {
            rect: { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), top: Math.round(r.top) },
            position: cs.position,
            display: cs.display,
            marginLeft: cs.marginLeft,
            marginRight: cs.marginRight,
            paddingLeft: cs.paddingLeft,
            paddingRight: cs.paddingRight,
            left: cs.left,
            width: cs.width,
            minWidth: cs.minWidth,
            maxWidth: cs.maxWidth,
            flex: cs.flex,
            transform: cs.transform
          };
        }
      }

      // Check which elements extend beyond 1366
      const overflowEls = [];
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 2) {
          overflowEls.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            id: el.id,
            right: Math.round(r.right),
            width: Math.round(r.width),
            left: Math.round(r.left)
          });
        }
      }

      return {
        windowWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        elements,
        overflowCount: overflowEls.length,
        overflowSample: overflowEls.slice(0, 10)
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(layoutInfo.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
