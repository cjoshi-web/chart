(function () {
  const $ = id => document.getElementById(id);
  const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const k in a) { if (a[k] === undefined) continue; if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e[k] = a[k]; else e.setAttribute(k, a[k]); } c.flat().forEach(x => e.append(x)); return e; };

  // ---------- Config ----------
  const SYMBOLS = [['Nifty 50', '^NSEI'], ['Sensex', '^BSESN'], ['Bank Nifty', '^NSEBANK'], ['XAUUSD', 'XAUUSD=X'], ['BTCUSD', 'BTC-USD']]; // naam, Yahoo symbol
  const TFS = [['1m', '1m', '7d'], ['5m', '5m', '30d'], ['15m', '15m', '60d'], ['1h', '60m', '730d'], ['1D', '1d', '5y']];
  const TFMIN = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '60m': 60, '1d': 1440 };
  const RANGE = { '1m': '7d', '5m': '30d', '15m': '60d', '30m': '60d', '60m': '730d' };
  const ICON = {
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><path d="M3 3l18 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    act: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>'
  };
  const ico = n => { const s = document.createElement('span'); s.style.display = 'flex'; s.innerHTML = `<svg viewBox="0 0 24 24">${ICON[n]}</svg>`; return s; };

  // Indicator settings schema (tab: i = Inputs, s = Style). Naya features ahiya add thase.
  const MODES = ['Fixed Points', 'Percentage (Fixed)', 'Percentage (Compounding)', 'ATR Points', 'Session ATR', 'Daily ATR %'];
  const SCHEMA = [
    { id: 'step', group: 'Dynamic Step Line', items: [
      { k: 'sShow', t: 'bool', l: 'Show Step Line', d: true, tab: 'i' },
      { k: 'sMode', t: 'select', l: 'Box Method', o: MODES, d: 'Daily ATR %', tab: 'i' },
      { k: 'sVal', t: 'num', l: 'Input (Points or %)', d: 0.1, min: 0.001, step: 0.01, tab: 'i', en: v => ['Fixed Points', 'Percentage (Fixed)', 'Percentage (Compounding)'].includes(v.sMode) },
      { k: 'sLen', t: 'num', l: 'ATR Length', d: 5, min: 1, step: 1, tab: 'i', en: v => ['ATR Points', 'Session ATR', 'Daily ATR %'].includes(v.sMode) },
      { k: 'sHrs', t: 'num', l: 'Trading Hours', d: 6.5, min: 1, step: 0.5, tab: 'i', en: v => v.sMode === 'Session ATR' },
      { k: 'sMult', t: 'num', l: 'Daily ATR Multiplier', d: 0.25, min: 0.01, step: 0.05, tab: 'i', en: v => v.sMode === 'Daily ATR %' },
      { k: 'sProt', t: 'num', l: 'Step Reversal Protection (Bricks)', d: 0, min: 0, max: 10, step: 1, tab: 'i' },
      { k: 'sCol', t: 'select', l: 'Step Line Color', o: ['Normal Step Line', 'Dynamic Candles Breakout/Breakdown'], d: 'Normal Step Line', tab: 'i' },
      { k: 'sUp', t: 'color', l: 'Up Color', d: '#00bcd4', tab: 's' },
      { k: 'sDn', t: 'color', l: 'Down Color', d: '#e91e63', tab: 's' } ] },
    { id: 'ema', group: 'Smart EMA & Cloud', items: [
      { k: 'eSmart', t: 'bool', l: 'Show Smart EMA', d: true, tab: 'i' },
      { k: 'eSLen', t: 'num', l: 'Smart EMA Length (Base TF)', d: 5, min: 1, step: 1, tab: 'i' },
      { k: 'eBase', t: 'select', n: 1, l: 'Smart EMA Base Timeframe', o: [[5, '5m'], [15, '15m'], [30, '30m'], [60, '1h']], d: 30, tab: 'i' },
      { k: 'eShow', t: 'bool', l: 'Show EMA', d: false, tab: 'i' },
      { k: 'eType', t: 'select', l: 'MV Type', o: KIS.maTypes.map(m => [m, m.toUpperCase()]), d: 'ema', tab: 'i' },
      { k: 'eLen', t: 'num', l: 'Length', d: 10, min: 1, step: 1, tab: 'i' },
      { k: 'eCloud', t: 'bool', l: 'Show Cloud (Smart EMA & EMA)', d: true, tab: 'i' },
      { k: 'eSCol', t: 'color', l: 'Smart EMA Color', d: '#2962ff', tab: 's' },
      { k: 'eCol', t: 'color', l: 'EMA Color', d: '#ff0000', tab: 's' } ] },
    { id: 'zone', group: 'Institution Zone', items: [
      { k: 'zShow', t: 'bool', l: 'Show Institution Zone', d: true, tab: 'i' },
      { k: 'zTf', t: 'select', l: 'Zone Timeframe', o: [['5m', '5m'], ['15m', '15m'], ['30m', '30m'], ['60m', '1h']], d: '5m', tab: 'i' },
      { k: 'zTop', t: 'num', l: 'Fib Top', d: 0.56, min: 0, max: 1, step: 0.01, tab: 'i' },
      { k: 'zBot', t: 'num', l: 'Fib Bottom', d: 0.44, min: 0, max: 1, step: 0.01, tab: 'i' },
      { k: 'zCol', t: 'color', l: 'Zone Color', d: '#ff0000', tab: 's' },
      { k: 'zOp', t: 'num', l: 'Zone Opacity (0-1)', d: 0.7, min: 0, max: 1, step: 0.05, tab: 's' } ] },
    { id: 'dash', group: 'Dashboard', items: [
      { k: 'dShow', t: 'bool', l: 'Show Dashboard', d: true, tab: 'i' } ] }
  ];
  const DEF = {}; SCHEMA.forEach(g => g.items.forEach(i => DEF[i.k] = i.d));
  const keysOf = id => SCHEMA.find(g => g.id === id).items.map(i => i.k);

  // ---------- Saved state (page reload par pan settings yaad rahe) ----------
  let S = { theme: 'dark', sym: '^NSEI', tf: '5m', has: true, vis: true, P: { ...DEF } };
  try { const j = JSON.parse(localStorage.getItem('kisChart1')); if (j) S = { ...S, ...j, P: { ...DEF, ...(j.P || {}) } }; } catch (e) {}
  const save = () => { try { localStorage.setItem('kisChart1', JSON.stringify(S)); } catch (e) {} };
  document.documentElement.dataset.theme = S.theme;

  // ---------- Chart ----------
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const themeOpts = () => ({
    layout: { background: { type: LightweightCharts.ColorType.Solid, color: css('--chart-bg') }, textColor: css('--text') },
    grid: { vertLines: { color: css('--grid') }, horzLines: { color: css('--grid') } },
    timeScale: { borderColor: css('--line') }, rightPriceScale: { borderColor: css('--line') }
  });
  const chart = LightweightCharts.createChart($('chart'), {
    ...themeOpts(), autoSize: true,
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: css('--line') },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal }
  });
  const candle = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
  const mkLine = (w, step) => chart.addLineSeries({ lineWidth: w, lastValueVisible: false, priceLineVisible: false, ...(step ? { lineType: LightweightCharts.LineType ? LightweightCharts.LineType.WithSteps : 1 } : {}) });
  const stepSeries = mkLine(3, true), smartSeries = mkLine(2), emaSeries = mkLine(1);

  class Layer { constructor(fn) { this.fn = fn; this.v = { zOrder: () => 'bottom', renderer: () => ({ draw: t => this.fn(t) }) }; }
    attached(p) { this.p = p; } detached() {} updateAllViews() {} paneViews() { return [this.v]; } refresh() { this.p && this.p.requestUpdate(); } }
  let cloudData = [], zoneRects = [];
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
  const cloudLayer = new Layer(t => t.useBitmapCoordinateSpace(({ context: c, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
    const ts = chart.timeScale(), P = cloudData.map(p => ({ x: ts.timeToCoordinate(p.time), a: candle.priceToCoordinate(p.a), b: candle.priceToCoordinate(p.b), up: p.up }));
    const ok = p => p.x != null && p.a != null && p.b != null;
    const fill = (s, e, up) => { c.beginPath(); c.moveTo(P[s - 1].x * hr, P[s - 1].a * vr); for (let k = s; k <= e; k++) c.lineTo(P[k].x * hr, P[k].a * vr);
      for (let k = e; k >= s - 1; k--) c.lineTo(P[k].x * hr, P[k].b * vr); c.closePath(); c.fillStyle = up ? 'rgba(0,230,118,.15)' : 'rgba(255,82,82,.15)'; c.fill(); };
    let st = null, ru = null;
    for (let i = 1; i <= P.length; i++) {
      const good = i < P.length && ok(P[i - 1]) && ok(P[i]), up = good ? P[i].up : null;
      if (st != null && (!good || up !== ru)) { fill(st, i - 1, ru); st = null; }
      if (good && st == null) { st = i; ru = up; }
    }
  }));
  const zoneLayer = new Layer(t => t.useBitmapCoordinateSpace(({ context: c, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
    const ts = chart.timeScale(), col = rgba(S.P.zCol, S.P.zOp);
    for (const z of zoneRects) {
      const x0 = ts.timeToCoordinate(z.t0), x1 = ts.timeToCoordinate(z.t1), y0 = candle.priceToCoordinate(z.top), y1 = candle.priceToCoordinate(z.bot);
      if (x0 == null || x1 == null || y0 == null || y1 == null) continue;
      c.fillStyle = col; c.fillRect(x0 * hr, Math.min(y0, y1) * vr, Math.max(1, (x1 - x0) * hr), Math.abs(y1 - y0) * vr);
    }
  }));
  candle.attachPrimitive(cloudLayer); candle.attachPrimitive(zoneLayer);

  // ---------- Data + apply (settings badalta chart reload / zoom reset nahi thay) ----------
  let bars = [], daily = [], zbars = [], zKey = '', ver = 0, zv = 0, curIv = '5m', infoHtml = '';
  const cache = {};
  const upd = (n, key, fn) => { if (cache[n] === key) return false; cache[n] = key; fn(); return true; };
  const fmt = v => v == null || !isFinite(v) ? 'N/A' : v.toFixed(2);
  const setStatus = t => $('status').textContent = t;
  const symName = () => (SYMBOLS.find(s => s[1] === S.sym) || [S.sym])[0];

  function buildInfo(mode, L) {
    const sfx = L.dir === 1 ? [' (Call)', ' (Target)', ' (SL)'] : L.dir === -1 ? [' (Put)', ' (SL)', ' (Target)'] : ['', '', ''];
    return `Box: ${mode}` + (L.master != null ? ` | Master ATR (D): ${fmt(L.master)}` : '') +
      `<br>Brick: ${fmt(L.step)}${L.step && L.level ? ' (' + (L.step / L.level * 100).toFixed(2) + '%)' : ''}` +
      `<br>Level: ${fmt(L.level)}${sfx[0]}<br>Next Up: ${fmt(L.up)}${sfx[1]}<br>Next Down: ${fmt(L.down)}${sfx[2]}`;
  }
  function applyAll() {
    const P = S.P, on = S.has && S.vis, ts = chart.timeScale(), rng = ts.getVisibleLogicalRange();
    const key = id => ver + '|' + on + '|' + keysOf(id).map(k => P[k]).join('|');
    let ch = false;
    ch = upd('step', key('step'), () => {
      if (!on || !P.sShow || !bars.length) { stepSeries.setData([]); infoHtml = ''; return; }
      const r = KIS.stepLine(bars, daily, { mode: P.sMode, value: P.sVal, atrLen: Math.max(1, P.sLen | 0), hours: P.sHrs || 6.5, mult: P.sMult, protect: Math.max(0, P.sProt | 0), colorMode: P.sCol, up: P.sUp, down: P.sDn });
      stepSeries.setData(r.points); infoHtml = buildInfo(P.sMode, r.last);
    }) || ch;
    ch = upd('ema', key('ema'), () => {
      if (!on || !bars.length) { smartSeries.setData([]); emaSeries.setData([]); cloudData = []; return; }
      const r = KIS.smartCloud(bars, { sLen: Math.max(1, P.eSLen | 0), baseMin: +P.eBase, tfMin: TFMIN[curIv] || 1, type: P.eType, len: Math.max(1, P.eLen | 0) });
      smartSeries.setData(P.eSmart ? r.smart : []); emaSeries.setData(P.eShow ? r.ema : []); cloudData = P.eCloud ? r.cloud : [];
    }) || ch;
    upd('zone', ver + '|' + zv + '|' + on + '|' + [P.zShow, P.zTop, P.zBot].join('|'), () => {
      zoneRects = on && P.zShow && curIv !== '1d' && zbars.length && bars.length ? KIS.institutionZones(zbars, bars, { top: +P.zTop, bottom: +P.zBot }) : [];
    });
    smartSeries.applyOptions({ color: P.eSCol }); emaSeries.applyOptions({ color: P.eCol });
    const info = $('info'); info.innerHTML = infoHtml; info.style.display = on && P.dShow && infoHtml ? 'block' : 'none';
    if (ch && rng) ts.setVisibleLogicalRange(rng);
    cloudLayer.refresh(); zoneLayer.refresh();
  }
  async function get(symbol, iv, range) {
    const r = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${iv}&range=${range}`);
    const d = await r.json(); if (d.error) throw new Error(d.error);
    return d.filter((c, i, a) => i === 0 || c.time > a[i - 1].time);
  }
  async function ensureZone() {
    const P = S.P;
    if (!(S.has && P.zShow) || curIv === '1d') { if (zbars.length) { zbars = []; zv++; } zKey = ''; return; }
    const key = S.sym + '|' + curIv + '|' + P.zTf; if (key === zKey) return; zKey = key;
    if (P.zTf === curIv) zbars = bars;
    else { try { zbars = await get(S.sym, P.zTf, RANGE[P.zTf]); } catch (e) { zbars = []; setStatus('Zone data: ' + e.message); } }
    zv++;
  }
  async function load(fit) {
    const tf = TFS.find(t => t[1] === S.tf) || TFS[1], t0 = performance.now();
    const rng = chart.timeScale().getVisibleLogicalRange(); setStatus('Loading...');
    try {
      const [d, dd] = await Promise.all([get(S.sym, tf[1], tf[2]), tf[1] === '1d' ? null : get(S.sym, '1d', '2y')]);
      curIv = tf[1]; bars = d; daily = dd || d; zKey = ''; ver++;
      candle.setData(bars); await ensureZone(); applyAll();
      if (fit || !rng) chart.timeScale().fitContent(); else chart.timeScale().setVisibleLogicalRange(rng);
      setStatus(`${symName()} · ${tf[0]} · ${bars.length} candles · ${(performance.now() - t0).toFixed(0)} ms`);
    } catch (e) { setStatus('Error: ' + e.message); }
  }

  // ---------- Popups ----------
  function modal(title, build) {
    const ov = h('div', { class: 'ov' }), md = h('div', { class: 'md' });
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    ov.onmousedown = e => { if (e.target === ov) close(); };
    document.addEventListener('keydown', esc);
    md.append(h('div', { class: 'md-h' }, h('span', {}, title), h('button', { onclick: close, title: 'Close' }, ico('x'))));
    build(md, close); ov.append(md); document.body.append(ov);
  }
  function control(it, draft, onChange) {
    let c;
    if (it.t === 'bool') { c = h('input', { type: 'checkbox' }); c.checked = !!draft[it.k]; c.onchange = () => { draft[it.k] = c.checked; onChange(); }; }
    else if (it.t === 'select') { c = h('select', { class: 'sel' }); it.o.forEach(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; c.append(h('option', { value: v }, l)); });
      c.value = String(draft[it.k]); c.onchange = () => { draft[it.k] = it.n ? +c.value : c.value; onChange(); }; }
    else if (it.t === 'num') { c = h('input', { type: 'number', min: it.min, max: it.max, step: it.step }); c.value = draft[it.k];
      c.oninput = () => { const v = parseFloat(c.value); if (!isNaN(v)) { draft[it.k] = v; onChange(); } }; }
    else { c = h('input', { type: 'color' }); c.value = draft[it.k]; c.oninput = () => { draft[it.k] = c.value; }; }
    return c;
  }
  function openSettings() {
    modal('Keep It Simple v2.0', (md, close) => {
      const draft = { ...S.P }; let tab = 'i'; const body = h('div', { class: 'md-b' }), rows = [];
      const tabs = h('div', { class: 'tabs' }), tI = h('button', {}, 'Inputs'), tS = h('button', {}, 'Style');
      const refreshEn = () => rows.forEach(r => { const d = r.it.en && !r.it.en(draft); r.row.classList.toggle('dis', !!d); r.c.disabled = !!d; });
      const render = () => {
        tI.className = tab === 'i' ? 'on' : ''; tS.className = tab === 's' ? 'on' : ''; body.innerHTML = ''; rows.length = 0;
        SCHEMA.forEach(g => { const items = g.items.filter(i => i.tab === tab); if (!items.length) return;
          body.append(h('div', { class: 'grp' }, g.group));
          items.forEach(it => { const c = control(it, draft, refreshEn), row = h('label', { class: 'row' }, h('span', {}, it.l), c); rows.push({ it, c, row }); body.append(row); }); });
        refreshEn();
      };
      tI.onclick = () => { tab = 'i'; render(); }; tS.onclick = () => { tab = 's'; render(); };
      tabs.append(tI, tS);
      const foot = h('div', { class: 'md-f' },
        h('button', { class: 'btn', onclick: () => { Object.assign(draft, DEF); render(); } }, 'Defaults'), h('div', { class: 'sp' }),
        h('button', { class: 'btn', onclick: close }, 'Cancel'),
        h('button', { class: 'btn pri', onclick: async () => { S.P = draft; save(); close(); await ensureZone(); applyAll(); } }, 'Ok'));
      md.append(tabs, body, foot); render();
    });
  }
  function openIndicators() {
    modal('Indicators', (md, close) => {
      const list = h('div', { class: 'md-b', style: 'padding:0' });
      const items = [{ name: 'Keep It Simple v2.0', desc: 'Step Line, Smart EMA cloud, Institution Zone' }];
      const draw = q => { list.innerHTML = ''; items.filter(i => i.name.toLowerCase().includes(q.toLowerCase())).forEach(i => {
        list.append(h('div', { class: 'item', onclick: async () => { S.has = true; S.vis = true; save(); close(); renderLegend(); await ensureZone(); applyAll(); } },
          h('div', {}, h('b', {}, i.name), h('small', {}, i.desc)), S.has ? h('span', { class: 'badge' }, 'Added') : h('span'))); }); };
      const s = h('input', { class: 'sel srch', placeholder: 'Search indicators', type: 'text' }); s.oninput = () => draw(s.value);
      md.append(s, list); draw(''); s.focus();
    });
  }
  function renderLegend() {
    const r = $('lgRow'); r.innerHTML = ''; if (!S.has) return;
    r.append(h('div', { class: 'lg' + (S.vis ? '' : ' off') }, h('span', { class: 'nm' }, 'KIS v2.0'),
      h('button', { title: S.vis ? 'Hide' : 'Show', onclick: () => { S.vis = !S.vis; save(); renderLegend(); applyAll(); } }, ico(S.vis ? 'eye' : 'eyeoff')),
      h('button', { title: 'Settings', onclick: openSettings }, ico('gear')),
      h('button', { title: 'Remove', onclick: () => { S.has = false; save(); renderLegend(); applyAll(); } }, ico('x'))));
  }

  // ---------- Toolbar wiring ----------
  SYMBOLS.forEach(s => $('sym').append(h('option', { value: s[1] }, s[0]))); $('sym').value = S.sym;
  $('sym').onchange = () => { S.sym = $('sym').value; save(); load(true); };
  TFS.forEach(t => $('tfs').append(h('button', { 'data-tf': t[1], onclick: () => { S.tf = t[1]; save(); markTf(); load(true); } }, t[0])));
  const markTf = () => document.querySelectorAll('#tfs button').forEach(b => b.classList.toggle('on', b.dataset.tf === S.tf));
  const themeIco = () => { $('theme').innerHTML = ''; $('theme').append(ico(S.theme === 'dark' ? 'sun' : 'moon')); };
  $('theme').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; chart.applyOptions(themeOpts()); themeIco(); save(); };
  $('refresh').append(ico('refresh')); $('refresh').onclick = () => load(false);
  $('icoAct').append(ico('act')); $('indBtn').onclick = openIndicators;
  markTf(); themeIco(); renderLegend(); load(true);
})();
