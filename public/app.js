(function () {
  const $ = id => document.getElementById(id);
  const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const k in a) { if (a[k] === undefined) continue; if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e[k] = a[k]; else e.setAttribute(k, a[k]); } c.flat().forEach(x => e.append(x)); return e; };

  // ---------- Config ----------
  const SYMBOLS = [['Nifty 50', ['^NSEI']], ['Sensex', ['^BSESN']], ['Bank Nifty', ['^NSEBANK']], ['XAUUSD', ['XAUUSD=X', 'GC=F']], ['BTCUSD', ['BTC-USD']]]; // naam, Yahoo symbols (pehla na chale to bijo try thay)
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
  const B = (k, l, d, x = {}) => ({ k, t: 'bool', l, d, tab: 'i', ...x });
  const Sel = (k, l, o, d, x = {}) => ({ k, t: 'select', l, o, d, tab: 'i', ...x });
  const Num = (k, l, d, min, max, step, x = {}) => ({ k, t: 'num', l, d, min, max, step, tab: 'i', ...x });
  const Col = (k, l, d) => ({ k, t: 'color', l, d, tab: 's' });
  const MODES = ['Fixed Points', 'Percentage (Fixed)', 'Percentage (Compounding)', 'ATR Points', 'Session ATR', 'Daily ATR %'];
  const SRC = KIS.srcNames, MV = KIS.maTypes.map(m => [m, m]);
  const CM = ['None', 'As Per Step Line', 'As Per Step Line Breakout/Breakdown', 'RSI', 'Supertrend 1 & 2', 'HalfTrend', 'Smart EMA'];
  const isST = v => v.cMode === 'Supertrend 1 & 2', isHT = v => v.cMode === 'HalfTrend';
  const SCHEMA = [
    { id: 'src', group: 'Source Data', items: [
      Sel('sSrc', 'Step Data Source', SRC, 'Real Price', { tip: 'Step line kaya price par chale: Real Price, Heikin Ashi ke moving average.' }),
      Num('sSrcLen', 'Source Length', 9, 1, 500, 1, { en: v => v.sSrc !== 'Real Price' && v.sSrc !== 'Chart Native' && v.sSrc !== 'Heikin Ashi' }) ] },
    { id: 'step', group: 'Dynamic Step Line', items: [
      B('sShow', 'Show Step Line', true),
      Sel('sMode', 'Box Method', MODES, 'Daily ATR %'),
      Num('sVal', 'Input (Points or %)', 0.1, 0.001, 100000, 0.01, { en: v => ['Fixed Points', 'Percentage (Fixed)', 'Percentage (Compounding)'].includes(v.sMode) }),
      Num('sLen', 'ATR Length', 5, 1, 200, 1, { en: v => ['ATR Points', 'Session ATR', 'Daily ATR %'].includes(v.sMode) }),
      Num('sHrs', 'Trading Hours', 6.5, 1, 24, 0.5, { en: v => v.sMode === 'Session ATR' }),
      Num('sMult', 'Daily ATR Multiplier', 0.25, 0.01, 10, 0.05, { en: v => v.sMode === 'Daily ATR %', tip: '0.25 = roj ni average range na ~4 bricks.' }),
      Num('sProt', 'Step Reversal Protection (Bricks)', 0, 0, 10, 1, { tip: '0 = turant color change. 1 = 2 opposite bricks joiye.' }),
      Sel('sCol', 'Step Line Color', ['Normal Step Line', 'Dynamic Candles Breakout/Breakdown'], 'Normal Step Line'),
      Col('sUp', 'Up Color', '#00bcd4'), Col('sDn', 'Down Color', '#e91e63') ] },
    { id: 'cand', group: 'Candle Colors', items: [
      Sel('cMode', 'Candle Colors', CM, 'Smart EMA', { tip: 'None = normal candles. Baki modes candle ne indicator mujab rang aape.' }),
      Col('cUp', 'Candle Up Color', '#00ff00'), Col('cDn', 'Candle Down Color', '#ff0000'), Col('cNe', 'Candle Neutral Color', '#9c27b0') ] },
    { id: 'st', group: 'Supertrend 1 & 2 (for candle colors)', items: [
      Num('st1Len', 'Supertrend 1 ATR Length', 10, 1, 200, 1, { en: isST }), Num('st1Mul', 'Supertrend 1 Multiplier', 1.5, 0.1, 20, 0.1, { en: isST }),
      Num('st2Len', 'Supertrend 2 ATR Length', 10, 1, 200, 1, { en: isST }), Num('st2Mul', 'Supertrend 2 Multiplier', 3, 0.1, 20, 0.1, { en: isST }) ] },
    { id: 'ht', group: 'HalfTrend (for candle colors)', items: [
      Sel('hSrc', 'HalfTrend Source', SRC, 'Real Price', { en: isHT }), Num('hLen', 'Source Length', 9, 1, 500, 1, { en: isHT }), Num('hAmp', 'Amplitude', 2, 1, 50, 1, { en: isHT }) ] },
    { id: 'ema', group: 'Smart EMA & Cloud', items: [
      B('eSmart', 'Show Smart EMA', true),
      Num('eSLen', 'Smart EMA Length (Base TF)', 5, 1, 500, 1),
      Sel('eBase', 'Smart EMA Base Timeframe', [[5, '5m'], [15, '15m'], [30, '30m'], [60, '1h']], 30, { n: 1 }),
      B('eShow', 'Show EMA', false),
      Sel('eType', 'MV Type', MV, 'EMA', { tip: '37 types: EMA, SMA, HMA, JMA, KAMA, T3, kernels vagere.' }),
      Num('eLen', 'Length', 10, 1, 500, 1),
      B('eCloud', 'Show Cloud (Smart EMA & EMA)', true),
      Col('eSCol', 'Smart EMA Color', '#2962ff'), Col('eCol', 'EMA Color', '#ff0000') ] },
    { id: 'zone', group: 'Institution Zone', items: [
      B('zShow', 'Show Institution Zone', true),
      Sel('zTf', 'Zone Timeframe', [['5m', '5m'], ['15m', '15m'], ['30m', '30m'], ['60m', '1h']], '5m'),
      Num('zTop', 'Fib Top', 0.56, 0, 1, 0.01), Num('zBot', 'Fib Bottom', 0.44, 0, 1, 0.01),
      Col('zCol', 'Zone Color', '#ff0000'), Num('zOp', 'Zone Opacity (0-1)', 0.7, 0, 1, 0.05, { tab: 's' }) ] },
    { id: 'dash', group: 'Dashboard', items: [B('dShow', 'Show Dashboard', true)] }
  ];
  const DEF = {}; SCHEMA.forEach(g => g.items.forEach(i => DEF[i.k] = i.d));
  const keysOf = id => SCHEMA.find(g => g.id === id).items.map(i => i.k);

  // ---------- Saved state (page reload par pan settings yaad rahe) ----------
  const CSET = [
    { k: 'zoomAnchor', t: 'select', l: 'Mouse wheel zoom anchor', o: [['right', 'Right edge (TradingView style)'], ['cursor', 'Mouse cursor']], d: 'right' },
    { k: 'rightOffset', t: 'num', l: 'Right margin (bars)', d: 10, min: 0, max: 200, step: 1 }
  ];
  const CDEF = {}; CSET.forEach(i => CDEF[i.k] = i.d);
  let S = { theme: 'dark', sym: 'Nifty 50', tf: '5m', has: true, vis: true, P: { ...DEF }, C: { ...CDEF } };
  try { const j = JSON.parse(localStorage.getItem('kisChart1')); if (j) S = { ...S, ...j, P: { ...DEF, ...(j.P || {}) }, C: { ...CDEF, ...(j.C || {}) } }; } catch (e) {}
  if (!SYMBOLS.some(x => x[0] === S.sym)) S.sym = 'Nifty 50';
  if (!KIS.maTypes.includes(S.P.eType)) S.P.eType = KIS.maTypes.find(x => x.toUpperCase() === String(S.P.eType).toUpperCase()) || 'EMA';
  const save = () => { try { localStorage.setItem('kisChart1', JSON.stringify(S)); } catch (e) {} };
  document.documentElement.dataset.theme = S.theme;

  // ---------- Chart ----------
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const themeOpts = () => ({
    layout: { background: { type: LightweightCharts.ColorType.Solid, color: css('--chart-bg') }, textColor: css('--text') },
    grid: { vertLines: { color: css('--grid') }, horzLines: { color: css('--grid') } },
    timeScale: { borderColor: css('--line') }, rightPriceScale: { borderColor: css('--line') },
    crosshair: { vertLine: { color: '#9598a1', labelBackgroundColor: css('--xh') }, horzLine: { color: '#9598a1', labelBackgroundColor: css('--xh') } }
  });
  const chart = LightweightCharts.createChart($('chart'), {
    ...themeOpts(), autoSize: true,
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: css('--line'), rightOffset: +S.C.rightOffset, barSpacing: 8, minBarSpacing: 0.3, fixLeftEdge: false, fixRightEdge: false, lockVisibleTimeRangeOnResize: true, rightBarStaysOnScroll: true },
    rightPriceScale: { borderColor: css('--line'), scaleMargins: { top: 0.1, bottom: 0.08 } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { width: 1, style: LightweightCharts.LineStyle.Dashed, color: '#9598a1', labelBackgroundColor: css('--xh') },
      horzLine: { width: 1, style: LightweightCharts.LineStyle.Dashed, color: '#9598a1', labelBackgroundColor: css('--xh') } },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
    handleScale: { mouseWheel: S.C.zoomAnchor === 'cursor', pinch: true, axisPressedMouseMove: { time: true, price: true }, axisDoubleClickReset: { time: true, price: true } },
    kineticScroll: { mouse: true, touch: true }
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
  const symName = () => S.sym;
  let ySym = ''; const usedSym = {};
  const cands = () => { const c = (SYMBOLS.find(x => x[0] === S.sym) || SYMBOLS[0])[1], u = usedSym[S.sym]; return u ? [u, ...c.filter(x => x !== u)] : c; };

  function buildInfo(mode, L) {
    const sfx = L.dir === 1 ? [' (Call)', ' (Target)', ' (SL)'] : L.dir === -1 ? [' (Put)', ' (SL)', ' (Target)'] : ['', '', ''];
    return `Box: ${mode}` + (L.master != null ? ` | Master ATR (D): ${fmt(L.master)}` : '') +
      `<br>Brick: ${fmt(L.step)}${L.step && L.level ? ' (' + (L.step / L.level * 100).toFixed(2) + '%)' : ''}` +
      `<br>Level: ${fmt(L.level)}${sfx[0]}<br>Next Up: ${fmt(L.up)}${sfx[1]}<br>Next Down: ${fmt(L.down)}${sfx[2]}`;
  }
  function applyAll() {
    const P = S.P, on = S.has && S.vis, ts = chart.timeScale(), rng = ts.getVisibleLogicalRange();
    const calcKeys = Object.keys(DEF).filter(k => k[0] !== 'z' && k !== 'dShow');
    const ch = upd('calc', ver + '|' + on + '|' + calcKeys.map(k => P[k]).join('|'), () => {
      const R = on && bars.length ? KIS.compute(bars, daily, P, TFMIN[curIv] || 1) : null, cl = R && R.colors;
      candle.setData(cl ? bars.map((b, i) => ({ ...b, color: cl[i], borderColor: cl[i], wickColor: cl[i] })) : bars);
      stepSeries.setData(R && P.sShow && R.step ? R.step.points : []);
      smartSeries.setData(R && P.eSmart && R.ema ? R.ema.sPts : []);
      emaSeries.setData(R && P.eShow && R.ema ? R.ema.ePts : []);
      cloudData = R && P.eCloud && R.ema ? R.ema.cloud : [];
      infoHtml = R && P.sShow && R.step ? buildInfo(P.sMode, R.step.last) : '';
    });
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
  async function fetchBars(iv, range) { // Yahoo symbol na chale to bijo symbol try kare
    let err; for (const c of cands()) { try { const d = await get(c, iv, range); if (d.length) { ySym = c; usedSym[S.sym] = c; return d; } } catch (e) { err = e; } }
    throw err || new Error('No data');
  }
  async function ensureZone() {
    const P = S.P;
    if (!(S.has && P.zShow) || curIv === '1d') { if (zbars.length) { zbars = []; zv++; } zKey = ''; return; }
    const key = ySym + '|' + curIv + '|' + P.zTf; if (key === zKey) return; zKey = key;
    if (P.zTf === curIv) zbars = bars;
    else { try { zbars = await get(ySym, P.zTf, RANGE[P.zTf]); } catch (e) { zbars = []; setStatus('Zone data: ' + e.message); } }
    zv++;
  }
  async function load(fit) {
    const tf = TFS.find(t => t[1] === S.tf) || TFS[1], t0 = performance.now();
    const rng = chart.timeScale().getVisibleLogicalRange(); setStatus('Loading...');
    try {
      const d = await fetchBars(tf[1], tf[2]), dd = tf[1] === '1d' ? null : await get(ySym, '1d', '2y');
      curIv = tf[1]; bars = d; daily = dd || d; zKey = ''; ver++;
      await ensureZone(); applyAll();
      if (fit || !rng) chart.timeScale().resetTimeScale(); else chart.timeScale().setVisibleLogicalRange(rng);
      setStatus(`${symName()}${ySym !== cands()[0] || cands().length > 1 && ySym !== SYMBOLS.find(x => x[0] === S.sym)[1][0] ? ' (' + ySym + ')' : ''} · ${tf[0]} · ${bars.length} candles · ${(performance.now() - t0).toFixed(0)} ms`);
    } catch (e) { setStatus('Error: ' + e.message); }
  }

  // ---------- Popups ----------
  function modal(title, build, onDismiss) {
    const ov = h('div', { class: 'ov' }), md = h('div', { class: 'md' });
    const finish = () => { ov.remove(); document.removeEventListener('keydown', esc); };
    const dismiss = () => { finish(); if (onDismiss) onDismiss(); };
    const esc = e => { if (e.key === 'Escape') dismiss(); };
    ov.onmousedown = e => { if (e.target === ov) dismiss(); };
    document.addEventListener('keydown', esc);
    md.append(h('div', { class: 'md-h' }, h('span', {}, title), h('button', { onclick: dismiss, title: 'Close' }, ico('x'))));
    build(md, finish, dismiss); ov.append(md); document.body.append(ov);
  }
  function control(it, draft, onChange) {
    let el, inp;
    if (it.t === 'bool') { inp = h('input', { type: 'checkbox' }); inp.checked = !!draft[it.k]; inp.onchange = () => { draft[it.k] = inp.checked; onChange(); }; el = h('label', { class: 'sw' }, inp, h('span')); }
    else if (it.t === 'select') { inp = el = h('select', { class: 'sel' }); it.o.forEach(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; inp.append(h('option', { value: v }, l)); });
      inp.value = String(draft[it.k]); inp.onchange = () => { draft[it.k] = it.n ? +inp.value : inp.value; onChange(); }; }
    else if (it.t === 'num') {
      inp = h('input', { type: 'number', min: it.min, max: it.max, step: it.step, inputmode: 'decimal' }); inp.value = draft[it.k];
      const st = it.step || 1, set = v => { v = Math.min(it.max ?? Infinity, Math.max(it.min ?? -Infinity, v)); inp.value = +v.toFixed(4); draft[it.k] = +inp.value; onChange(); };
      inp.oninput = () => { const v = parseFloat(inp.value); if (!isNaN(v)) { draft[it.k] = v; onChange(); } };
      el = h('div', { class: 'stp' }, h('button', { type: 'button', onclick: () => set((+inp.value || 0) - st) }, '−'), inp, h('button', { type: 'button', onclick: () => set((+inp.value || 0) + st) }, '+'));
    } else { inp = h('input', { type: 'color' }); inp.value = draft[it.k]; const tx = h('span', {}, draft[it.k]);
      inp.oninput = () => { draft[it.k] = inp.value; tx.textContent = inp.value; onChange(); }; el = h('label', { class: 'clr' }, tx, inp); }
    el.inp = inp; return el;
  }
  function openSettings() {
    const orig = { ...S.P }; let tab = 'i', q = '', timer;
    const live = () => { clearTimeout(timer); timer = setTimeout(async () => { await ensureZone(); applyAll(); }, 140); };
    const revert = () => { S.P = orig; save(); ensureZone().then(applyAll); };
    modal('Keep It Simple v2.0', (md, finish, dismiss) => {
      const body = h('div', { class: 'md-b' }), rows = [], open = {};
      const tI = h('button', {}, 'Inputs'), tS = h('button', {}, 'Style');
      const search = h('input', { class: 'sel srch', type: 'search', placeholder: 'Search settings…' });
      const refreshEn = () => rows.forEach(r => { const d = r.it.en && !r.it.en(S.P); r.row.classList.toggle('dis', !!d); r.c.inp.disabled = !!d; });
      const render = () => {
        tI.className = tab === 'i' ? 'on' : ''; tS.className = tab === 's' ? 'on' : ''; body.innerHTML = ''; rows.length = 0;
        SCHEMA.forEach(g => {
          const items = g.items.filter(i => i.tab === tab && (!q || (i.l + ' ' + g.group).toLowerCase().includes(q)));
          if (!items.length) return;
          const closed = !q && open[g.id] === false;
          body.append(h('div', { class: 'grp' + (closed ? ' c' : ''), onclick: () => { open[g.id] = closed; render(); } }, h('span', {}, g.group), h('i', {}, '▾')));
          if (!closed) items.forEach(it => {
            const c = control(it, S.P, () => { refreshEn(); save(); live(); });
            const row = h('div', { class: 'row' }, h('div', { class: 'lb' }, h('span', {}, it.l), it.tip ? h('small', {}, it.tip) : ''), c);
            rows.push({ it, c, row }); body.append(row);
          });
        });
        refreshEn();
      };
      search.oninput = () => { q = search.value.trim().toLowerCase(); render(); };
      tI.onclick = () => { tab = 'i'; render(); }; tS.onclick = () => { tab = 's'; render(); };
      md.append(h('div', { class: 'srchw' }, search), h('div', { class: 'tabs' }, tI, tS), body,
        h('div', { class: 'md-f' }, h('button', { class: 'btn', onclick: () => { Object.assign(S.P, DEF); save(); render(); live(); } }, 'Defaults'), h('div', { class: 'sp' }),
          h('button', { class: 'btn', onclick: dismiss }, 'Cancel'), h('button', { class: 'btn pri', onclick: () => { save(); finish(); } }, 'Ok')));
      render();
    }, revert);
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

  // ---------- TradingView-like chart behaviour ----------
  function applyChartOpts() {
    chart.applyOptions({ handleScale: { mouseWheel: S.C.zoomAnchor === 'cursor' } });
    chart.timeScale().applyOptions({ rightOffset: +S.C.rightOffset });
  }
  // Wheel zoom: right edge fixed (TradingView style) - bar spacing badlay, right edge ni jagya same rahe
  $('chart').addEventListener('wheel', e => {
    if (S.C.zoomAnchor !== 'right' || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const ts = chart.timeScale(), rect = $('chart').getBoundingClientRect();
    if (e.clientX - rect.left > rect.width - chart.priceScale('right').width()) return;
    const r = ts.getVisibleLogicalRange(); if (!r) return;
    e.preventDefault(); e.stopPropagation();
    const cur = ts.width() / Math.max(1e-6, r.to - r.from);
    ts.applyOptions({ barSpacing: Math.min(80, Math.max(0.3, cur * Math.exp(-e.deltaY * 0.0015))) });
  }, { passive: false, capture: true });
  // "Go to latest" button + % / log / auto buttons (TradingView jeva)
  chart.timeScale().subscribeVisibleLogicalRangeChange(r => { $('goLatest').style.display = r && bars.length && r.to < bars.length - 1 ? 'flex' : 'none'; });
  $('goLatest').onclick = () => chart.timeScale().scrollToRealTime();
  let pMode = 0;
  const markScale = () => { $('bPct').classList.toggle('on', pMode === 2); $('bLog').classList.toggle('on', pMode === 1); };
  const setMode = m => { pMode = pMode === m ? 0 : m; chart.priceScale('right').applyOptions({ mode: pMode }); markScale(); };
  $('bPct').onclick = () => setMode(2); $('bLog').onclick = () => setMode(1);
  $('bAuto').onclick = () => chart.priceScale('right').applyOptions({ autoScale: true });
  document.addEventListener('keydown', e => {
    if (document.querySelector('.ov') || (e.target.closest && e.target.closest('input,select,textarea'))) return;
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); pMode = 0; markScale(); chart.priceScale('right').applyOptions({ autoScale: true, mode: 0 }); chart.timeScale().resetTimeScale(); }
    else if (e.key === 'End') chart.timeScale().scrollToRealTime();
  });
  function openChartSettings() {
    modal('Chart settings', (md, close) => {
      const draft = { ...S.C }, body = h('div', { class: 'md-b' });
      body.append(h('div', { class: 'grp' }, 'Scales'));
      CSET.forEach(it => body.append(h('label', { class: 'row' }, h('span', {}, it.l), control(it, draft, () => {}))));
      md.append(body, h('div', { class: 'md-f' }, h('button', { class: 'btn', onclick: () => { Object.assign(draft, CDEF); S.C = draft; save(); applyChartOpts(); close(); } }, 'Defaults'), h('div', { class: 'sp' }),
        h('button', { class: 'btn', onclick: close }, 'Cancel'),
        h('button', { class: 'btn pri', onclick: () => { S.C = draft; save(); applyChartOpts(); close(); } }, 'Ok')));
    });
  }
  $('cset').append(ico('gear')); $('cset').onclick = openChartSettings;

  // ---------- Toolbar wiring ----------
  SYMBOLS.forEach(x => $('sym').append(h('option', { value: x[0] }, x[0]))); $('sym').value = S.sym;
  $('sym').onchange = () => { S.sym = $('sym').value; save(); load(true); };
  TFS.forEach(t => $('tfs').append(h('button', { 'data-tf': t[1], onclick: () => { S.tf = t[1]; save(); markTf(); load(true); } }, t[0])));
  const markTf = () => document.querySelectorAll('#tfs button').forEach(b => b.classList.toggle('on', b.dataset.tf === S.tf));
  const themeIco = () => { $('theme').innerHTML = ''; $('theme').append(ico(S.theme === 'dark' ? 'sun' : 'moon')); };
  $('theme').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; chart.applyOptions(themeOpts()); themeIco(); save(); };
  $('refresh').append(ico('refresh')); $('refresh').onclick = () => load(false);
  $('icoAct').append(ico('act')); $('indBtn').onclick = openIndicators;
  markTf(); themeIco(); renderLegend(); load(true);
})();
