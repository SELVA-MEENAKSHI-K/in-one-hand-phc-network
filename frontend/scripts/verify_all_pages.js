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

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // The 7 required modules
  const pages = [
    { key: 'dashboard', name: 'overview' },
    { key: 'medicines', name: 'medicine' },
    { key: 'alerts', name: 'alerts' },
    { key: 'transfers', name: 'transfers' },
    { key: 'resources', name: 'beds' },
    { key: 'attendance', name: 'staff' },
    { key: 'phc-details', name: 'facility' }
  ];

  const viewports = [
    { label: 'mobile', width: 390, height: 750, isMobile: true },
    { label: 'tablet', width: 768, height: 850, isMobile: false },
    { label: 'desktop', width: 1280, height: 850, isMobile: false }
  ];

  const results = [];

  for (const page of pages) {
    console.log(`\n================ Testing: ${page.name} (${page.key}) ================`);

    for (const vp of viewports) {
      // Set viewport
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.isMobile
      });
      await delay(200);

      // Switch to tab
      await send('Runtime.evaluate', {
        expression: `(() => {
          // Use AppContext through window or click nav button
          const item = document.querySelector(\`.sidebar-nav-item[title*="${page.key}"]\`) ||
                       Array.from(document.querySelectorAll('.sidebar-nav-item, .thumb-btn')).find(b => {
                         const t = (b.textContent || '').toLowerCase();
                         return t.includes('${page.name.slice(0, 4)}');
                       });
          if (item) item.click();
        })()`
      });
      await delay(400);

      // Evaluate document layout metrics
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const docScroll = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const diff = docScroll - winWidth;
          
          // Check for elements that stick out beyond window
          const clipped = [];
          for (const el of Array.from(document.querySelectorAll('*'))) {
            // Exclude intentionally scrollable elements and SVG vector internals
            if (el.closest('.table-responsive-card') || el.closest('.sub-nav-tabs') || el.closest('.filter-chips-scroll') || el.closest('.header-nav') || el.closest('svg') || el.tagName.toLowerCase() === 'svg') {
              continue;
            }
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 2) {
              clipped.push({
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className.slice(0, 30) : '',
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          }
          
          return {
            winWidth,
            docScroll,
            overflowPixels: Math.max(0, diff),
            clippedCount: clipped.length,
            clippedSamples: clipped.slice(0, 3)
          };
        })()`,
        returnByValue: true
      });

      const metrics = evalRes.result.value;
      const passed = metrics.overflowPixels === 0 && metrics.clippedCount === 0;

      console.log(`  [${vp.label.toUpperCase()} ${vp.width}px] Overflow: ${metrics.overflowPixels}px | Clipped: ${metrics.clippedCount} | Status: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) {
        console.log('    Samples:', metrics.clippedSamples);
      }

      results.push({
        page: page.name,
        viewport: vp.label,
        width: vp.width,
        passed,
        ...metrics
      });

      // Capture screenshot
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `verify_${page.name}_${vp.label}.png`;
      fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\${filename}`, Buffer.from(ss.data, 'base64'));
    }
  }

  // Also test Mobile Sidebar Drawer interaction (Open & Close)
  console.log('\n================ Testing: Mobile Sidebar Drawer ================');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 750,
    deviceScaleFactor: 1,
    mobile: true
  });
  await delay(200);

  // Click hamburger
  await send('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.querySelector('.btn-sidebar-mobile-toggle');
      if (toggle) toggle.click();
    })()`
  });
  await delay(350);

  const drawerOpenRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');
      const rect = sidebar ? sidebar.getBoundingClientRect() : null;
      return {
        isOpen: sidebar ? sidebar.classList.contains('mobile-open') : false,
        sidebarLeft: rect ? rect.left : null,
        sidebarWidth: rect ? rect.width : null,
        hasBackdrop: !!backdrop
      };
    })()`,
    returnByValue: true
  });
  console.log('Drawer Open Check:', drawerOpenRes.result.value);
  const ssDrawer = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\verify_mobile_drawer_open.png`, Buffer.from(ssDrawer.data, 'base64'));

  // Close drawer by clicking backdrop
  await send('Runtime.evaluate', {
    expression: `(() => {
      const backdrop = document.querySelector('.sidebar-backdrop') || document.querySelector('.sidebar-mobile-close-btn');
      if (backdrop) backdrop.click();
    })()`
  });
  await delay(350);

  const drawerClosedRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const rect = sidebar ? sidebar.getBoundingClientRect() : null;
      return {
        isOpen: sidebar ? sidebar.classList.contains('mobile-open') : false,
        sidebarLeft: rect ? rect.left : null,
        boxShadow: sidebar ? window.getComputedStyle(sidebar).boxShadow : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Drawer Closed Check:', drawerClosedRes.result.value);

  // Also test Desktop Sidebar Rail Collapse and Expand
  console.log('\n================ Testing: Desktop Sidebar Rail Collapse ================');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(200);

  // Collapse sidebar
  await send('Runtime.evaluate', {
    expression: `(() => {
      const collapseBtn = document.querySelector('.sidebar-collapse-btn') || document.querySelector('.btn-sidebar-collapse-toggle');
      if (collapseBtn) collapseBtn.click();
    })()`
  });
  await delay(350);

  const railCollapsedRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const main = document.querySelector('.app-main-wrapper');
      return {
        isCollapsed: sidebar ? sidebar.classList.contains('collapsed') : false,
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : null,
        mainWidth: main ? main.getBoundingClientRect().width : null,
        docScroll: document.documentElement.scrollWidth,
        winWidth: window.innerWidth
      };
    })()`,
    returnByValue: true
  });
  console.log('Rail Collapsed Check:', railCollapsedRes.result.value);
  const ssRail = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111\\verify_desktop_sidebar_collapsed.png`, Buffer.from(ssRail.data, 'base64'));

  // Expand sidebar again
  await send('Runtime.evaluate', {
    expression: `(() => {
      const expandBtn = document.querySelector('.sidebar-collapse-btn') || document.querySelector('.btn-sidebar-collapse-toggle');
      if (expandBtn) expandBtn.click();
    })()`
  });
  await delay(350);

  const railExpandedRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.app-sidebar');
      const main = document.querySelector('.app-main-wrapper');
      return {
        isCollapsed: sidebar ? sidebar.classList.contains('collapsed') : false,
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : null,
        mainWidth: main ? main.getBoundingClientRect().width : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Rail Expanded Check:', railExpandedRes.result.value);

  const allPassed = results.every(r => r.passed);
  console.log(`\n================ SUMMARY: ${allPassed ? 'ALL TESTS PASSED PERFECTLY!' : 'SOME TESTS FAILED'} ================`);
  console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.passed).length}`);

  ws.close();
}

main().catch(console.error);
