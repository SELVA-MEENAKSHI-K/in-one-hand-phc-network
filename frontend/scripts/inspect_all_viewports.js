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

  const viewports = [
    { name: '1920_desktop', w: 1920, h: 900, mobile: false },
    { name: '1440_desktop', w: 1440, h: 800, mobile: false },
    { name: '1366_laptop',  w: 1366, h: 633, mobile: false },
    { name: '1280_desktop', w: 1280, h: 800, mobile: false },
    { name: '1024_tablet_ls', w: 1024, h: 768, mobile: false },
    { name: '768_tablet_pt',  w: 768, h: 1024, mobile: false },
    { name: '390_mobile',     w: 390, h: 844, mobile: true }
  ];

  const tabs = ['dashboard', 'medicines', 'alerts', 'transfers', 'resources', 'attendance', 'phc-details'];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await delay(200);

    for (const tab of ['dashboard', 'medicines']) {
      await send('Runtime.evaluate', {
        expression: `if (window.__setActiveTab) window.__setActiveTab('${tab}');`
      });
      await delay(250);

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const sidebar = document.querySelector('.app-sidebar');
          const wrapper = document.querySelector('.app-main-wrapper');
          const content = document.querySelector('.app-main-content');
          const header = document.querySelector('.app-header');

          const sR = sidebar ? sidebar.getBoundingClientRect() : null;
          const wR = wrapper ? wrapper.getBoundingClientRect() : null;
          const cR = content ? content.getBoundingClientRect() : null;
          const hR = header ? header.getBoundingClientRect() : null;

          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;

          // Check if there is an unintended gap between sidebar and content
          const gap = (sR && cR && sR.width > 0 && sR.right > 0 && sR.left >= 0) ? (cR.left - sR.right) : cR?.left;

          return {
            winW,
            docW,
            scrollDiff: docW - winW,
            sidebar: sR ? { left: Math.round(sR.left), right: Math.round(sR.right), width: Math.round(sR.width) } : null,
            content: cR ? { left: Math.round(cR.left), right: Math.round(cR.right), width: Math.round(cR.width) } : null,
            header: hR ? { left: Math.round(hR.left), right: Math.round(hR.right), width: Math.round(hR.width) } : null,
            gapBesideSidebar: Math.round(gap || 0)
          };
        })()`,
        returnByValue: true
      });

      const val = res.result.value;
      console.log(`[${vp.name}] ${tab}: winW=${val.winW}, docW=${val.docW}, diff=${val.scrollDiff} | sidebar: [${val.sidebar?.left}..${val.sidebar?.right} (w=${val.sidebar?.width})] | content: [${val.content?.left}..${val.content?.right} (w=${val.content?.width})] | GAP BESIDE SIDEBAR = ${val.gapBesideSidebar}px`);
    }
  }

  ws.close();
}

main().catch(console.error);
