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

  const tabs = ['dashboard', 'medicines', 'alerts', 'transfers', 'resources', 'attendance', 'phc-details', 'auth', 'reports', 'forecast'];
  const widths = [1280, 1024, 768, 500, 390];
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (const tab of tabs) {
    // Switch tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find sidebar item or call React state
        const btn = document.querySelector(\`.sidebar-nav-item[title*="\${tab}"]\`) || 
                    Array.from(document.querySelectorAll('.sidebar-nav-item, .thumb-btn')).find(b => b.textContent.toLowerCase().includes('${tab.slice(0, 4)}'));
        if (btn) btn.click();
      })()`
    });
    await delay(300);

    console.log(`\n=== TAB: ${tab} ===`);
    for (const w of widths) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w <= 768
      });
      await delay(200);

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const docScroll = document.documentElement.scrollWidth;
          const overflowing = [];
          for (const el of Array.from(document.querySelectorAll('*'))) {
            // ignore elements that are scrollable containers with overflow auto/scroll
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth + 2 && !el.closest('.table-responsive-card') && !el.closest('.header-nav')) {
              overflowing.push({
                tag: el.tagName,
                className: (typeof el.className === 'string' ? el.className.slice(0, 40) : ''),
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          }
          return { w: window.innerWidth, docScroll, count: overflowing.length, samples: overflowing.slice(0, 4) };
        })()`,
        returnByValue: true
      });
      const v = res.result.value;
      if (v.docScroll > v.w || v.count > 0) {
        console.log(`  w=${w}: docScroll=${v.docScroll}, overflowCount=${v.count}`, v.samples);
      } else {
        console.log(`  w=${w}: OK`);
      }
    }
  }

  ws.close();
}

main().catch(console.error);
