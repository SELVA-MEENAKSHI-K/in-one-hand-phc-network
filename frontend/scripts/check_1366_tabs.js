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

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Set viewport to 1366 x 633
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 633,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(300);

  const tabs = [
    'dashboard',
    'medicines',
    'alerts',
    'transfers',
    'resources',
    'attendance',
    'phc-details'
  ];

  for (const tab of tabs) {
    // Switch tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (window.__setActiveTab) window.__setActiveTab('${tab}');
      })()`
    });
    await delay(300);

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const winW = window.innerWidth;
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const rootW = document.getElementById('root')?.scrollWidth;
        const appContainerW = document.querySelector('.app-container')?.scrollWidth;
        const mainWrapperW = document.querySelector('.app-main-wrapper')?.scrollWidth;
        const mainContentW = document.querySelector('.app-main-content')?.scrollWidth;

        // Find all elements sticking out beyond winW
        const stickingOut = [];
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect();
          if (r.right > winW + 2) {
            stickingOut.push({
              tag: el.tagName,
              className: typeof el.className === 'string' ? el.className.slice(0, 45) : '',
              id: el.id,
              right: Math.round(r.right),
              left: Math.round(r.left),
              width: Math.round(r.width)
            });
          }
        }

        return {
          tab: '${tab}',
          winW,
          docW,
          bodyW,
          rootW,
          appContainerW,
          mainWrapperW,
          mainContentW,
          stickingOutCount: stickingOut.length,
          topStickingOut: stickingOut.slice(0, 5)
        };
      })()`,
      returnByValue: true
    });

    console.log(`\n=== TAB: ${tab} at 1366px ===`);
    console.log(JSON.stringify(check.result.value, null, 2));
  }

  ws.close();
}

main().catch(console.error);
