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
    expression: `(() => {
      const tree = [];
      let el = document.querySelector('.form-card') || document.querySelector('.card') || document.querySelector('.app-main-content > *');
      while (el && el !== document.documentElement) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        tree.push({
          tag: el.tagName,
          className: el.className,
          rect: { left: rect.left, right: rect.right, width: rect.width },
          padding: style.paddingTop + ' ' + style.paddingRight + ' ' + style.paddingBottom + ' ' + style.paddingLeft,
          margin: style.marginTop + ' ' + style.marginRight + ' ' + style.marginBottom + ' ' + style.marginLeft,
          widthStyle: style.width,
          maxWidth: style.maxWidth,
          minWidth: style.minWidth,
          overflowX: style.overflowX,
          boxSizing: style.boxSizing
        });
        el = el.parentElement;
      }

      // Check what is at (5, 300) in viewport coordinates
      const elAtPoint = document.elementFromPoint(5, 300);
      const pointInfo = elAtPoint ? {
        tag: elAtPoint.tagName,
        className: elAtPoint.className,
        rect: elAtPoint.getBoundingClientRect()
      } : null;

      // Check scrollLeft of window and document
      const scrollInfo = {
        windowScrollX: window.scrollX,
        windowScrollY: window.scrollY,
        docScrollLeft: document.documentElement.scrollLeft,
        bodyScrollLeft: document.body.scrollLeft,
        windowInnerWidth: window.innerWidth
      };

      return { tree, pointInfo, scrollInfo };
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
