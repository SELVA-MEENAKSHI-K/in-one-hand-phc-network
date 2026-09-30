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

  await send('DOM.enable');
  await send('CSS.enable');

  const doc = await send('DOM.getDocument', { depth: -1 });
  const nodeRes = await send('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: '.app-sidebar'
  });

  const matched = await send('CSS.getMatchedStylesForNode', { nodeId: nodeRes.nodeId });
  
  console.log('--- ALL MATCHED RULES AFFECTING TRANSFORM OR VISIBILITY ---');
  for (const m of matched.matchedCSSRules) {
    const t = m.rule.style.cssProperties.find(p => p.name === 'transform');
    const v = m.rule.style.cssProperties.find(p => p.name === 'visibility');
    if (t || v) {
      console.log('--------------------------------------------------');
      console.log('Selector:', m.rule.selectorList.text);
      console.log('Origin:', m.rule.origin);
      console.log('StyleSheetId:', m.rule.styleSheetId);
      console.log('Range:', m.rule.style.range);
      if (t) console.log('transform:', t.value, t.important ? '!important' : '');
      if (v) console.log('visibility:', v.value, v.important ? '!important' : '');
      console.log('Full cssText:', m.rule.style.cssText);
    }
  }

  ws.close();
}

main().catch(console.error);
