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
  
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const ret = {};
      ret.viewport = { innerWidth: window.innerWidth, innerHeight: window.innerHeight };
      ret.doc = { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, bodyScrollWidth: document.body.scrollWidth };
      
      const elSelectors = [
        '.app-viewport-shell',
        '.app-container',
        '.app-sidebar',
        '.app-main-wrapper',
        '.app-header',
        '.app-main-content',
        '.network-dashboard-page',
        '.dashboard-content',
        '.medicines-page'
      ];
      
      ret.elements = {};
      for (const sel of elSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          ret.elements[sel] = {
            rect: { left: rect.left, right: rect.right, width: rect.width, height: rect.height },
            width: style.width,
            maxWidth: style.maxWidth,
            minWidth: style.minWidth,
            marginLeft: style.marginLeft,
            marginRight: style.marginRight,
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight,
            position: style.position,
            display: style.display,
            overflow: style.overflow
          };
        }
      }

      // Find any element overflowing viewport
      const allEls = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 5) {
          overflowing.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className.slice(0, 50) : '',
            right: rect.right,
            width: rect.width
          });
        }
      }
      ret.overflowingCount = overflowing.length;
      ret.topOverflowing = overflowing.slice(0, 10);

      return ret;
    })()`,
    returnByValue: true
  });
  
  console.log(JSON.stringify(evalRes.result.value, null, 2));

  // Also take a screenshot of current view
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\debug_current_state.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved debug_current_state.png');

  ws.close();
}

main().catch(console.error);
