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

  // Emulate 500x693 (the exact user viewport from prompt metadata!)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 500,
    height: 693,
    deviceScaleFactor: 1,
    mobile: true
  });

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  await delay(1000);

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const ret = {};
      ret.viewport = { innerWidth: window.innerWidth, innerHeight: window.innerHeight };
      ret.doc = { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
      
      const elSelectors = [
        '.app-viewport-shell',
        '.app-container',
        '.app-sidebar',
        '.app-main-wrapper',
        '.app-header',
        '.header-top',
        '.header-left-cluster',
        '.header-actions',
        '.app-main-content'
      ];
      
      ret.elements = {};
      for (const sel of elSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          ret.elements[sel] = {
            rect: { left: rect.left, right: rect.right, width: rect.width, height: rect.height },
            width: style.width,
            position: style.position,
            transform: style.transform,
            display: style.display,
            flexDirection: style.flexDirection,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
            marginLeft: style.marginLeft,
            marginRight: style.marginRight
          };
        }
      }

      // Check all overflowing elements
      const overflowing = [];
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 2) {
          overflowing.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
            left: rect.left,
            right: rect.right,
            width: rect.width
          });
        }
      }
      ret.overflowing = overflowing.slice(0, 15);
      return ret;
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(evalRes.result.value, null, 2));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\debug_500px.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved debug_500px.png');

  ws.close();
}

main().catch(console.error);
