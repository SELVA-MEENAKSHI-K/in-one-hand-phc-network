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

  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector('.app-sidebar');
      if (!el) return null;
      // remove any inline style that test_none put
      el.removeAttribute('style');
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        className: el.className,
        transform: s.transform,
        visibility: s.visibility,
        left: s.left,
        rect: { left: r.left, right: r.right, width: r.width, top: r.top, bottom: r.bottom }
      };
    })()`
  });

  console.log('Clean Live Style:', JSON.stringify(res.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
