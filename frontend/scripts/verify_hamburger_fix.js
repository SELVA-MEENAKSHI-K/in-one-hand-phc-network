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
    { name: 'desktop_1280x800', width: 1280, height: 800, dpr: 1 },
    { name: 'tablet_1024x800', width: 1024, height: 800, dpr: 1 },
    { name: 'tablet_768x1024', width: 768, height: 1024, dpr: 1 },
    { name: 'mobile_390x844', width: 390, height: 844, dpr: 3 }
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\n===============================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height} DPR:${vp.dpr})`);
    console.log(`===============================================================`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: vp.width <= 768
    });

    // Ensure page is loaded
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await new Promise(r => setTimeout(r, 1200));

    // Wait until DOM is ready
    await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `new Promise(resolve => {
        const poll = () => {
          if (document.querySelector('.app-sidebar') && document.querySelector('.btn-sidebar-mobile-toggle')) {
            resolve();
          } else {
            setTimeout(poll, 100);
          }
        };
        poll();
      })`
    });

    const getMetrics = async () => {
      const res = await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const sidebar = document.querySelector('.app-sidebar');
          const container = document.querySelector('.app-container');
          const backdrop = document.querySelector('.sidebar-backdrop');
          const closeBtn = document.querySelector('.sidebar-mobile-close-btn');

          const sRect = sidebar ? sidebar.getBoundingClientRect() : null;
          const sStyle = sidebar ? window.getComputedStyle(sidebar) : null;
          const bRect = backdrop ? backdrop.getBoundingClientRect() : null;
          const closeStyle = closeBtn ? window.getComputedStyle(closeBtn) : null;

          return {
            window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, dpr: window.devicePixelRatio },
            overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            sidebar: sRect ? {
              className: sidebar.className,
              rect: { left: Math.round(sRect.left), top: Math.round(sRect.top), right: Math.round(sRect.right), width: Math.round(sRect.width) },
              position: sStyle.position,
              visibility: sStyle.visibility,
              zIndex: sStyle.zIndex
            } : null,
            backdrop: bRect ? {
              rect: { left: Math.round(bRect.left), top: Math.round(bRect.top), width: Math.round(bRect.width), height: Math.round(bRect.height) },
              zIndex: window.getComputedStyle(backdrop).zIndex
            } : null,
            closeBtn: closeBtn ? {
              display: closeStyle.display,
              visible: closeStyle.display !== 'none' && closeStyle.visibility !== 'hidden'
            } : null
          };
        })()`
      });
      return res.result.value;
    };

    // 1. Initial Closed State
    const closed = await getMetrics();
    console.log('1. Closed State:', {
      sidebarLeft: closed.sidebar?.rect.left,
      sidebarWidth: closed.sidebar?.rect.width,
      overflow: closed.overflow,
      backdrop: !!closed.backdrop
    });

    // 2. Open Hamburger Menu
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        if (btn) btn.click();
      })()`
    });

    // Wait until sidebar transition finishes and it is anchored at left: 0
    await send('Runtime.evaluate', {
      awaitPromise: true,
      expression: `new Promise(resolve => {
        let attempts = 0;
        const check = () => {
          attempts++;
          const sidebar = document.querySelector('.app-sidebar');
          const backdrop = document.querySelector('.sidebar-backdrop');
          if (sidebar && backdrop) {
            const r = sidebar.getBoundingClientRect();
            const s = window.getComputedStyle(sidebar);
            if (r.left >= 0 && s.visibility === 'visible') {
              return resolve();
            }
          }
          if (attempts > 30) return resolve();
          setTimeout(check, 50);
        };
        check();
      })`
    });

    const opened = await getMetrics();
    console.log('2. Open State:', {
      sidebarLeft: opened.sidebar?.rect.left,
      sidebarWidth: opened.sidebar?.rect.width,
      visibility: opened.sidebar?.visibility,
      zIndex: opened.sidebar?.zIndex,
      backdropWidth: opened.backdrop?.rect.width,
      backdropZIndex: opened.backdrop?.zIndex,
      closeBtnVisible: opened.closeBtn?.visible,
      overflow: opened.overflow
    });

    // Screenshot of open state
    const openShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\verified_${vp.name}_open.png`, Buffer.from(openShot.data, 'base64'));

    // Check criteria for open state
    const openAnchoredLeft = opened.sidebar?.rect.left === 0;
    const openVisible = opened.sidebar?.visibility === 'visible' && (opened.sidebar?.rect.width >= 270 || opened.sidebar?.rect.width >= 0.8 * vp.width);
    const backdropCovers = !!opened.backdrop && opened.backdrop.rect.width >= vp.width - 20;
    const closeBtnWorks = opened.closeBtn?.visible === true;
    const noOverflowOpen = opened.overflow === 0;

    // 3. Test closing via Backdrop Click
    await send('Runtime.evaluate', {
      expression: `(() => {
        const bd = document.querySelector('.sidebar-backdrop');
        if (bd) bd.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 450));
    const afterBackdrop = await getMetrics();
    const backdropClosed = !afterBackdrop.backdrop;
    console.log('3. Backdrop Click Closes Menu:', backdropClosed);

    // 4. Open again and test closing via Close Button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.btn-sidebar-mobile-toggle');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 450));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.sidebar-mobile-close-btn');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 450));
    const afterCloseBtn = await getMetrics();
    const closeBtnClosed = !afterCloseBtn.backdrop;
    console.log('4. Close Button Closes Menu:', closeBtnClosed);

    // 5. Final Closed State Verification
    const noOverflowClosed = afterCloseBtn.overflow === 0;
    const closedNormalAlignment = (vp.width > 1024)
      ? (afterCloseBtn.sidebar?.rect.left === 0 && afterCloseBtn.sidebar?.rect.width >= 260)
      : (afterCloseBtn.sidebar?.rect.left < 0 || afterCloseBtn.sidebar?.visibility === 'hidden');

    console.log('5. Closed Alignment Valid:', closedNormalAlignment, 'No Overflow:', noOverflowClosed);

    // Screenshot of closed state
    const closedShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\70e1994e-dda3-4960-9588-09caee002a83\\verified_${vp.name}_closed.png`, Buffer.from(closedShot.data, 'base64'));

    const allPassed = openAnchoredLeft && openVisible && backdropCovers && closeBtnWorks && noOverflowOpen && backdropClosed && closeBtnClosed && noOverflowClosed && closedNormalAlignment;

    results.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      openAnchoredLeft,
      openVisible,
      backdropCovers,
      closeBtnWorks,
      noOverflowOpen,
      backdropClosed,
      closeBtnClosed,
      noOverflowClosed,
      closedNormalAlignment,
      PASS: allPassed
    });
  }

  console.log('\n===============================================================');
  console.log('FINAL VERIFICATION SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('All passed:', results.every(r => r.PASS));

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

main().catch(console.error);
