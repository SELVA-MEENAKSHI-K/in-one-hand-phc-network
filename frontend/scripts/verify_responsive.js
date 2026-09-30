import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Chrome on port 9222...');
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
  console.log('CDP WebSocket connected!');

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

  const captureScreenshot = async (filePath) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // Enable Page & DOM
  await send('Page.enable');
  await send('DOM.enable');

  const artifactDir = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\e7571cc8-3173-4506-b611-f424dc327111';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  console.log('\n========================================');
  console.log('1. TESTING MOBILE VIEWPORT (390 x 844)');
  console.log('========================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await delay(300);

  // Navigate to Medicine tab
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('.thumb-btn, .sidebar-nav-item')).find(el => el.textContent.includes('Medicine'));
      if (btn) btn.click();
    })()
  `);
  await delay(600);

  // Measure Mobile Page Overflow
  const mobileMetrics = await evaluate(`
    (() => {
      const doc = document.documentElement;
      const body = document.body;
      const medicinesPage = document.querySelector('.medicines-page');
      return {
        windowInnerWidth: window.innerWidth,
        docScrollWidth: doc.scrollWidth,
        bodyScrollWidth: body.scrollWidth,
        pageScrollWidth: medicinesPage ? medicinesPage.scrollWidth : null,
        hasHorizontalOverflow: doc.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Mobile Viewport Metrics:', mobileMetrics);

  // TAB 1: Inventory Catalog Verification
  console.log('\n--- Verifying Tab 1: Inventory Catalog ---');
  await evaluate(`
    (() => {
      const tab = Array.from(document.querySelectorAll('.sub-tab')).find(t => t.textContent.includes('Inventory'));
      if (tab) tab.click();
    })()
  `);
  await delay(400);

  const catalogMetrics = await evaluate(`
    (() => {
      const searchBox = document.querySelector('.search-input-box');
      const filterBox = document.querySelector('.filter-dropdown-box');
      const rows = Array.from(document.querySelectorAll('table.inventory-table tbody tr'));
      const burnRateCell = document.querySelector('.forecast-mini-cell');

      return {
        searchBoxWidth: searchBox ? searchBox.getBoundingClientRect().width : null,
        filterBoxWidth: filterBox ? filterBox.getBoundingClientRect().width : null,
        rowCount: rows.length,
        burnRateFormatted: burnRateCell ? window.getComputedStyle(burnRateCell).display : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Inventory Catalog Check:', catalogMetrics);
  await captureScreenshot(path.join(artifactDir, 'mobile_inventory.png'));

  // TAB 2: Check-In Form Verification
  console.log('\n--- Verifying Tab 2: Medicine Check-In ---');
  await evaluate(`
    (() => {
      const tab = Array.from(document.querySelectorAll('.sub-tab')).find(t => t.textContent.includes('Check-In'));
      if (tab) tab.click();
    })()
  `);
  await delay(400);

  const checkInMetrics = await evaluate(`
    (() => {
      const formCard = document.querySelector('.transaction-form-card');
      const header = document.querySelector('.form-card-header');
      const qrBtn = document.querySelector('.btn-scan-launcher');
      const formGrid = document.querySelector('.form-grid');
      const labels = Array.from(document.querySelectorAll('.form-group label')).map(l => ({
        text: l.innerText.trim(),
        width: l.getBoundingClientRect().width
      }));
      const inputs = Array.from(document.querySelectorAll('.form-group input, .form-group select')).map(i => ({
        type: i.type || i.tagName,
        width: i.getBoundingClientRect().width
      }));
      const actionsRow = document.querySelector('.form-actions-row');
      const bottomNav = document.querySelector('.mobile-bottom-thumb-nav');
      
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      const actionRect = actionsRow ? actionsRow.getBoundingClientRect() : null;
      const navRect = bottomNav ? bottomNav.getBoundingClientRect() : null;

      // Check if button is covered
      const isCovered = (actionRect && navRect) ? actionRect.bottom > navRect.top : false;
      const clearancePx = (actionRect && navRect) ? navRect.top - actionRect.bottom : null;

      return {
        formCardWidth: formCard ? formCard.getBoundingClientRect().width : null,
        headerFlexDir: header ? window.getComputedStyle(header).flexDirection : null,
        qrBtnWidth: qrBtn ? qrBtn.getBoundingClientRect().width : null,
        formGridCols: formGrid ? window.getComputedStyle(formGrid).gridTemplateColumns : null,
        labelCount: labels.length,
        labels,
        inputsSampleWidths: inputs.map(i => i.width),
        isActionButtonCoveredByBottomNav: isCovered,
        clearanceAboveBottomNavPx: clearancePx,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Check-In Form Check:', checkInMetrics);

  // Test Required Field Validation without submitting
  console.log('\n--- Verifying Required-Field Validation (Check-In) ---');
  const checkInValidation = await evaluate(`
    (() => {
      const form = document.querySelector('form.transaction-form');
      const select = form ? form.querySelector('select[required]') : null;
      const qty = form ? form.querySelector('input[type="number"][required]') : null;
      const isValid = form ? form.checkValidity() : null;
      const selectValid = select ? select.checkValidity() : null;
      const qtyValid = qty ? qty.checkValidity() : null;

      return {
        formOverallValid: isValid,
        selectMedicineValid: selectValid,
        quantityValid: qtyValid,
        validationMessage: select ? select.validationMessage : null
      };
    })()
  `);
  console.log('Check-In Validation Result:', checkInValidation);
  await captureScreenshot(path.join(artifactDir, 'mobile_checkin.png'));

  // Test QR Scanner Modal at 390px
  console.log('\n--- Verifying QR Scanner Modal at 390px ---');
  await evaluate(`
    (() => {
      const btn = document.querySelector('.btn-scan-launcher');
      if (btn) btn.click();
    })()
  `);
  await delay(600);

  const qrModalMetrics = await evaluate(`
    (() => {
      const modal = document.querySelector('.modal-card.qr-scanner-modal');
      const cameraBar = document.querySelector('.camera-controls-bar');
      const presets = document.querySelectorAll('.preset-btn');
      return {
        modalWidth: modal ? modal.getBoundingClientRect().width : null,
        cameraBarWidth: cameraBar ? cameraBar.getBoundingClientRect().width : null,
        presetCount: presets.length,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('QR Scanner Modal Check:', qrModalMetrics);
  await captureScreenshot(path.join(artifactDir, 'mobile_qr_modal.png'));

  // Close QR modal
  await evaluate(`
    (() => {
      const closeBtn = document.querySelector('.modal-card .btn-icon');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await delay(400);

  // TAB 3: Check-Out Form Verification
  console.log('\n--- Verifying Tab 3: Medicine Check-Out ---');
  await evaluate(`
    (() => {
      const tab = Array.from(document.querySelectorAll('.sub-tab')).find(t => t.textContent.includes('Check-Out'));
      if (tab) tab.click();
    })()
  `);
  await delay(400);

  const checkOutMetrics = await evaluate(`
    (() => {
      const formCard = document.querySelector('.transaction-form-card');
      const submitBtn = document.querySelector('.form-actions-row button[type="submit"]');
      const actionsRow = document.querySelector('.form-actions-row');
      const bottomNav = document.querySelector('.mobile-bottom-thumb-nav');
      
      window.scrollTo(0, document.body.scrollHeight);
      const actionRect = actionsRow ? actionsRow.getBoundingClientRect() : null;
      const navRect = bottomNav ? bottomNav.getBoundingClientRect() : null;
      const isCovered = (actionRect && navRect) ? actionRect.bottom > navRect.top : false;
      const clearancePx = (actionRect && navRect) ? navRect.top - actionRect.bottom : null;

      return {
        formCardWidth: formCard ? formCard.getBoundingClientRect().width : null,
        isSubmitBtnDisabledWhenEmpty: submitBtn ? submitBtn.disabled : null,
        isActionButtonCoveredByBottomNav: isCovered,
        clearanceAboveBottomNavPx: clearancePx,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Check-Out Form Check:', checkOutMetrics);
  await captureScreenshot(path.join(artifactDir, 'mobile_checkout.png'));

  console.log('\n========================================');
  console.log('2. TESTING TABLET VIEWPORT (768 x 1024)');
  console.log('========================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await delay(400);

  const tabletMetrics = await evaluate(`
    (() => {
      const formCard = document.querySelector('.transaction-form-card');
      return {
        windowInnerWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        formCardWidth: formCard ? formCard.getBoundingClientRect().width : null,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Tablet Viewport Metrics:', tabletMetrics);
  await captureScreenshot(path.join(artifactDir, 'tablet_checkout.png'));

  console.log('\n========================================');
  console.log('3. TESTING DESKTOP VIEWPORT (1280 x 800)');
  console.log('========================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(400);

  const desktopMetrics = await evaluate(`
    (() => {
      const formCard = document.querySelector('.transaction-form-card');
      const formGrid = document.querySelector('.form-grid');
      return {
        windowInnerWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        formCardWidth: formCard ? formCard.getBoundingClientRect().width : null,
        formGridColumns: formGrid ? window.getComputedStyle(formGrid).gridTemplateColumns : null,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Desktop Viewport Metrics:', desktopMetrics);
  await captureScreenshot(path.join(artifactDir, 'desktop_checkout.png'));

  // Reset emulation to normal
  await send('Emulation.clearDeviceMetricsOverride');

  ws.close();
  console.log('\nAll responsive verification steps completed successfully with ZERO stock modifications!');
}

main().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
