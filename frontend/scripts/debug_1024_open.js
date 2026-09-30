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

  // Open the hamburger menu
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.btn-sidebar-mobile-toggle');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Now inspect all matching rules on .app-sidebar
  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector('.app-sidebar');
      if (!el) return 'No sidebar';
      
      const sheets = Array.from(document.styleSheets);
      const matchedRules = [];
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          const checkRule = (r, media) => {
            if (r.selectorText && el.matches(r.selectorText)) {
              matchedRules.push({
                selector: r.selectorText,
                cssText: r.cssText,
                media: media || (r.parentRule && r.parentRule.conditionText ? r.parentRule.conditionText : null)
              });
            } else if (r.conditionText) {
              for (const sub of (r.cssRules || [])) {
                checkRule(sub, r.conditionText);
              }
            }
          };
          for (const r of rules) {
            checkRule(r, null);
          }
        } catch(e){}
      }

      const style = window.getComputedStyle(el);
      return {
        className: el.className,
        rect: el.getBoundingClientRect(),
        computedTransform: style.transform,
        computedVisibility: style.visibility,
        computedLeft: style.left,
        matchedRules
      };
    })()`
  });

  console.log('Result:', JSON.stringify(res.result.value, null, 2));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

main().catch(console.error);
