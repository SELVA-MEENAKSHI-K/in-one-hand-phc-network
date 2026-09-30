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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise(r => setTimeout(r, 1200));

  const check = async (label) => {
    const res = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const sidebar = document.querySelector('.app-sidebar');
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        const backdrop = document.querySelector('.sidebar-backdrop');
        const sRect = sidebar ? sidebar.getBoundingClientRect() : null;
        const sStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        const bStyle = btn ? window.getComputedStyle(btn) : null;
        return {
          label: '${label}',
          sidebarClass: sidebar ? sidebar.className : null,
          sidebarRect: sRect,
          sidebarTransform: sStyle ? sStyle.transform : null,
          sidebarVisibility: sStyle ? sStyle.visibility : null,
          sidebarLeftStyle: sStyle ? sStyle.left : null,
          btnVisible: bStyle ? bStyle.display : null,
          backdropExists: !!backdrop
        };
      })()`
    });
    console.log(JSON.stringify(res.result.value, null, 2));
  };

  await check('Before Click');

  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.btn-sidebar-mobile-toggle');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  await check('After Click');

  ws.close();
}

main().catch(console.error);
