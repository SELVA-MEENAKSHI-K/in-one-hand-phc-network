import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Chrome CDP on port 9222...');
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');

  if (!pageTarget) {
    console.error('No page target found on port 9222');
    process.exit(1);
  }

  console.log('Found page target:', pageTarget.title, pageTarget.url);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);
  console.log('CDP connected!');

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const artifactDir = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111';

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(artifactDir, filename);
    fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  };

  // Set desktop viewport 1280x800
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  // Navigate to root clean state
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await delay(1500);

  // 1. Ensure Evaluation Mode is OFF initially (normal user view)
  await evaluate(`
    localStorage.setItem('inonehand_evaluation_mode_v2', 'false');
    window.location.reload();
  `);
  await delay(1500);

  console.log('\n--- 1. Testing Normal User Screens (Evaluation Mode: OFF) ---');

  const normalModeState = await evaluate(`
    (() => {
      const evalToggleBtn = document.querySelector('.btn-eval-mode-toggle');
      const evalToggleText = evalToggleBtn ? evalToggleBtn.innerText.trim() : null;
      const demoDataBadge = document.querySelector('.demo-data-badge');
      const checklistBtn = document.querySelector('.btn-checklist');
      const resetBtn = document.querySelector('button[title*="Reset"]');
      const roleSelect = document.querySelector('.sidebar-role-select');
      const roleSwitcherHeader = document.querySelector('.demo-role-switcher-header');
      const userRoleBadge = document.querySelector('.sidebar-user-role-badge');
      const benchmarkPill = document.querySelector('.benchmark-pill');
      const targetMetricBadge = document.querySelector('.target-metric-badge');
      const quickActionText = document.querySelector('.strip-title span');

      // Check for any performance or target copy on the page
      const bodyText = document.body.innerText;
      const hasLoadedIn = bodyText.includes('Dashboard loaded in') || bodyText.includes('loaded in');
      const hasTargetSec = bodyText.includes('target < 3.0s') || bodyText.includes('Target < 3.0s') || bodyText.includes('target <');

      return {
        evalToggleText,
        hasDemoDataBadge: !!demoDataBadge,
        demoDataBadgeText: demoDataBadge ? demoDataBadge.innerText.trim() : null,
        hasChecklistBtn: !!checklistBtn,
        hasResetBtn: !!resetBtn,
        hasRoleSelect: !!roleSelect,
        hasRoleSwitcherHeader: !!roleSwitcherHeader,
        userRoleBadgeText: userRoleBadge ? userRoleBadge.innerText.trim() : null,
        hasBenchmarkPill: !!benchmarkPill,
        hasTargetMetricBadge: !!targetMetricBadge,
        quickActionTitle: quickActionText ? quickActionText.innerText.trim() : null,
        hasLoadedIn,
        hasTargetSec
      };
    })()
  `);
  console.log('Normal Mode State:', JSON.stringify(normalModeState, null, 2));

  await captureScreenshot('normal_user_dashboard.png');

  // Check Network Operations Console (Screen 2) District Filter
  console.log('\n--- Checking District Filter in Network Operations Console ---');
  await evaluate(`
    (() => {
      const navItem = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.innerText.includes('Network') || b.innerText.includes('Overview'));
      if (navItem) navItem.click();
    })()
  `);
  await delay(800);

  const networkDistrictFilter = await evaluate(`
    (() => {
      const districtSelect = Array.from(document.querySelectorAll('.filter-dropdown-box select')).find(s => s.querySelector('option[value="ALL"]'));
      const options = districtSelect ? Array.from(districtSelect.querySelectorAll('option')).map(o => ({ value: o.value, text: o.innerText.trim() })) : [];
      const benchmarkPill = document.querySelector('.benchmark-pill');
      const bodyText = document.body.innerText;
      return {
        options,
        includesKanchipuram: options.some(o => o.value === 'Kanchipuram' || o.text.includes('Kanchipuram')),
        hasBenchmarkPill: !!benchmarkPill,
        hasLoadedIn: bodyText.includes('Dashboard loaded in')
      };
    })()
  `);
  console.log('Network Dashboard District Filter:', JSON.stringify(networkDistrictFilter, null, 2));
  await captureScreenshot('normal_user_network_dashboard.png');

  // Check Reports & Audit Module (Screen 8)
  console.log('\n--- Checking Reports & Audit Module in Normal Mode ---');
  await evaluate(`
    (() => {
      const navItem = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.innerText.includes('Activity History') || b.innerText.includes('Audit'));
      if (navItem) navItem.click();
    })()
  `);
  await delay(800);

  const reportsAuditState = await evaluate(`
    (() => {
      const benchmarkPill = document.querySelector('.benchmark-pill');
      const tableHeaders = Array.from(document.querySelectorAll('.audit-table thead th')).map(th => th.innerText.trim());
      const districtSelect = document.getElementById('audit-district-filter');
      const districtOptions = districtSelect ? Array.from(districtSelect.querySelectorAll('option')).map(o => o.value) : [];
      const latencyBadges = document.querySelectorAll('.latency-badge');
      return {
        hasBenchmarkPill: !!benchmarkPill,
        tableHeaders,
        hasLatencyColumnHeader: tableHeaders.some(h => h.includes('Latency')),
        districtOptions,
        includesKanchipuram: districtOptions.includes('Kanchipuram'),
        latencyBadgeCount: latencyBadges.length
      };
    })()
  `);
  console.log('Reports & Audit State:', JSON.stringify(reportsAuditState, null, 2));
  await captureScreenshot('normal_user_reports_audit.png');

  // Check Medicine QR Modal in Normal Mode
  console.log('\n--- Checking QR Scanner Modal in Normal Mode ---');
  await evaluate(`
    (() => {
      const navItem = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.innerText.includes('Medicine Check-In'));
      if (navItem) navItem.click();
    })()
  `);
  await delay(800);

  // Click Scan Medicine QR button
  await evaluate(`
    (() => {
      const scanBtn = document.querySelector('.btn-scan-launcher') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Scan') && b.innerText.includes('QR'));
      if (scanBtn) scanBtn.click();
    })()
  `);
  await delay(600);

  const qrModalNormalState = await evaluate(`
    (() => {
      const modal = document.querySelector('.qr-modal-wrapper');
      const stateTesterBar = document.querySelector('.scanner-states-toolbar');
      const presetsLabel = document.querySelector('.qr-presets-section .section-label span');
      return {
        isModalOpen: !!modal,
        hasStateTesterBar: !!stateTesterBar,
        presetsLabelText: presetsLabel ? presetsLabel.innerText.trim() : null
      };
    })()
  `);
  console.log('QR Modal in Normal Mode:', JSON.stringify(qrModalNormalState, null, 2));
  await captureScreenshot('normal_user_qr_modal.png');

  // Close QR modal
  await evaluate(`
    (() => {
      const closeBtn = document.querySelector('.btn-icon[aria-label="Close"]') || document.querySelector('.qr-modal-wrapper .btn-icon');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await delay(500);

  // 2. Toggle Evaluation Mode ON
  console.log('\n--- 2. Toggling to Explicit Evaluation Mode (ON) ---');
  await evaluate(`
    (() => {
      const evalBtn = document.querySelector('.btn-eval-mode-toggle');
      if (evalBtn) evalBtn.click();
    })()
  `);
  await delay(800);

  const evalModeActiveState = await evaluate(`
    (() => {
      const evalToggleBtn = document.querySelector('.btn-eval-mode-toggle');
      const evalToggleText = evalToggleBtn ? evalToggleBtn.innerText.trim() : null;
      const isToggleActive = evalToggleBtn ? evalToggleBtn.classList.contains('active') : false;
      const checklistBtn = document.querySelector('.btn-checklist');
      const resetBtn = document.querySelector('button[title*="Reset"]');
      const roleSelect = document.querySelector('.sidebar-role-select');
      const roleSwitcherHeader = document.querySelector('.demo-role-switcher-header');

      return {
        evalToggleText,
        isToggleActive,
        hasChecklistBtn: !!checklistBtn,
        hasResetBtn: !!resetBtn,
        hasRoleSelect: !!roleSelect,
        hasRoleSwitcherHeader: !!roleSwitcherHeader
      };
    })()
  `);
  console.log('Evaluation Mode Active State:', JSON.stringify(evalModeActiveState, null, 2));
  await captureScreenshot('evaluation_mode_active.png');

  // Open Checklist modal in Evaluation Mode
  console.log('\n--- Opening Demo Checklist Modal in Evaluation Mode ---');
  await evaluate(`
    (() => {
      const checklistBtn = document.querySelector('.btn-checklist');
      if (checklistBtn) checklistBtn.click();
    })()
  `);
  await delay(600);

  const checklistModalState = await evaluate(`
    (() => {
      const modal = document.querySelector('.checklist-modal');
      const items = Array.from(document.querySelectorAll('.checklist-item-title')).map(el => el.innerText.trim());
      return {
        isOpen: !!modal,
        itemCount: items.length,
        items
      };
    })()
  `);
  console.log('Checklist Modal State:', JSON.stringify(checklistModalState, null, 2));
  await captureScreenshot('evaluation_mode_checklist_modal.png');

  // Close Checklist modal
  await evaluate(`
    (() => {
      const closeBtn = document.querySelector('.checklist-modal .btn-icon');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await delay(500);

  // Check Dashboard in Evaluation Mode (benchmark pills should be visible)
  console.log('\n--- Checking Dashboard in Evaluation Mode ---');
  await evaluate(`
    (() => {
      const navItem = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(b => b.innerText.includes('Network Operations') || b.innerText.includes('Console') || b.innerText.includes('Dashboard'));
      if (navItem) navItem.click();
    })()
  `);
  await delay(800);

  const dashboardEvalState = await evaluate(`
    (() => {
      const benchmarkPill = document.querySelector('.benchmark-pill');
      const targetMetricBadge = document.querySelector('.target-metric-badge');
      return {
        hasBenchmarkPill: !!benchmarkPill,
        benchmarkPillText: benchmarkPill ? benchmarkPill.innerText.trim() : null,
        hasTargetMetricBadge: !!targetMetricBadge,
        targetMetricBadgeText: targetMetricBadge ? targetMetricBadge.innerText.trim() : null
      };
    })()
  `);
  console.log('Dashboard in Evaluation Mode:', JSON.stringify(dashboardEvalState, null, 2));
  await captureScreenshot('evaluation_mode_dashboard.png');

  // Return to clean Normal Mode for normal users
  await evaluate(`
    (() => {
      const evalBtn = document.querySelector('.btn-eval-mode-toggle');
      if (evalBtn && evalBtn.innerText.includes('ON')) evalBtn.click();
    })()
  `);
  await delay(500);

  console.log('\nVerification complete! All tests executed cleanly.');
  ws.close();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
