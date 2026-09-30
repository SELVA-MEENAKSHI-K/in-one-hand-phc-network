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
      el.style.transform = 'none';
      el.style.left = '0px';
      el.style.visibility = 'visible';
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return {
        rect: { left: r.left, width: r.width, top: r.top },
        transform: s.transform,
        visibility: s.visibility,
        left: s.left
      };
    })()`
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
