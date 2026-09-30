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
      const sidebar = document.querySelector('.app-sidebar');
      const r = sidebar ? sidebar.getBoundingClientRect() : null;
      return {
        windowScrollX: window.scrollX,
        windowScrollY: window.scrollY,
        docScrollLeft: document.documentElement.scrollLeft,
        bodyScrollLeft: document.body.scrollLeft,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        sidebar: r ? { left: r.left, right: r.right, width: r.width, top: r.top, bottom: r.bottom } : null
      };
    })()`
  });

  console.log('Scroll & Sidebar Info:', JSON.stringify(res.result.value, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\current_user_state.png', Buffer.from(shot.data, 'base64'));

  ws.close();
}

main().catch(console.error);
