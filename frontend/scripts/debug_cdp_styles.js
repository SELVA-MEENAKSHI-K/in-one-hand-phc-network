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
  console.log('--- CSS.getMatchedStylesForNode ---');
  for (const m of matched.matchedCSSRules) {
    const transform = m.rule.style.cssProperties.find(p => p.name === 'transform');
    const visibility = m.rule.style.cssProperties.find(p => p.name === 'visibility');
    if (transform || visibility) {
      console.log('Rule selector:', m.rule.selectorList.text);
      if (transform) console.log('  transform:', transform.value, transform.important ? '!important' : '');
      if (visibility) console.log('  visibility:', visibility.value, visibility.important ? '!important' : '');
    }
  }

  // Also check inline style
  if (matched.inlineStyle) {
    console.log('Inline style:', matched.inlineStyle.cssText);
  }

  ws.close();
}

main().catch(console.error);
