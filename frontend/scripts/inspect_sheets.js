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
      try {
        const sheets = [];
        for (const s of document.styleSheets) {
          let count = 0;
          try { count = s.cssRules.length; } catch(e){ count = 'cors'; }
          sheets.push({ href: s.href, count });
        }
        const sidebar = document.querySelector('.app-sidebar');
        const allRules = [];
        for (const s of document.styleSheets) {
          try {
            for (const r of s.cssRules || []) {
              if (r.selectorText && sidebar && sidebar.matches(r.selectorText)) {
                allRules.push({ selector: r.selectorText, cssText: r.cssText });
              } else if (r.conditionText) {
                for (const sub of r.cssRules || []) {
                  if (sub.selectorText && sidebar && sidebar.matches(sub.selectorText)) {
                    allRules.push({ media: r.conditionText, selector: sub.selectorText, cssText: sub.cssText });
                  }
                }
              }
            }
          } catch(e){}
        }
        return { sheets, allRules, sidebarClass: sidebar ? sidebar.className : null };
      } catch(err) {
        return { error: err.message, stack: err.stack };
      }
    })()`
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
