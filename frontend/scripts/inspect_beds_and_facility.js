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

  // 1. Inspect Beds at 390px
  console.log('=== INSPECT BEDS AT 390px ===');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 750, deviceScaleFactor: 1, mobile: true });
  await delay(200);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item, .thumb-btn')).find(b => b.textContent.toLowerCase().includes('bed'));
      if (btn) btn.click();
    })()`
  });
  await delay(400);

  const bedsRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.resource-matrix-card');
      if (!card) return 'no card';
      const overflowingChildren = [];
      for (const el of Array.from(card.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect();
        if (r.right > 390 + 2) {
          overflowingChildren.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.textContent || '').slice(0, 30)
          });
        }
      }
      const grid = document.querySelector('.resources-matrix-grid');
      return {
        gridRect: grid ? grid.getBoundingClientRect() : null,
        gridStyle: grid ? {
          display: window.getComputedStyle(grid).display,
          gridTemplateColumns: window.getComputedStyle(grid).gridTemplateColumns,
          width: window.getComputedStyle(grid).width
        } : null,
        cardRect: card.getBoundingClientRect(),
        overflowingChildren: overflowingChildren.slice(0, 10)
      };
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(bedsRes.result.value, null, 2));

  // 2. Inspect Facility at 390px and 1280px
  console.log('\n=== INSPECT FACILITY AT 390px ===');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-nav-item, .thumb-btn')).find(b => b.textContent.toLowerCase().includes('facility') || b.textContent.toLowerCase().includes('phc'));
      if (btn) btn.click();
    })()`
  });
  await delay(400);

  const fac390Res = await send('Runtime.evaluate', {
    expression: `(() => {
      const overflowing = [];
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect();
        if (r.right > 390 + 2 && !el.closest('.table-responsive-card')) {
          overflowing.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.textContent || '').slice(0, 30)
          });
        }
      }
      return overflowing.slice(0, 10);
    })()`,
    returnByValue: true
  });
  console.log('Facility 390px overflowing:', fac390Res.result.value);

  console.log('\n=== INSPECT FACILITY AT 1280px ===');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 850, deviceScaleFactor: 1, mobile: false });
  await delay(400);

  const fac1280Res = await send('Runtime.evaluate', {
    expression: `(() => {
      const overflowing = [];
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect();
        if (r.right > 1280 + 2 && !el.closest('.table-responsive-card')) {
          overflowing.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.textContent || '').slice(0, 30)
          });
        }
      }
      return overflowing.slice(0, 10);
    })()`,
    returnByValue: true
  });
  console.log('Facility 1280px overflowing:', fac1280Res.result.value);

  ws.close();
}

main().catch(console.error);
