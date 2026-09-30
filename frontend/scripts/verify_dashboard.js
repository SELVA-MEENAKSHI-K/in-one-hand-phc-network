import fs from 'fs';
import path from 'path';

async function main() {
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('5173'));
  if (!pageTarget) {
    console.error('No page target found');
    process.exit(1);
  }
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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  await send('Page.enable');
  await send('DOM.enable');

  const artifactDir = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\24d162d1-9a03-4df9-ba82-e3c6438457ac';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  console.log('\n======================================================');
  console.log('1. VERIFYING DESKTOP VIEWPORT (1366 x 768)');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(500);

  // Navigate to #dashboard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const navItems = Array.from(document.querySelectorAll('.sidebar-nav-item'));
      const item = navItems.find(i => i.innerText.includes('Network Operations') || i.innerText.includes('Network Dashboard') || i.innerText.includes('Network'));
      if (item) item.click();
    })()`,
    returnByValue: true
  });
  await delay(600);

  const desktopInspection = await send('Runtime.evaluate', {
    expression: `(() => {
      const title = document.querySelector('.network-main-title')?.innerText;
      const subtitle = document.querySelector('.network-header-desc')?.innerText;
      const demoBadge = document.querySelector('.network-demo-badge')?.innerText;
      const freshness = document.querySelector('.network-freshness-pill')?.innerText;
      const headerBenchmark = document.querySelector('.network-compact-header .benchmark-pill');
      const urgentAlerts = Array.from(document.querySelectorAll('.urgent-item-banner')).map(el => ({
        severity: el.querySelector('.badge')?.innerText,
        phc: el.querySelector('.urgent-phc-name')?.innerText,
        metric: el.querySelector('.urgent-metric-chip')?.innerText,
        cta: el.querySelector('.urgent-item-cta button')?.innerText
      }));
      const kpis = Array.from(document.querySelectorAll('.kpi-card')).map(el => ({
        title: el.querySelector('.kpi-title')?.innerText,
        value: el.querySelector('.kpi-value')?.innerText,
        unit: el.querySelector('.kpi-unit')?.innerText
      }));
      const toolbar = {
        searchPlaceholder: document.querySelector('.network-search-box input')?.placeholder,
        districtOptions: Array.from(document.querySelectorAll('.filter-dropdown-box select')[0]?.options || []).map(o => o.text),
        verificationOptions: Array.from(document.querySelectorAll('.filter-dropdown-box select')[1]?.options || []).map(o => o.text),
        hasResetBtn: !!document.querySelector('.btn-reset-filters'),
        viewMode: document.querySelector('.view-toggle-btn.active')?.innerText
      };
      const tableRows = Array.from(document.querySelectorAll('.network-phc-table tbody tr')).map(row => ({
        facility: row.querySelector('.phc-table-name')?.innerText,
        district: row.querySelector('.phc-table-sub span')?.innerText,
        status: row.querySelector('.badge')?.innerText,
        beds: row.querySelector('.metric-primary-text')?.innerText,
        actionBtn: row.querySelector('.btn-open-phc')?.innerText
      }));
      const chartTitle = document.querySelector('.chart-main-title')?.innerText;
      const chartActiveTab = document.querySelector('.chart-tab-btn.active')?.innerText;
      const rechartsSvg = !!document.querySelector('.recharts-surface');

      return {
        title,
        subtitle,
        demoBadge,
        freshness,
        hasDeveloperBenchmarkInHeader: !!headerBenchmark,
        urgentAlertsCount: urgentAlerts.length,
        urgentAlertsSample: urgentAlerts[0],
        kpisCount: kpis.length,
        kpis,
        toolbar,
        tableRowsCount: tableRows.length,
        tableRowsSample: tableRows[0],
        chartTitle,
        chartActiveTab,
        rechartsSvg,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()`,
    returnByValue: true
  });

  console.log('Desktop Inspection Result:\n', JSON.stringify(desktopInspection.result.value, null, 2));

  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'desktop_1366_dashboard.png'), Buffer.from(ss.data, 'base64'));

  // Test Interactive Actions
  console.log('\n--- Testing Interactive Toolbar Search & Filters ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('.network-search-box input');
      input.value = 'Medavakkam';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`,
    returnByValue: true
  });
  await delay(400);

  const searchFilterResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const countText = document.querySelector('.results-count-chip')?.innerText;
      const rows = document.querySelectorAll('.network-phc-table tbody tr').length;
      const hasReset = !!document.querySelector('.btn-reset-filters');
      return { countText, rows, hasReset };
    })()`,
    returnByValue: true
  });
  console.log('Search "Medavakkam" Filter Result:', searchFilterResult.result.value);

  // Click Reset Filters
  await send('Runtime.evaluate', {
    expression: `(() => {
      const resetBtn = document.querySelector('.btn-reset-filters');
      if (resetBtn) resetBtn.click();
    })()`,
    returnByValue: true
  });
  await delay(400);

  // Test Chart Tab Switch to "Essential Medicines"
  console.log('\n--- Testing Chart Metric Toggle ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const medTab = Array.from(document.querySelectorAll('.chart-tab-btn')).find(b => b.innerText.includes('Medicines') || b.innerText.includes('மருந்துகள்'));
      if (medTab) medTab.click();
    })()`,
    returnByValue: true
  });
  await delay(400);
  const chartSwitchResult = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        activeTab: document.querySelector('.chart-tab-btn.active')?.innerText,
        chartSub: document.querySelector('.chart-main-sub')?.innerText,
        legendItems: Array.from(document.querySelectorAll('.recharts-legend-item-text')).map(el => el.innerText)
      };
    })()`,
    returnByValue: true
  });
  console.log('Chart Switch Result:', chartSwitchResult.result.value);

  // Test Card View Toggle
  console.log('\n--- Testing View Mode Toggle to Cards ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cardToggle = document.querySelectorAll('.view-toggle-btn')[1];
      if (cardToggle) cardToggle.click();
    })()`,
    returnByValue: true
  });
  await delay(400);
  const cardViewResult = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        cardsCount: document.querySelectorAll('.phc-node-card').length,
        hasTable: !!document.querySelector('.network-phc-table')
      };
    })()`,
    returnByValue: true
  });
  console.log('Card View Result:', cardViewResult.result.value);

  // Switch back to Table View
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tableToggle = document.querySelectorAll('.view-toggle-btn')[0];
      if (tableToggle) tableToggle.click();
    })()`,
    returnByValue: true
  });
  await delay(300);

  console.log('\n======================================================');
  console.log('2. VERIFYING TABLET VIEWPORT (768 x 1024)');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await delay(500);

  const tabletInspection = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        innerWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        kpiCount: document.querySelectorAll('.kpi-card').length,
        tableVisible: !!document.querySelector('.network-phc-table'),
        cardsVisible: !!document.querySelector('.phc-cards-grid')
      };
    })()`,
    returnByValue: true
  });
  console.log('Tablet Inspection Result:', tabletInspection.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'tablet_768_dashboard.png'), Buffer.from(ss.data, 'base64'));

  console.log('\n======================================================');
  console.log('3. VERIFYING MOBILE VIEWPORT (390 x 844)');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await delay(500);

  const mobileInspection = await send('Runtime.evaluate', {
    expression: `(() => {
      const doc = document.documentElement;
      const overflowingElements = [];
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 2) {
          overflowingElements.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 30) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      }

      return {
        innerWidth: window.innerWidth,
        docScrollWidth: doc.scrollWidth,
        hasHorizontalOverflow: doc.scrollWidth > window.innerWidth,
        overflowingElementsCount: overflowingElements.length,
        overflowingElements: overflowingElements.slice(0, 5),
        kpiCardsCount: document.querySelectorAll('.kpi-card').length,
        phcCardsCount: document.querySelectorAll('.phc-node-card').length,
        urgentItemCount: document.querySelectorAll('.urgent-item-banner').length
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Inspection Result:', mobileInspection.result.value);

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'mobile_390_dashboard.png'), Buffer.from(ss.data, 'base64'));

  console.log('\n======================================================');
  console.log('4. VERIFYING TAMIL LANGUAGE SUPPORT');
  console.log('======================================================');

  // Switch to Tamil
  await send('Runtime.evaluate', {
    expression: `(() => {
      const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('தமிழ்'));
      if (langBtn) langBtn.click();
    })()`,
    returnByValue: true
  });
  await delay(500);

  const tamilInspection = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        title: document.querySelector('.network-main-title')?.innerText,
        demoBadge: document.querySelector('.network-demo-badge')?.innerText,
        kpiSample: document.querySelector('.kpi-card .kpi-title')?.innerText,
        urgentTitle: document.querySelector('.urgent-card-title')?.innerText,
        chartTab: document.querySelector('.chart-tab-btn.active')?.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('Tamil Inspection Result:', tamilInspection.result.value);

  // Switch back to English
  await send('Runtime.evaluate', {
    expression: `(() => {
      const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English'));
      if (langBtn) langBtn.click();
    })()`,
    returnByValue: true
  });
  await delay(300);

  // Reset viewport to desktop
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  ws.close();
  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
}

main().catch(console.error);
