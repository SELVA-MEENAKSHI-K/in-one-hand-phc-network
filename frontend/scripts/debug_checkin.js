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

  // Emulate 500x693 (or 390x844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  await delay(500);

  // Navigate to medicines tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Medicine'));
      if (btn) btn.click();
    })()`
  });
  await delay(800);

  // Check sub-tab Check-In
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tab = Array.from(document.querySelectorAll('.sub-tab')).find(b => b.innerText.includes('Check-In'));
      if (tab) tab.click();
    })()`
  });
  await delay(800);

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const elements = [
        'html',
        'body',
        '#root',
        '.app-viewport-shell',
        '.app-container',
        '.app-sidebar',
        '.app-main-wrapper',
        '.app-header',
        '.app-main-content',
        '.medicines-page',
        '.transaction-form-card',
        '.mobile-bottom-thumb-nav'
      ];
      const res = {};
      for (const sel of elements) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          res[sel] = {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            computedWidth: s.width,
            marginLeft: s.marginLeft,
            marginRight: s.marginRight,
            paddingLeft: s.paddingLeft,
            paddingRight: s.paddingRight,
            boxSizing: s.boxSizing,
            position: s.position,
            transform: s.transform
          };
        }
      }
      return res;
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(evalRes.result.value, null, 2));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\debug_checkin_390.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved debug_checkin_390.png');

  ws.close();
}

main().catch(console.error);
