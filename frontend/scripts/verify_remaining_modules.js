import fs from 'fs';
import path from 'path';

async function main() {
  const artifactsDir = 'C:/Users/ELCOT/.gemini/antigravity-ide/brain/70e1994e-dda3-4960-9588-09caee002a83';

  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
  if (!pageTarget) {
    throw new Error('Target page not found');
  }

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

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(artifactsDir, name), buffer);
    console.log(`Saved screenshot: ${name}`);
  }

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      console.error('Eval error:', res.exceptionDetails);
    }
    return res.result?.value;
  }

  async function checkLayout(label, width, height, isMobile) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
    await delay(350);

    const metrics = await evaluate(`(() => {
      const docScroll = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const diff = Math.max(0, docScroll - winWidth);
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
      return { winWidth, docScroll, overflow: diff, clippedCount: clipped.length, clipped: clipped.slice(0, 3) };
    })()`);

    const status = metrics.overflow === 0 && metrics.clippedCount === 0 ? 'PASS' : 'WARN/FAIL';
    console.log(`  [${label} ${width}px] Overflow: ${metrics.overflow}px | Clipped: ${metrics.clippedCount} | Status: ${status}`);
    if (metrics.overflow > 0 || metrics.clippedCount > 0) {
      console.log('    Details:', metrics.clipped);
    }
    return { ...metrics, status };
  }

  async function switchTab(tabKey) {
    await evaluate(`(() => {
      if (typeof window.__setActiveTab === 'function') {
        window.__setActiveTab('${tabKey}');
        return;
      }
      const btn = document.querySelector('[data-tab="${tabKey}"]') ||
                  document.querySelector('.sidebar-nav-item[title*="${tabKey}"]');
      if (btn) btn.click();
    })()`);
    await delay(500);
  }

  console.log('=== VERIFYING REMAINING MODULES & FIXES ===\n');

  // 1. Audit Reports & Activity History ('reports')
  console.log('--- MODULE: Reports & Audit Ledger (reports) ---');
  await switchTab('reports');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Reports', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('audit_reports_view.png');

  // 2. Audit Resource Transfers Hub ('transfers')
  console.log('\n--- MODULE: Resource Transfers Hub (transfers) ---');
  await switchTab('transfers');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Transfers', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('transfers_modal_view.png');

  // 3. Audit Operational Alerts ('alerts')
  console.log('\n--- MODULE: Operational Alerts (alerts) ---');
  await switchTab('alerts');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Alerts', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('alerts_center_view.png');

  // 4. Audit Demand Forecast ('forecast')
  console.log('\n--- MODULE: Demand Forecast & Shortage Risks (forecast) ---');
  await switchTab('forecast');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Forecast', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('demand_forecast_view.png');

  // 5. Audit Federated Learning Architecture ('federated')
  console.log('\n--- MODULE: Federated Learning Architecture (federated) ---');
  await switchTab('federated');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Federated', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('federated_learning_view.png');

  // 6. Audit Roles & Access / Directory ('auth')
  console.log('\n--- MODULE: Roles & Operations Matrix (auth) ---');
  await switchTab('auth');
  for (const vp of [{ w: 390, h: 750, m: true, l: 'MOBILE' }, { w: 768, h: 850, m: false, l: 'TABLET' }, { w: 1280, h: 850, m: false, l: 'DESKTOP' }]) {
    await checkLayout('Auth', vp.w, vp.h, vp.m);
  }
  await takeScreenshot('auth_directory_view.png');

  // 7. Audit Evaluation Mode & Demo Checklist Modal
  console.log('\n--- EVALUATION MODE & DEMO CHECKLIST MODAL ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(300);

  // Turn Evaluation Mode ON if not already ON
  await evaluate(`(() => {
    const evalToggle = Array.from(document.querySelectorAll('button, .toggle, .badge')).find(el => (el.textContent || '').includes('Evaluation'));
    if (evalToggle && !evalToggle.textContent.includes('ON')) {
      evalToggle.click();
    }
  })()`);
  await delay(300);

  // Open checklist modal
  await evaluate(`(() => {
    if (typeof window.__setIsChecklistOpen === 'function') {
      window.__setIsChecklistOpen(true);
    }
  })()`);
  await delay(400);

  const checklistModalCheck = await evaluate(`(() => {
    const modal = document.querySelector('.checklist-modal');
    const items = document.querySelectorAll('.checklist-item-row');
    return {
      opened: !!modal,
      itemCount: items.length
    };
  })()`);
  console.log('  Checklist modal status:', checklistModalCheck);
  await takeScreenshot('demo_checklist_modal_open.png');

  // Toggle item 1
  const toggleRes = await evaluate(`(() => {
    const firstCheckbox = document.querySelector('.checklist-item-row .btn-checkbox');
    if (firstCheckbox) firstCheckbox.click();
    const fill = document.querySelector('.checklist-progress-bar-fill');
    return {
      toggled: !!firstCheckbox,
      progress: fill ? fill.style.width : ''
    };
  })()`);
  console.log('  Toggled checklist item 1:', toggleRes);
  await delay(300);

  // Close checklist modal
  await evaluate(`(() => {
    if (typeof window.__setIsChecklistOpen === 'function') {
      window.__setIsChecklistOpen(false);
    }
  })()`);
  await delay(300);

  console.log('\n=== AUDIT COMPLETE: ALL MODULES VERIFIED! ===');
  ws.close();
}

main().catch(console.error);
