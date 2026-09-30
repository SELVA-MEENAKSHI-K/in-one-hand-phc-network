import fs from 'fs';

async function main() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
  console.log('Connecting to target:', pageTarget.title, pageTarget.url);

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

  const inspectState = async (label) => {
    const res = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const mq1024 = window.matchMedia('(max-width: 1024px)').matches;
        const mq768 = window.matchMedia('(max-width: 768px)').matches;
        const mq640 = window.matchMedia('(max-width: 640px)').matches;

        const sidebar = document.querySelector('.app-sidebar');
        const container = document.querySelector('.app-container');
        const backdrop = document.querySelector('.sidebar-backdrop');
        const mobileToggle = document.querySelector('.btn-sidebar-mobile-toggle');
        const collapseToggle = document.querySelector('.btn-sidebar-collapse-toggle');

        const getInfo = (el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return {
            tagName: el.tagName,
            className: el.className,
            rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
            position: s.position,
            display: s.display,
            visibility: s.visibility,
            opacity: s.opacity,
            transform: s.transform,
            left: s.left,
            right: s.right,
            top: s.top,
            bottom: s.bottom,
            width: s.width,
            minWidth: s.minWidth,
            maxWidth: s.maxWidth,
            zIndex: s.zIndex,
            overflow: s.overflow,
            overflowX: s.overflowX,
            overflowY: s.overflowY,
            boxShadow: s.boxShadow
          };
        };

        return {
          window: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio,
            scrollX: window.scrollX,
            scrollY: window.scrollY
          },
          breakpoints: {
            mq1024,
            mq768,
            mq640
          },
          sidebar: getInfo(sidebar),
          container: getInfo(container),
          backdrop: getInfo(backdrop),
          mobileToggle: getInfo(mobileToggle),
          collapseToggle: getInfo(collapseToggle)
        };
      })()`
    });
    return res.result.value;
  };

  console.log('--- Initial State ---');
  const initial = await inspectState('initial');
  console.log(JSON.stringify(initial, null, 2));

  // Now click the mobile hamburger menu toggle
  console.log('--- Clicking mobile hamburger toggle ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.btn-sidebar-mobile-toggle');
      if (btn) btn.click();
    })()`
  });

  // Wait 300ms for transition
  await new Promise(r => setTimeout(r, 400));

  const afterOpen = await inspectState('after-open');
  console.log('--- State After Opening Hamburger Menu ---');
  console.log(JSON.stringify(afterOpen, null, 2));

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\reproduced_issue.png', Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved to reproduced_issue.png');

  ws.close();
}

main().catch(console.error);
