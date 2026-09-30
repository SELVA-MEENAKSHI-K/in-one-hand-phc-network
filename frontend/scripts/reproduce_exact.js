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

  const viewports = [
    { name: '1366x633', width: 1366, height: 633, dpr: 1 },
    { name: '1280x800', width: 1280, height: 800, dpr: 1 },
    { name: '1024x800', width: 1024, height: 800, dpr: 1 }
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height} DPR:${vp.dpr})`);
    console.log(`======================================================`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await new Promise(r => setTimeout(r, 600));

    const checkDOM = async () => {
      const res = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const sidebar = document.querySelector('.app-sidebar');
          const container = document.querySelector('.app-container');
          const backdrop = document.querySelector('.sidebar-backdrop');
          const mobileToggle = document.querySelector('.btn-sidebar-mobile-toggle');
          const collapseToggle = document.querySelector('.btn-sidebar-collapse-toggle');
          const closeBtn = document.querySelector('.sidebar-mobile-close-btn');

          const sRect = sidebar ? sidebar.getBoundingClientRect() : null;
          const sStyle = sidebar ? window.getComputedStyle(sidebar) : null;
          const cRect = container ? container.getBoundingClientRect() : null;
          const cStyle = container ? window.getComputedStyle(container) : null;
          const bRect = backdrop ? backdrop.getBoundingClientRect() : null;
          const bStyle = backdrop ? window.getComputedStyle(backdrop) : null;
          const mStyle = mobileToggle ? window.getComputedStyle(mobileToggle) : null;
          const closeStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;

          return {
            window: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio,
              scrollX: window.scrollX,
              scrollY: window.scrollY
            },
            breakpoints: {
              max1024: window.matchMedia('(max-width: 1024px)').matches,
              max768: window.matchMedia('(max-width: 768px)').matches
            },
            mobileToggle: mStyle ? { display: mStyle.display, visibility: mStyle.visibility } : null,
            sidebar: sStyle ? {
              className: sidebar.className,
              rect: { left: sRect.left, top: sRect.top, right: sRect.right, bottom: sRect.bottom, width: sRect.width, height: sRect.height },
              position: sStyle.position,
              transform: sStyle.transform,
              visibility: sStyle.visibility,
              display: sStyle.display,
              zIndex: sStyle.zIndex,
              left: sStyle.left,
              top: sStyle.top,
              width: sStyle.width,
              boxShadow: sStyle.boxShadow
            } : null,
            container: cStyle ? {
              rect: { left: cRect.left, top: cRect.top, width: cRect.width },
              display: cStyle.display,
              gridTemplateColumns: cStyle.gridTemplateColumns,
              position: cStyle.position
            } : null,
            backdrop: bStyle ? {
              rect: { left: bRect.left, top: bRect.top, right: bRect.right, bottom: bRect.bottom, width: bRect.width, height: bRect.height },
              position: bStyle.position,
              zIndex: bStyle.zIndex,
              display: bStyle.display
            } : null,
            closeBtn: closeStyle ? {
              display: closeStyle.display,
              visibility: closeStyle.visibility
            } : null,
            horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
          };
        })()`
      });
      return res.result.value;
    };

    const initial = await checkDOM();
    console.log('1. INITIAL (Closed):');
    console.log(JSON.stringify(initial, null, 2));

    // Open hamburger
    console.log('2. OPENING HAMBURGER...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    const opened = await checkDOM();
    console.log('3. AFTER OPENING HAMBURGER:');
    console.log(JSON.stringify(opened, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\exact_${vp.name}_open.png`, Buffer.from(shot.data, 'base64'));

    // Try closing by clicking backdrop
    if (opened.backdrop) {
      console.log('4. TESTING BACKDROP CLICK...');
      await send('Runtime.evaluate', {
        expression: `(() => {
          const bd = document.querySelector('.sidebar-backdrop');
          if (bd) bd.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 400));
      const afterBackdropClick = await checkDOM();
      console.log('   Backdrop exists after click?', !!afterBackdropClick.backdrop);
    }

    // Open again to test close button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Test close button
    console.log('5. TESTING CLOSE BUTTON CLICK...');
    const closeBtnResult = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const closeBtn = document.querySelector('.sidebar-mobile-close-btn');
        if (closeBtn) {
          const rect = closeBtn.getBoundingClientRect();
          const style = window.getComputedStyle(closeBtn);
          closeBtn.click();
          return { found: true, display: style.display, rect: { left: rect.left, top: rect.top, width: rect.width } };
        }
        return { found: false };
      })()`
    });
    console.log('   Close button click result:', JSON.stringify(closeBtnResult.result.value));
    await new Promise(r => setTimeout(r, 400));

    const afterCloseBtn = await checkDOM();
    console.log('   Backdrop exists after close button click?', !!afterCloseBtn.backdrop);
    console.log('   Sidebar class after close:', afterCloseBtn.sidebar?.className);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

main().catch(console.error);
