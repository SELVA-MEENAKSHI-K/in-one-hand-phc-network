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
      const matched = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.selectorText && el.matches(rule.selectorText)) {
              if (rule.style.transform || rule.style.visibility) {
                matched.push({ selector: rule.selectorText, transform: rule.style.transform, visibility: rule.style.visibility, cssText: rule.cssText });
              }
            } else if (rule.conditionText) {
              for (const sub of rule.cssRules || []) {
                if (sub.selectorText && el.matches(sub.selectorText)) {
                  if (sub.style.transform || sub.style.visibility) {
                    matched.push({ media: rule.conditionText, selector: sub.selectorText, transform: sub.style.transform, visibility: sub.style.visibility, cssText: sub.cssText });
                  }
                }
              }
            }
          }
        } catch(e){}
      }
      return {
        className: el ? el.className : null,
        computed: el ? {
          transform: window.getComputedStyle(el).transform,
          visibility: window.getComputedStyle(el).visibility,
          left: window.getComputedStyle(el).left,
          rect: el.getBoundingClientRect()
        } : null,
        matched
      };
    })()`
  });

  console.log('Result:', JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
