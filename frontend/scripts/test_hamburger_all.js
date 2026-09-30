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
    { name: 'screenshot_1366x633', width: 1366, height: 633, dpr: 1 },
    { name: 'screenshot_1280x800', width: 1280, height: 800, dpr: 1 },
    { name: 'tablet_1024x800', width: 1024, height: 800, dpr: 1 },
    { name: 'tablet_768x1024', width: 768, height: 1024, dpr: 1 },
    { name: 'mobile_390x844', width: 390, height: 844, dpr: 3 }
  ];

  for (const vp of viewports) {
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height} dpr:${vp.dpr}) ================`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: vp.width <= 768
    });
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });

    // Reset scroll to 0
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 200));

    // First check closed state
    const closedState = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const sidebar = document.querySelector('.app-sidebar');
        const container = document.querySelector('.app-container');
        const backdrop = document.querySelector('.sidebar-backdrop');
        const mobileToggle = document.querySelector('.btn-sidebar-mobile-toggle');
        const collapseToggle = document.querySelector('.btn-sidebar-collapse-toggle');

        const sRect = sidebar ? sidebar.getBoundingClientRect() : null;
        const sStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        const cRect = container ? container.getBoundingClientRect() : null;
        const cStyle = container ? window.getComputedStyle(container) : null;
        const mStyle = mobileToggle ? window.getComputedStyle(mobileToggle) : null;

        return {
          windowInnerWidth: window.innerWidth,
          devicePixelRatio: window.devicePixelRatio,
          activeBreakpoints: {
            max1024: window.matchMedia('(max-width: 1024px)').matches,
            max768: window.matchMedia('(max-width: 768px)').matches,
            max640: window.matchMedia('(max-width: 640px)').matches
          },
          mobileToggleDisplay: mStyle ? mStyle.display : null,
          sidebar: sRect ? {
            rect: { left: sRect.left, top: sRect.top, right: sRect.right, bottom: sRect.bottom, width: sRect.width, height: sRect.height },
            position: sStyle.position,
            transform: sStyle.transform,
            visibility: sStyle.visibility,
            zIndex: sStyle.zIndex
          } : null,
          container: cRect ? {
            rect: { left: cRect.left, top: cRect.top, width: cRect.width },
            display: cStyle.display,
            gridTemplateColumns: cStyle.gridTemplateColumns
          } : null,
          backdropExists: !!backdrop
        };
      })()`
    });
    console.log('Closed State:', JSON.stringify(closedState.result.value, null, 2));

    // Now OPEN hamburger menu
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 350));

    // Check open state
    const openState = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const sidebar = document.querySelector('.app-sidebar');
        const container = document.querySelector('.app-container');
        const backdrop = document.querySelector('.sidebar-backdrop');
        const closeBtn = document.querySelector('.sidebar-mobile-close-btn');

        const sRect = sidebar ? sidebar.getBoundingClientRect() : null;
        const sStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        const bRect = backdrop ? backdrop.getBoundingClientRect() : null;
        const bStyle = backdrop ? window.getComputedStyle(backdrop) : null;
        const closeStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;

        return {
          sidebarOpen: {
            className: sidebar ? sidebar.className : null,
            rect: sRect ? { left: sRect.left, top: sRect.top, right: sRect.right, bottom: sRect.bottom, width: sRect.width, height: sRect.height } : null,
            position: sStyle ? sStyle.position : null,
            transform: sStyle ? sStyle.transform : null,
            visibility: sStyle ? sStyle.visibility : null,
            zIndex: sStyle ? sStyle.zIndex : null
          },
          backdrop: bRect ? {
            rect: { left: bRect.left, top: bRect.top, right: bRect.right, bottom: bRect.bottom, width: bRect.width, height: bRect.height },
            position: bStyle.position,
            zIndex: bStyle.zIndex
          } : null,
          closeBtn: closeBtn ? {
            visible: closeStyle.display !== 'none' && closeStyle.visibility !== 'hidden',
            display: closeStyle.display
          } : null,
          horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
        };
      })()`
    });
    console.log('Open State:', JSON.stringify(openState.result.value, null, 2));

    // Capture screenshot of open state
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\open_${vp.name}.png`, Buffer.from(shot.data, 'base64'));

    // Now close it (click backdrop or close button)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop) backdrop.click();
        else {
          const btn = document.querySelector('.sidebar-mobile-close-btn');
          if (btn) btn.click();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 350));
  }

  // Clear overrides
  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

main().catch(console.error);
