(function () {
  const $ = id => document.getElementById(id);
  const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const k in a) { if (a[k] === undefined) continue; if (k === 'class') e.className = a[k]; else if (k.startsWith('on')) e[k] = a[k]; else e.setAttribute(k, a[k]); } c.flat().forEach(x => e.append(x)); return e; };

  // ---------- Config ----------
  const SYMBOLS = [['Nifty 50', ['^NSEI']], ['Sensex', ['^BSESN']], ['Bank Nifty', ['^NSEBANK']], ['XAUUSD', ['XAUUSD=X', 'GC=F']], ['BTCUSD', ['BTC-USD']]]; // naam, Yahoo symbols (pehla na chale to bijo try thay)
  const TFS = [['1m', '1m', '7d'], ['5m', '5m', '30d'], ['15m', '15m', '60d'], ['1h', '60m', '730d'], ['1D', '1d', '5y']];
  const TFMIN = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '60m': 60, '1d': 1440 };
  const RANGE = { '1m': '7d', '5m': '60d', '15m': '60d', '30m': '60d', '60m': '730d' };
  const ICON = {
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><path d="M3 3l18 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    act: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    trend: '<circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M6.5 17.5l11-11"/>', hray: '<circle cx="5" cy="12" r="2"/><path d="M7 12h14M18 9l3 3-3 3"/>',
    fib: '<path d="M3 4h18M3 9h18M3 14h18M3 20h18"/>', channel: '<path d="M3 15L17 5M7 21L21 11"/>', rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    cursor: '<path d="M5 3l14 7-6 2-2 6z"/>', long: '<path d="M12 19V5M5 12l7-7 7 7"/>', short: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
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
  let S = { theme: 'dark', sym: 'Nifty 50', tf: '5m', fav: ['1m', '5m', '15m', '60m', '1D'], custom: [], draw: {}, has: true, vis: true, P: { ...DEF }, C: { ...CDEF } };
  try { const j = JSON.parse(localStorage.getItem('kisChart1')); if (j) S = { ...S, ...j, P: { ...DEF, ...(j.P || {}) }, C: { ...CDEF, ...(j.C || {}) } }; } catch (e) {}
  if (!SYMBOLS.some(x => x[0] === S.sym)) S.sym = 'Nifty 50';
  { const t = parseTF(S.tf); S.tf = t ? t.id : '5m'; if (!Array.isArray(S.fav)) S.fav = ['1m', '5m', '15m', '60m', '1D']; if (!Array.isArray(S.custom)) S.custom = []; if (!S.draw) S.draw = {}; }
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

  class Layer { constructor(fn, z = 'bottom') { this.fn = fn; this.v = { zOrder: () => z, renderer: () => ({ draw: t => this.fn(t) }) }; }
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
  let bars = [], daily = [], zbars = [], zKey = '', ver = 0, zv = 0, curTf = { kind: 'min', n: 5, minutes: 5, iv: '5m' }, rawBars = [], infoHtml = '';
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
      const R = on && bars.length ? KIS.compute(bars, daily, P, curTf.minutes) : null, cl = R && R.colors;
      candle.setData(cl ? bars.map((b, i) => ({ ...b, color: cl[i], borderColor: cl[i], wickColor: cl[i] })) : bars);
      stepSeries.setData(R && P.sShow && R.step ? R.step.points : []);
      smartSeries.setData(R && P.eSmart && R.ema ? R.ema.sPts : []);
      emaSeries.setData(R && P.eShow && R.ema ? R.ema.ePts : []);
      cloudData = R && P.eCloud && R.ema ? R.ema.cloud : [];
      infoHtml = R && P.sShow && R.step ? buildInfo(P.sMode, R.step.last) : '';
    });
    upd('zone', ver + '|' + zv + '|' + on + '|' + [P.zShow, P.zTop, P.zBot].join('|'), () => {
      zoneRects = on && P.zShow && curTf.kind === 'min' && zbars.length && bars.length ? KIS.institutionZones(zbars, bars, { top: +P.zTop, bottom: +P.zBot }) : [];
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
    if (!(S.has && P.zShow) || curTf.kind !== 'min') { if (zbars.length) { zbars = []; zv++; } zKey = ''; return; }
    const key = ySym + '|' + curTf.id + '|' + P.zTf; if (key === zKey) return; zKey = key;
    if (curTf.iv === P.zTf) zbars = rawBars;
    else { try { zbars = await get(ySym, P.zTf, RANGE[P.zTf]); } catch (e) { zbars = []; setStatus('Zone data: ' + e.message); } }
    zv++;
  }
  // ----- Timeframes: preset + user defined (7m, 2h, 3D, 2W, 3M ...) -----
  const PRESETS = [['Minutes', ['1m', '2m', '3m', '5m', '10m', '15m', '30m', '45m']], ['Hours', ['60m', '120m', '180m', '240m']], ['Days', ['1D', '2D', '3D']], ['Weeks', ['1W']], ['Months', ['1M', '3M']]];
  function parseTF(v) {
    const m = String(v).trim().match(/^(\d+)\s*([a-zA-Z]*)$/); if (!m) return null;
    const n = +m[1], u = m[2]; if (!n) return null;
    if (u === '' || u === 'm' || u === 'min') return n <= 1440 ? { id: n + 'm', kind: 'min', n, minutes: n } : null;
    if (u === 'h' || u === 'H') return n <= 24 ? { id: n * 60 + 'm', kind: 'min', n: n * 60, minutes: n * 60 } : null;
    if (u === 'd' || u === 'D') return n <= 30 ? { id: n + 'D', kind: 'D', n, minutes: 1440 * n } : null;
    if (u === 'w' || u === 'W') return n <= 12 ? { id: n + 'W', kind: 'W', n, minutes: 10080 * n } : null;
    if (u === 'M') return n <= 12 ? { id: n + 'M', kind: 'M', n, minutes: 43200 * n } : null;
    return null;
  }
  const tfLabel = t => t.kind === 'min' ? (t.minutes % 60 === 0 ? t.minutes / 60 + 'h' : t.minutes + 'm') : t.id;
  const tfName = t => { const x = t.kind === 'min' && t.minutes % 60 === 0 ? [t.minutes / 60, 'hour'] : t.kind === 'min' ? [t.minutes, 'minute'] : [t.n, { D: 'day', W: 'week', M: 'month' }[t.kind]]; return x[0] + ' ' + x[1] + (x[0] > 1 ? 's' : ''); };
  function tfInfo(t) { // Yahoo na kayu interval thi data lai ne ketla ma resample karvu
    if (t.kind === 'min') { const b = [60, 30, 15, 5, 1].find(x => t.minutes % x === 0), iv = b === 60 ? '60m' : b + 'm'; return { ...t, iv, range: RANGE[iv], resample: t.minutes !== b }; }
    return { ...t, iv: t.kind === 'D' ? '1d' : t.kind === 'W' ? '1wk' : '1mo', range: t.kind === 'M' ? 'max' : '10y', resample: t.n > 1 };
  }
  function resampleMin(b, m) { // har din ni session start thi bucket
    const out = []; let day = null, start = 0, cur = null;
    for (const x of b) {
      const d = Math.floor(x.time / 86400); if (d !== day) { day = d; start = x.time; cur = null; }
      const t = start + Math.floor((x.time - start) / (m * 60)) * m * 60;
      if (cur && cur.time === t) { cur.high = Math.max(cur.high, x.high); cur.low = Math.min(cur.low, x.low); cur.close = x.close; cur.volume = (cur.volume || 0) + (x.volume || 0); }
      else { cur = { ...x, time: t }; out.push(cur); }
    }
    return out;
  }
  function groupN(b, n) { const o = []; for (let i = 0; i < b.length; i += n) { const g = b.slice(i, i + n); o.push({ time: g[0].time, open: g[0].open, high: Math.max(...g.map(x => x.high)), low: Math.min(...g.map(x => x.low)), close: g[g.length - 1].close, volume: g.reduce((a, x) => a + (x.volume || 0), 0) }); } return o; }
  async function load(fit) {
    const tf = tfInfo(parseTF(S.tf) || parseTF('5m')), t0 = performance.now();
    const rng = chart.timeScale().getVisibleLogicalRange(); setStatus('Loading...');
    try {
      const raw = await fetchBars(tf.iv, tf.range);
      const d = tf.kind === 'min' ? (tf.resample ? resampleMin(raw, tf.minutes) : raw) : (tf.resample ? groupN(raw, tf.n) : raw);
      const dd = tf.kind === 'D' && tf.n === 1 ? d : await get(ySym, '1d', tf.kind === 'min' ? '2y' : '10y');
      curTf = tf; rawBars = raw; bars = d; daily = dd; zKey = ''; ver++; sel = null;
      await ensureZone(); applyAll();
      if (fit || !rng) chart.timeScale().resetTimeScale(); else chart.timeScale().setVisibleLogicalRange(rng);
      setStatus(`${symName()}${ySym !== cands()[0] || cands().length > 1 && ySym !== SYMBOLS.find(x => x[0] === S.sym)[1][0] ? ' (' + ySym + ')' : ''} · ${tfLabel(tf)} · ${bars.length} candles · ${(performance.now() - t0).toFixed(0)} ms`);
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

  // ---------- Drawing tools: trend line, horizontal ray, parallel channel, fib, rectangle, long/short ----------
  const el = $('chart'), BLUE = '#2962ff';
  let tool = '', sel = null, drag = null, cre = null, meas = null;
  const NEED = { measure: 2, trend: 2, fib: 2, rect: 2, channel: 3, hray: 1, long: 1, short: 1 };
  const dlist = () => (S.draw[S.sym] = S.draw[S.sym] || []);
  const paneW = () => el.clientWidth - chart.priceScale('right').width(), paneH = () => el.clientHeight - chart.timeScale().height();
  const stepSec = () => { if (bars.length < 3) return 300; const d = []; for (let i = Math.max(1, bars.length - 40); i < bars.length; i++) d.push(bars[i].time - bars[i - 1].time); d.sort((a, b) => a - b); return d[d.length >> 1] || 300; };
  function idxOf(t) { const n = bars.length; if (!n) return 0; if (t >= bars[n - 1].time) return n - 1 + (t - bars[n - 1].time) / stepSec(); if (t <= bars[0].time) return (t - bars[0].time) / stepSec();
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (bars[m].time <= t) lo = m; else hi = m; } return lo + (t - bars[lo].time) / (bars[hi].time - bars[lo].time); }
  function timeOf(i) { const n = bars.length; if (!n) return 0; if (i >= n - 1) return bars[n - 1].time + (i - (n - 1)) * stepSec(); if (i <= 0) return bars[0].time + i * stepSec(); const lo = Math.floor(i); return bars[lo].time + (i - lo) * (bars[lo + 1].time - bars[lo].time); }
  const X = t => chart.timeScale().logicalToCoordinate(idxOf(t)), Y = p => candle.priceToCoordinate(p);
  const P2 = q => { const x = X(q.t), y = Y(q.p); return x == null || y == null ? null : { x, y }; };
  const dpt = p => { const i = chart.timeScale().coordinateToLogical(p.x), pr = candle.coordinateToPrice(p.y); return i == null || pr == null ? null : { idx: i, p: pr, t: timeOf(i) }; };
  const fmtP = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDur = s => { const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return [d && d + 'd', h && h + 'h', m && m + 'm'].filter(Boolean).join(' ') || '0m'; };
  const pc = (a, b) => (a >= b ? '+' : '') + ((a - b) / b * 100).toFixed(2) + '%';
  const segDist = (x, y, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy; let t = l ? ((x - a.x) * dx + (y - a.y) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a.x - t * dx, y - a.y - t * dy); };
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i].y > y) !== (P[j].y > y) && x < (P[j].x - P[i].x) * (y - P[i].y) / (P[j].y - P[i].y) + P[i].x) c = !c; return c; };
  const lineAt = (d, idx) => { const ia = idxOf(d.pts[0].t), ib = idxOf(d.pts[1].t); return ib === ia ? d.pts[0].p : d.pts[0].p + (d.pts[1].p - d.pts[0].p) * (idx - ia) / (ib - ia); };
  const FIB = [[0, '#787b86'], [0.236, '#f23645'], [0.382, '#ff9800'], [0.5, '#4caf50'], [0.618, '#089981'], [0.786, '#00bcd4'], [1, '#787b86'], [1.618, '#2962ff'], [2.618, '#f23645'], [3.618, '#9c27b0'], [4.236, '#e91e63']];
  const two = (d, f) => { const a = P2(d.pts[0]), b = P2(d.pts[1]); return a && b ? f(a, b) : null; };
  const LS = {
    scr: d => { const x0 = X(d.t0), x1 = X(d.t1), yE = Y(d.entry), yS = Y(d.stop), yT = Y(d.target); return [x0, x1, yE, yS, yT].some(v => v == null) ? null : { xL: Math.min(x0, x1), xR: Math.max(x0, x1), yE, yS, yT }; },
    draw: (u, g, d) => { const { c, hr } = u, w = g.xR - g.xL, risk = Math.abs(d.entry - d.stop), rew = Math.abs(d.target - d.entry), cx = (g.xL + g.xR) / 2;
      u.R(g.xL, Math.min(g.yE, g.yT), w, Math.abs(g.yT - g.yE), 'rgba(38,166,154,.22)'); u.R(g.xL, Math.min(g.yE, g.yS), w, Math.abs(g.yS - g.yE), 'rgba(239,83,80,.22)');
      c.lineWidth = hr; c.strokeStyle = '#26a69a'; u.L(g.xL, g.yT, g.xR, g.yT); c.strokeStyle = '#ef5350'; u.L(g.xL, g.yS, g.xR, g.yS); c.strokeStyle = '#8a93a6'; u.L(g.xL, g.yE, g.xR, g.yE);
      c.save(); c.beginPath(); c.rect(g.xL * hr, 0, w * hr, 1e5); c.clip(); c.fillStyle = u.txt;
      u.T(`Target ${fmtP(d.target)} (${pc(d.target, d.entry)}) · ${fmtP(rew)} pts`, cx, g.yT < g.yE ? g.yT + 14 : g.yT - 14, 'center');
      u.T(`Stop ${fmtP(d.stop)} (${pc(d.stop, d.entry)}) · ${fmtP(risk)} pts`, cx, g.yS > g.yE ? g.yS - 14 : g.yS + 14, 'center');
      const lab = `${d.type === 'long' ? 'Long' : 'Short'} · R:R ${(rew / (risk || 1)).toFixed(2)}`, tw = c.measureText(lab).width / hr + 16;
      u.R(cx - tw / 2, g.yE - 9, tw, 18, BLUE); c.fillStyle = '#fff'; u.T(lab, cx, g.yE, 'center'); c.restore(); },
    handles: g => { const cx = (Math.max(g.xL, 0) + Math.min(g.xR, paneW())) / 2; return [{ k: 'target', x: cx, y: g.yT }, { k: 'stop', x: cx, y: g.yS }, { k: 'width', x: Math.min(g.xR, paneW() - 10), y: g.yE }]; },
    hit: (g, x, y) => x >= g.xL && x <= g.xR && y >= Math.min(g.yT, g.yS, g.yE) && y <= Math.max(g.yT, g.yS, g.yE),
    edit: (d, o, k, q) => { const long = d.type === 'long', eps = Math.abs(o.entry) * 1e-5;
      if (k === 'target') d.target = long ? Math.max(q.p, d.entry + eps) : Math.min(q.p, d.entry - eps);
      else if (k === 'stop') d.stop = long ? Math.min(q.p, d.entry - eps) : Math.max(q.p, d.entry + eps);
      else if (k === 'width') d.t1 = timeOf(Math.max(q.idx, idxOf(d.t0) + 1)); }
  };
  const SH = {
    trend: { scr: d => two(d, (a, b) => ({ a, b })), draw: (u, g) => { u.c.strokeStyle = BLUE; u.L(g.a.x, g.a.y, g.b.x, g.b.y); },
      handles: g => [{ k: 0, ...g.a }, { k: 1, ...g.b }], hit: (g, x, y) => segDist(x, y, g.a, g.b) <= 8, edit: (d, o, k, q) => { d.pts[k] = { t: q.t, p: q.p }; } },
    hray: { scr: d => { const a = P2(d.pts[0]); return a ? { a } : null; }, draw: (u, g) => { u.c.strokeStyle = BLUE; u.L(g.a.x, g.a.y, u.W, g.a.y); },
      handles: g => [{ k: 0, ...g.a }], hit: (g, x, y) => Math.abs(y - g.a.y) <= 8 && x >= g.a.x - 8, edit: (d, o, k, q) => { d.pts[0] = { t: q.t, p: q.p }; } },
    rect: { scr: d => two(d, (a, b) => ({ a, b })), draw: (u, g) => { const x = Math.min(g.a.x, g.b.x), y = Math.min(g.a.y, g.b.y), w = Math.abs(g.b.x - g.a.x), h = Math.abs(g.b.y - g.a.y);
        u.R(x, y, w, h, 'rgba(41,98,255,.2)'); u.c.strokeStyle = BLUE; u.c.strokeRect(x * u.hr, y * u.vr, w * u.hr, h * u.vr); },
      handles: g => [{ k: 0, x: g.a.x, y: g.a.y }, { k: 1, x: g.b.x, y: g.a.y }, { k: 2, x: g.b.x, y: g.b.y }, { k: 3, x: g.a.x, y: g.b.y }],
      hit: (g, x, y) => x >= Math.min(g.a.x, g.b.x) - 4 && x <= Math.max(g.a.x, g.b.x) + 4 && y >= Math.min(g.a.y, g.b.y) - 4 && y <= Math.max(g.a.y, g.b.y) + 4,
      edit: (d, o, k, q) => { const p = d.pts; if (k === 0 || k === 3) p[0] = { ...p[0], t: q.t }; if (k === 1 || k === 2) p[1] = { ...p[1], t: q.t }; if (k === 0 || k === 1) p[0] = { ...p[0], p: q.p }; if (k === 2 || k === 3) p[1] = { ...p[1], p: q.p }; } },
    fib: { scr: d => two(d, (a, b) => { const p0 = d.pts[0].p, p1 = d.pts[1].p, lv = FIB.map(([l, col]) => { const pr = p1 + (p0 - p1) * l; return { l, col, pr, y: Y(pr) }; }); return lv.some(v => v.y == null) ? null : { a, b, lv }; }),
      draw: (u, g) => { const { c } = u, x0 = Math.min(g.a.x, g.b.x), x1 = Math.max(g.a.x, g.b.x);
        for (let i = 1; i < g.lv.length; i++) { const p = g.lv[i - 1], q = g.lv[i]; u.R(x0, Math.min(p.y, q.y), x1 - x0, Math.abs(q.y - p.y), rgba(q.col, 0.1)); }
        g.lv.forEach(l => { c.strokeStyle = l.col; c.lineWidth = 1.5 * u.hr; u.L(x0, l.y, x1, l.y); c.fillStyle = l.col; u.T(`${l.l} (${fmtP(l.pr)})`, x0 + 4, l.y - 8); });
        c.setLineDash([4 * u.hr, 4 * u.hr]); c.strokeStyle = '#787b86'; c.lineWidth = u.hr; u.L(g.a.x, g.a.y, g.b.x, g.b.y); },
      handles: g => [{ k: 0, ...g.a }, { k: 1, ...g.b }],
      hit: (g, x, y) => { const ys = g.lv.map(v => v.y); return x >= Math.min(g.a.x, g.b.x) && x <= Math.max(g.a.x, g.b.x) && y >= Math.min(...ys) - 4 && y <= Math.max(...ys) + 4; },
      edit: (d, o, k, q) => { d.pts[k] = { t: q.t, p: q.p }; } },
    channel: { scr: d => two(d, (a, b) => ({ a, b, a2: { x: a.x, y: Y(d.pts[0].p + d.off) }, b2: { x: b.x, y: Y(d.pts[1].p + d.off) } })),
      draw: (u, g) => { const { c, hr, vr } = u; c.fillStyle = 'rgba(41,98,255,.1)'; c.beginPath(); c.moveTo(g.a.x * hr, g.a.y * vr); c.lineTo(g.b.x * hr, g.b.y * vr); c.lineTo(g.b2.x * hr, g.b2.y * vr); c.lineTo(g.a2.x * hr, g.a2.y * vr); c.closePath(); c.fill();
        c.strokeStyle = BLUE; u.L(g.a.x, g.a.y, g.b.x, g.b.y); u.L(g.a2.x, g.a2.y, g.b2.x, g.b2.y); c.setLineDash([5 * hr, 5 * hr]); c.lineWidth = hr; u.L((g.a.x + g.a2.x) / 2, (g.a.y + g.a2.y) / 2, (g.b.x + g.b2.x) / 2, (g.b.y + g.b2.y) / 2); },
      handles: g => [{ k: 0, ...g.a }, { k: 1, ...g.b }, { k: 2, x: (g.a2.x + g.b2.x) / 2, y: (g.a2.y + g.b2.y) / 2 }],
      hit: (g, x, y) => inPoly(x, y, [g.a, g.b, g.b2, g.a2]) || segDist(x, y, g.a, g.b) <= 8 || segDist(x, y, g.a2, g.b2) <= 8,
      edit: (d, o, k, q) => { if (k === 2) d.off = q.p - lineAt(d, q.idx); else d.pts[k] = { t: q.t, p: q.p }; } },
    measure: { scr: d => two(d, (a, b) => ({ a, b, i0: idxOf(d.pts[0].t), i1: idxOf(d.pts[1].t) })),
      draw: (u, g, d) => { const { c, hr } = u, p0 = d.pts[0].p, p1 = d.pts[1].p, up = p1 >= p0, col = up ? '#2962ff' : '#ef5350';
        const x = Math.min(g.a.x, g.b.x), y = Math.min(g.a.y, g.b.y), w = Math.abs(g.b.x - g.a.x), h = Math.abs(g.b.y - g.a.y), mx = (g.a.x + g.b.x) / 2, my = (g.a.y + g.b.y) / 2;
        const dx = g.b.x >= g.a.x ? 1 : -1, dy = g.b.y >= g.a.y ? 1 : -1;
        u.R(x, y, w, h, up ? 'rgba(41,98,255,.15)' : 'rgba(239,83,80,.15)'); c.strokeStyle = col; c.lineWidth = hr;
        u.L(mx, g.a.y, mx, g.b.y); u.L(g.a.x, my, g.b.x, my);
        u.L(mx, g.b.y, mx - 5, g.b.y - dy * 7); u.L(mx, g.b.y, mx + 5, g.b.y - dy * 7); u.L(g.b.x, my, g.b.x - dx * 7, my - 5); u.L(g.b.x, my, g.b.x - dx * 7, my + 5);
        const l1 = `${p1 - p0 >= 0 ? '+' : ''}${fmtP(p1 - p0)} (${pc(p1, p0)})`, l2 = `${Math.round(Math.abs(g.i1 - g.i0))} bars, ${fmtDur(Math.abs(d.pts[1].t - d.pts[0].t))}`;
        const tw = Math.max(c.measureText(l1).width, c.measureText(l2).width) / hr + 18, cx = Math.max(tw / 2 + 4, Math.min(mx, u.W - tw / 2 - 4)), ly = up ? y - 46 : y + h + 8;
        u.R(cx - tw / 2, ly, tw, 38, col); c.fillStyle = '#fff'; u.T(l1, cx, ly + 11, 'center'); u.T(l2, cx, ly + 27, 'center'); },
      handles: () => [], hit: () => false, edit: () => {} },
    long: LS, short: LS
  };
  function preview() {
    if (!cre) return null; const c = cre, cur = c.cur, pts = [...c.pts, cur].map(q => ({ t: q.t, p: q.p }));
    if (c.type === 'channel') { if (c.pts.length < 2) return { type: 'trend', pts: pts.slice(0, 2) }; const d = { type: 'channel', pts: pts.slice(0, 2), off: 0 }; d.off = cur.p - lineAt(d, cur.idx); return d; }
    return { type: c.type, pts: pts.slice(0, 2) };
  }
  const drawLayer = new Layer(t => t.useBitmapCoordinateSpace(({ context: c, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
    const W = paneW(), H = paneH();
    const u = { c, hr, vr, W, H, txt: css('--text'),
      L: (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0 * hr, y0 * vr); c.lineTo(x1 * hr, y1 * vr); c.stroke(); },
      R: (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x * hr, y * vr, w * hr, h * vr); },
      T: (s, x, y, al) => { c.textAlign = al || 'left'; c.fillText(s, x * hr, y * vr); } };
    c.save(); c.beginPath(); c.rect(0, 0, W * hr, H * vr); c.clip(); c.font = `${12 * hr}px system-ui,sans-serif`; c.textBaseline = 'middle';
    let selH = null; const all = [...dlist()], pv = preview(); if (meas) all.push(meas); if (pv) all.push(pv);
    for (const d of all) { const sh = SH[d.type], g = sh && sh.scr(d); if (!g) continue; c.save(); c.lineWidth = 2 * hr; sh.draw(u, g, d); c.restore(); if (d.id && d.id === sel) selH = sh.handles(g, d); }
    if (selH) selH.forEach(h => { c.beginPath(); c.arc(h.x * hr, h.y * vr, 5 * hr, 0, 7); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = BLUE; c.lineWidth = 2 * hr; c.stroke(); });
    c.restore();
    const dt = $('dtool'); if (selH && selH.length) { const mx = Math.max(...selH.map(h => h.x)), mn = Math.min(...selH.map(h => h.y)); dt.style.display = 'flex'; dt.style.left = Math.max(4, Math.min(mx - 18, el.clientWidth - 52)) + 'px'; dt.style.top = Math.max(4, mn - 46) + 'px'; } else dt.style.display = 'none';
  }), 'top');
  candle.attachPrimitive(drawLayer);
  function hitTest(x, y, R) {
    const L = dlist();
    if (sel) { const d = L.find(q => q.id === sel), g = d && SH[d.type].scr(d); if (g) for (const h of SH[d.type].handles(g, d)) if (Math.hypot(x - h.x, y - h.y) <= R) return { d, k: h.k }; }
    for (let i = L.length - 1; i >= 0; i--) { const d = L[i], g = SH[d.type] && SH[d.type].scr(d); if (g && SH[d.type].hit(g, x, y)) return { d, k: 'body' }; }
    return null;
  }
  const pt = e => { const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e, r = el.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inPane = p => p.x >= 0 && p.x < paneW() && p.y >= 0 && p.y < paneH();
  const lock = on => chart.applyOptions({ handleScroll: { mouseWheel: true, pressedMouseMove: !on, horzTouchDrag: !on, vertTouchDrag: !on }, handleScale: { mouseWheel: S.C.zoomAnchor === 'cursor', pinch: !on, axisPressedMouseMove: { time: !on, price: !on }, axisDoubleClickReset: { time: true, price: true } } });
  const stop = e => { e.stopPropagation(); e.preventDefault(); };
  function setTool(t) { tool = t; cre = null; if (t) meas = null; document.querySelectorAll('#tools button[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); el.style.cursor = t ? 'crosshair' : ''; if (t) setStatus('Chart par click karo (' + t + ')'); drawLayer.refresh(); }
  function addDraw(d) { d.id = Date.now() + '' + Math.floor(Math.random() * 1e4); dlist().push(d); sel = d.id; setTool(''); save(); drawLayer.refresh(); }
  function place(q) { // long / short: ek click thi, visible chart ma fit thay evu size
    const v = chart.timeScale().getVisibleLogicalRange() || { from: q.idx - 50, to: q.idx + 50 }, w = Math.max(8, Math.round((v.to - v.from) * 0.18)), i0 = Math.min(q.idx, v.to - w - 2);
    const risk = Math.abs(candle.coordinateToPrice(0) - candle.coordinateToPrice(paneH())) * 0.08, long = tool === 'long';
    addDraw({ type: tool, t0: timeOf(i0), t1: timeOf(i0 + w), entry: q.p, stop: long ? q.p - risk : q.p + risk, target: long ? q.p + 2 * risk : q.p - 2 * risk });
  }
  function finishCre() {
    const c = cre; cre = null; let d;
    if (c.type === 'measure') { meas = { type: 'measure', pts: c.pts.map(q => ({ t: q.t, p: q.p })) }; setTool(''); return; }
    if (c.type === 'channel') { const q = c.pts[2]; d = { type: 'channel', pts: [{ t: c.pts[0].t, p: c.pts[0].p }, { t: c.pts[1].t, p: c.pts[1].p }], off: 0 }; d.off = q.p - lineAt(d, q.idx); }
    else d = { type: c.type, pts: c.pts.map(q => ({ t: q.t, p: q.p })) };
    addDraw(d);
  }
  function commit(p) { const q = dpt(p); if (!q) return; cre.pts.push(q); if (cre.pts.length >= cre.need) finishCre(); else cre.cur = { ...q }; }
  function down(e) {
    if ((e.type === 'mousedown' && e.button !== 0) || (e.touches && e.touches.length > 1)) return;
    const p = pt(e); if (!bars.length || !inPane(p)) return;
    if (meas && !tool && !cre) { meas = null; drawLayer.refresh(); }
    if (cre) { commit(p); stop(e); return; }
    const tl = tool || (e.type === 'mousedown' && e.shiftKey ? 'measure' : '');
    if (tl) { const q = dpt(p); if (!q) return;
      if (tool === 'long' || tool === 'short') place(q); else if (tool === 'hray') addDraw({ type: 'hray', pts: [{ t: q.t, p: q.p }] });
      else cre = { type: tl, need: NEED[tl], pts: [q], cur: { ...q }, p0: p, moved: false, pressed: true };
      stop(e); return; }
    const hit = hitTest(p.x, p.y, e.touches ? 18 : 11);
    if (!hit) { if (sel) { sel = null; drawLayer.refresh(); } return; }
    sel = hit.d.id; drag = { d: hit.d, k: hit.k, o: JSON.parse(JSON.stringify(hit.d)), q0: dpt(p) };
    lock(true); drawLayer.refresh(); stop(e);
  }
  function shift(d, o, dI, dP) {
    if (o.pts) d.pts = o.pts.map(a => ({ t: timeOf(idxOf(a.t) + dI), p: a.p + dP }));
    if (o.t0 != null) { d.t0 = timeOf(idxOf(o.t0) + dI); d.t1 = timeOf(idxOf(o.t1) + dI); d.entry = o.entry + dP; d.stop = o.stop + dP; d.target = o.target + dP; }
  }
  function move(e) {
    if (cre) { const p = pt(e), q = dpt(p); if (q) cre.cur = q; if (cre.pressed && Math.hypot(p.x - cre.p0.x, p.y - cre.p0.y) > 6) { cre.moved = true; e.preventDefault(); } drawLayer.refresh(); return; }
    if (!drag) return; const q = dpt(pt(e)); if (!q || !drag.q0) return; const d = drag.d;
    if (drag.k === 'body') shift(d, drag.o, q.idx - drag.q0.idx, q.p - drag.q0.p); else SH[d.type].edit(d, drag.o, drag.k, q);
    drawLayer.refresh(); stop(e);
  }
  function up(e) {
    if (cre && cre.pressed) { cre.pressed = false; if (cre.moved) commit(pt(e)); }
    if (!drag) return; drag = null; lock(false); save();
  }
  const delSel = () => { if (!sel) return; S.draw[S.sym] = dlist().filter(d => d.id !== sel); sel = null; save(); drawLayer.refresh(); };
  el.addEventListener('mousedown', down, true); el.addEventListener('touchstart', down, { capture: true, passive: false });
  window.addEventListener('mousemove', move, true); window.addEventListener('touchmove', move, { capture: true, passive: false });
  ['mouseup', 'touchend', 'touchcancel'].forEach(t => window.addEventListener(t, up, true));
  document.addEventListener('keydown', e => {
    if (document.querySelector('.ov') || (e.target.closest && e.target.closest('input,select,textarea'))) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); delSel(); }
    else if (e.key === 'Escape') { setTool(''); sel = null; meas = null; drawLayer.refresh(); }
  });
  document.querySelectorAll('#tools button').forEach(b => { if (b.dataset.ico) b.append(ico(b.dataset.ico)); if (b.dataset.tool !== undefined) b.onclick = () => setTool(b.dataset.tool); });
  $('dDel').append(ico('trash')); $('dDel').onclick = delSel;
  $('tClear').onclick = () => { if (dlist().length && confirm('Aa symbol na badha drawings delete karvu?')) { S.draw[S.sym] = []; sel = null; save(); drawLayer.refresh(); } };

  // ---------- Timeframe selector ----------
  function renderTfs() {
    const box = $('tfs'), cur = parseTF(S.tf) || parseTF('5m'); box.innerHTML = '';
    const ids = (S.fav.includes(cur.id) ? [...S.fav] : [...S.fav, cur.id]).map(parseTF).filter(Boolean).sort((a, b) => a.minutes - b.minutes);
    ids.forEach(t => box.append(h('button', { class: t.id === cur.id ? 'on' : '', onclick: () => pickTf(t.id) }, tfLabel(t))));
    box.append(h('button', { class: 'more', title: 'All timeframes / custom', onclick: openTf }, ico('chev')));
  }
  const pickTf = id => { S.tf = id; save(); renderTfs(); load(true); };
  function openTf() {
    modal('Timeframe', (md, close) => {
      const body = h('div', { class: 'md-b' }), err = h('small', { class: 'err' }), cur = (parseTF(S.tf) || parseTF('5m')).id;
      const inp = h('input', { class: 'sel srch', type: 'text', placeholder: 'Custom: 7m, 2h, 3D, 2W …' });
      const addC = () => { const t = parseTF(inp.value); if (!t) { err.textContent = 'Format: 7m, 2h, 3D, 2W, 1M'; return; }
        if (!PRESETS.some(g => g[1].includes(t.id)) && !S.custom.includes(t.id)) S.custom.push(t.id); close(); pickTf(t.id); };
      inp.onkeydown = e => { if (e.key === 'Enter') addC(); };
      const render = () => { body.innerHTML = '';
        [...PRESETS, ...(S.custom.length ? [['Custom', S.custom]] : [])].forEach(([g, ids]) => {
          body.append(h('div', { class: 'grp nc' }, g));
          ids.forEach(id => { const t = parseTF(id), fav = S.fav.includes(id);
            body.append(h('div', { class: 'item' + (id === cur ? ' on' : ''), onclick: () => { close(); pickTf(id); } }, h('span', {}, tfName(t)),
              h('span', { class: 'acts' },
                g === 'Custom' ? h('button', { class: 'star', title: 'Remove', onclick: e => { e.stopPropagation(); S.custom = S.custom.filter(x => x !== id); S.fav = S.fav.filter(x => x !== id); save(); renderTfs(); render(); } }, ico('x')) : '',
                h('button', { class: 'star' + (fav ? ' on' : ''), title: 'Pin to toolbar', onclick: e => { e.stopPropagation(); S.fav = fav ? S.fav.filter(x => x !== id) : [...S.fav, id]; save(); renderTfs(); render(); } }, '★'))));
          });
        });
      };
      md.append(h('div', { class: 'srchw tfadd' }, inp, h('button', { class: 'btn pri', onclick: addC }, 'Add'), err), body); render(); inp.focus();
    });
  }

  // ---------- Toolbar wiring ----------
  SYMBOLS.forEach(x => $('sym').append(h('option', { value: x[0] }, x[0]))); $('sym').value = S.sym;
  $('sym').onchange = () => { S.sym = $('sym').value; save(); load(true); };
  const themeIco = () => { $('theme').innerHTML = ''; $('theme').append(ico(S.theme === 'dark' ? 'sun' : 'moon')); };
  $('theme').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; chart.applyOptions(themeOpts()); themeIco(); save(); };
  $('refresh').append(ico('refresh')); $('refresh').onclick = () => load(false);
  $('icoAct').append(ico('act')); $('indBtn').onclick = openIndicators;
  renderTfs(); themeIco(); renderLegend(); setTool(''); load(true);
})();
