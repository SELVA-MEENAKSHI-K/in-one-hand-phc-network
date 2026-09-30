import fs from 'fs';
import path from 'path';

async function main() {
  const artifactsDir = 'C:/Users/ELCOT/.gemini/antigravity-ide/brain/70e1994e-dda3-4960-9588-09caee002a83';

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

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Reload page to ensure clean fresh state
  await send('Page.reload');
  await delay(800);

  const screens = [
    { key: 'dashboard', name: 'Overview' },
    { key: 'medicines', name: 'Medicine' },
    { key: 'alerts', name: 'Alerts' },
    { key: 'transfers', name: 'Transfers' },
    { key: 'resources', name: 'Beds' },
    { key: 'attendance', name: 'Staff' },
    { key: 'phc-details', name: 'Facility' }
  ];

  const viewports = [
    { label: 'Mobile', width: 390, height: 844, isMobile: true },
    { label: 'Tablet', width: 768, height: 1024, isMobile: false },
    { label: 'Desktop 1280', width: 1280, height: 800, isMobile: false },
    { label: 'Desktop 1366', width: 1366, height: 633, isMobile: false }
  ];

  const report = [];

  for (const screen of screens) {
    console.log(`\n================ Testing: ${screen.name} (${screen.key}) ================`);

    // Switch tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (window.__setActiveTab) window.__setActiveTab('${screen.key}');
        const btn = document.querySelector('[data-tab="${screen.key}"]');
        if (btn) btn.click();
      })()`
    });
    await delay(300);

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.isMobile
      });
      await delay(300);

      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const docScroll = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const diff = Math.max(0, docScroll - winWidth);

          const sidebar = document.querySelector('.app-sidebar');
          const content = document.querySelector('.app-main-content');
          const wrapper = document.querySelector('.app-main-wrapper');

          const sR = sidebar ? sidebar.getBoundingClientRect() : null;
          const cR = content ? content.getBoundingClientRect() : null;
          const wR = wrapper ? wrapper.getBoundingClientRect() : null;

          const isDesktop = winWidth > 1024;
          const expectedContentLeft = isDesktop ? 260 : 0;
          const actualContentLeft = cR ? Math.round(cR.left) : 0;
          const gapBesideSidebar = Math.abs(actualContentLeft - expectedContentLeft);

          // Find any elements sticking out beyond viewport (excluding standard scrollable table internals)
          const clipped = [];
          for (const el of Array.from(document.querySelectorAll('*'))) {
            if (
              el.closest('.table-responsive-card') ||
              el.closest('.sub-nav-tabs') ||
              el.closest('.filter-chips-scroll') ||
              el.closest('.facility-view-switcher') ||
              el.closest('.header-nav') ||
              el.closest('svg') ||
              el.tagName.toLowerCase() === 'svg'
            ) {
              continue;
            }
            const r = el.getBoundingClientRect();
            if (r.right > winWidth + 2) {
              clipped.push({
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className.slice(0, 30) : '',
                right: Math.round(r.right),
                width: Math.round(r.width)
              });
            }
          }

          return {
            winWidth,
            docScroll,
            overflow: diff,
            sidebarWidth: sR ? Math.round(sR.width) : 0,
            contentWidth: cR ? Math.round(cR.width) : 0,
            contentLeft: actualContentLeft,
            expectedLeft: expectedContentLeft,
            gapBesideSidebar,
            clippedCount: clipped.length,
            clipped: clipped.slice(0, 3)
          };
        })()`,
        returnByValue: true
      });

      const res = metrics.result.value;
      const status = res.overflow === 0 && res.clippedCount === 0 && res.gapBesideSidebar <= 1 ? 'PASS' : 'WARN';
      console.log(`  [${vp.label}] Overflow: ${res.overflow}px | Clipped: ${res.clippedCount} | Content Left: ${res.contentLeft}px (Expected: ${res.expectedLeft}px, Gap: ${res.gapBesideSidebar}px) | Status: ${status}`);

      if (status !== 'PASS') {
        console.log('    Details:', res.clipped);
      }

      report.push({
        screen: screen.name,
        viewport: vp.label,
        overflow: res.overflow,
        clipped: res.clippedCount,
        gap: res.gapBesideSidebar,
        status
      });

      // Capture desktop and mobile screenshots
      if (vp.label === 'Desktop 1366') {
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactsDir, `verified_${screen.key}_desktop.png`), Buffer.from(ss.data, 'base64'));
      } else if (vp.label === 'Mobile') {
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactsDir, `verified_${screen.key}_mobile.png`), Buffer.from(ss.data, 'base64'));
      }
    }
  }

  // Also test desktop sidebar collapse & expand
  console.log('\n================ Testing: Desktop Sidebar Collapse & Expand ================');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(200);

  // Collapse sidebar
  const collapseTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.querySelector('.btn-sidebar-collapse-toggle, .sidebar-collapse-btn');
      if (toggle) toggle.click();
      return { clicked: !!toggle };
    })()`,
    returnByValue: true
  });
  await delay(350);

  const collapsedMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const content = document.querySelector('.app-main-content');
      const sR = sidebar.getBoundingClientRect();
      const cR = content.getBoundingClientRect();
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return {
        sidebarWidth: Math.round(sR.width),
        contentLeft: Math.round(cR.left),
        contentWidth: Math.round(cR.width),
        overflow: Math.max(0, docW - winW)
      };
    })()`,
    returnByValue: true
  });
  console.log('  Sidebar Collapsed:', collapsedMetrics.result.value);

  // Expand sidebar back
  await send('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.querySelector('.btn-sidebar-collapse-toggle, .sidebar-collapse-btn');
      if (toggle) toggle.click();
    })()`
  });
  await delay(350);

  const expandedMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const content = document.querySelector('.app-main-content');
      const sR = sidebar.getBoundingClientRect();
      const cR = content.getBoundingClientRect();
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return {
        sidebarWidth: Math.round(sR.width),
        contentLeft: Math.round(cR.left),
        contentWidth: Math.round(cR.width),
        overflow: Math.max(0, docW - winW)
      };
    })()`,
    returnByValue: true
  });
  console.log('  Sidebar Expanded:', expandedMetrics.result.value);

  console.log('\n================ VERIFICATION SUMMARY ================');
  const allPassed = report.every(r => r.status === 'PASS');
  console.log(`Total checks: ${report.length}, All passed: ${allPassed}`);

  ws.close();
}

main().catch(console.error);
