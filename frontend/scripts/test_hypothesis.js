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

  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise(r => setTimeout(r, 1200));

  // Click hamburger
  await send('Runtime.evaluate', {
    expression: 'document.querySelector(".btn-sidebar-mobile-toggle").click();'
  });
  await new Promise(r => setTimeout(r, 300));

  // Now capture a screenshot (which forces a full GPU compositing frame)
  await send('Page.captureScreenshot', { format: 'png' });

  // Now check transform and rect
  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector('.app-sidebar');
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return {
        className: el.className,
        rect: { left: r.left, top: r.top, right: r.right, width: r.width },
        transform: s.transform,
        visibility: s.visibility
      };
    })()`
  });

  console.log('Result after frame render:', JSON.stringify(res.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
