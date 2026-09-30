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

  // Enable CSS and DOM domains
  await send('DOM.enable');
  await send('CSS.enable');

  // Let's inspect .btn-sidebar-mobile-toggle matching rules
  const evalRes = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btn = document.querySelector('.btn-sidebar-mobile-toggle');
      const sidebar = document.querySelector('.app-sidebar');
      const container = document.querySelector('.app-container');
      const backdrop = document.querySelector('.sidebar-backdrop');
      
      const getRules = (el) => {
        if (!el) return [];
        const sheets = Array.from(document.styleSheets);
        const matches = [];
        for (const sheet of sheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const r of rules) {
              if (r.selectorText && el.matches(r.selectorText)) {
                matches.push({
                  selector: r.selectorText,
                  cssText: r.cssText,
                  media: r.parentRule && r.parentRule.conditionText ? r.parentRule.conditionText : null
                });
              } else if (r.conditionText) {
                // Media rule
                for (const sub of (r.cssRules || [])) {
                  if (sub.selectorText && el.matches(sub.selectorText)) {
                    matches.push({
                      selector: sub.selectorText,
                      cssText: sub.cssText,
                      media: r.conditionText
                    });
                  }
                }
              }
            }
          } catch(e){}
        }
        return matches;
      };

      return {
        btnRules: getRules(btn),
        sidebarRules: getRules(sidebar),
        containerRules: getRules(container),
        backdropRules: getRules(backdrop)
      };
    })()`
  });

  console.log('--- Matching Rules ---');
  console.log(JSON.stringify(evalRes.result.value, null, 2));

  ws.close();
}

main().catch(console.error);
