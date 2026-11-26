// KIS v2.0 -> JavaScript port. Feature 1: Dynamic Step Line (section 4 of the Pine script).
(function (g) {
  const dayOf = t => Math.floor(t / 86400);

  // Wilder ATR (ta.atr): TR, RMA seeded with SMA of first `len` values
  function atrSeries(bars, len) {
    const out = new Array(bars.length).fill(null);
    let rma = null, sum = 0;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i], pc = i > 0 ? bars[i - 1].close : null;
      const tr = pc == null ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
      if (i < len) { sum += tr; if (i === len - 1) { rma = sum / len; out[i] = rma; } }
      else { rma = (rma * (len - 1) + tr) / len; out[i] = rma; }
    }
    return out;
  }

  // o: {mode, value, atrLen, hours, mult, protect, colorMode, up, down}
  function stepLine(bars, daily, o) {
    const dATR = atrSeries(daily, o.atrLen);
    const cATR = o.mode === 'ATR Points' ? atrSeries(bars, o.atrLen) : null;
    const pts = [], cds = [], sps = [], srcs = [];
    let sp = null, dir = 0, rc = 0, dp = -1, lastDay = null, prevDailyATR = null, dist = null;
    const hit = (d, n) => { // direction update for a move of n bricks in direction d
      if (dir === 0) dir = d;
      else if (dir === d) rc = 0;
      else { rc += n; if (rc > o.protect) { dir = d; rc = 0; } }
    };
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i], src = o.src ? o.src[i] : b.close, d = dayOf(b.time);
      if (d !== lastDay) { // new day: brick uses the previous completed daily ATR
        lastDay = d;
        while (dp + 1 < daily.length && dayOf(daily[dp + 1].time) < d) dp++;
        prevDailyATR = dp >= 0 ? dATR[dp] : null;
      }
      switch (o.mode) {
        case 'Fixed Points': dist = o.value; break;
        case 'ATR Points': dist = cATR[i]; break;
        case 'Session ATR': dist = prevDailyATR == null ? null : (prevDailyATR / o.hours) / 2; break;
        case 'Percentage (Fixed)': dist = src == null ? null : src * (o.value / 100); break;
        case 'Daily ATR %': dist = prevDailyATR == null ? null : prevDailyATR * o.mult; break;
        default: dist = null;
      }
      if (sp == null) { if (src != null) { sp = src; dir = 0; rc = 0; } }
      else if (src != null && src > 0) {
        if (o.mode === 'Percentage (Compounding)') {
          const pct = o.value / 100;
          if (src >= sp * (1 + pct)) {
            const n = Math.floor(Math.log(src / sp) / Math.log(1 + pct));
            sp *= Math.pow(1 + pct, n); hit(1, n);
          } else if (src <= sp * (1 - pct)) {
            const n = Math.floor(Math.log(sp / src) / -Math.log(1 - pct));
            sp *= Math.pow(1 - pct, n); hit(-1, n);
          }
        } else if (dist != null && dist > 0) {
          if (src >= sp + dist) { const n = Math.floor((src - sp) / dist); sp += n * dist; hit(1, n); }
          else if (src <= sp - dist) { const n = Math.floor((sp - src) / dist); sp -= n * dist; hit(-1, n); }
        }
      }
      let cd = dir;
      if (o.colorMode === 'Dynamic Candles Breakout/Breakdown') { if (src != null && sp != null) { if (src > sp) cd = 1; else if (src < sp) cd = -1; } }
      cds.push(sp == null ? 0 : cd); sps.push(sp); srcs.push(src);
      if (sp != null) pts.push({ time: b.time, value: sp, color: cd === 1 ? o.up : cd === -1 ? o.down : '#808080' });
    }
    const comp = o.mode === 'Percentage (Compounding)', pct = o.value / 100;
    const step = comp ? sp * pct : dist;
    const master = o.mode === 'Daily ATR %' || o.mode === 'Session ATR' ? prevDailyATR : null;
    return {
      points: pts, dirs: cds, sps, srcs,
      last: {
        level: sp, dir, step, master,
        up: step == null ? null : comp ? sp * (1 + pct) : sp + step,
        down: step == null ? null : comp ? sp * (1 - pct) : sp - step
      }
    };
  }

  // ---------- Moving averages: Pine "MV Type" list (37) ----------
  const sq = x => x * x;
  const MV_TYPES = ['EMA', 'SMA', 'WMA', 'HMA', 'RMA', 'VWMA', 'LSMA', 'ALMA', 'DEMA', 'TEMA', 'ZLEMA', 'T3', 'KAMA', 'McGinley', 'TMA', 'SuperSmoother', 'JMA', 'FRAMA', 'VIDYA', 'Median', 'Triangular', 'Gaussian', 'Epanechnikov', 'Logistic', 'Log Logistic', 'Cosine', 'Sinc', 'Laplace', 'Quartic', 'Parabolic', 'Exponential', 'Silverman', 'Cauchy', 'Tent', 'Wave', 'Power', 'Morters'];
  const K = { // kernel weights, x in 0..1, bandwidth 1
    Triangular: x => Math.abs(x) <= 1 ? 1 - Math.abs(x) : 0, Gaussian: x => Math.exp(-sq(x) / 2) / Math.sqrt(2 * Math.PI),
    Epanechnikov: x => Math.abs(x) <= 1 ? .75 * (1 - sq(x)) : 0, Logistic: x => 1 / (Math.exp(x) + 2 + Math.exp(-x)),
    'Log Logistic': x => 1 / sq(1 + Math.abs(x)), Cosine: x => Math.abs(x) <= 1 ? Math.PI / 4 * Math.cos(Math.PI / 2 * x) : 0,
    Sinc: x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x), Laplace: x => .5 * Math.exp(-Math.abs(x)),
    Quartic: x => Math.abs(x) <= 1 ? 15 / 16 * sq(1 - sq(x)) : 0, Parabolic: x => Math.abs(x) <= 1 ? 1 - sq(x) : 0,
    Exponential: x => Math.exp(-Math.abs(x)), Silverman: x => Math.abs(x) <= .5 ? .5 * Math.exp(-x / 2) * Math.sin(x / 2 + Math.PI / 4) : 0,
    Cauchy: x => 1 / (Math.PI * (1 + sq(x))), Tent: x => Math.abs(x) <= 1 ? 1 - Math.abs(x) : 0,
    Wave: x => Math.abs(x) <= 1 ? (1 - Math.abs(x)) * Math.cos(Math.PI * x) : 0, Power: x => Math.abs(x) <= 1 ? Math.pow(1 - Math.pow(Math.abs(x), 3), 3) : 0,
    Morters: x => Math.abs(x) <= Math.PI ? (1 + Math.cos(x)) / (2 * Math.PI) : 0 };
  const walk = (a, f) => { const o = []; for (let i = 0; i < a.length; i++) o.push(f(i)); return o; };
  const ma = {
    EMA(a, n) { const k = 2 / (n + 1), o = []; let p = null; for (const v of a) { if (v == null) { o.push(null); continue; } p = p == null ? v : k * v + (1 - k) * p; o.push(p); } return o; },
    SMA(a, n) { return walk(a, i => { if (i < n - 1) return null; let s = 0; for (let j = i - n + 1; j <= i; j++) { if (a[j] == null) return null; s += a[j]; } return s / n; }); },
    WMA(a, n) { const d = n * (n + 1) / 2; return walk(a, i => { if (i < n - 1) return null; let s = 0; for (let j = 0; j < n; j++) { const v = a[i - j]; if (v == null) return null; s += v * (n - j); } return s / d; }); },
    RMA(a, n) { const o = []; let p = null; a.forEach((v, i) => { if (v == null) { o.push(null); return; } if (p == null) { if (i < n - 1) { o.push(null); return; } let s = 0; for (let j = i - n + 1; j <= i; j++) { if (a[j] == null) { o.push(null); return; } s += a[j]; } p = s / n; } else p = (p * (n - 1) + v) / n; o.push(p); }); return o; },
    HMA(a, n) { const w1 = ma.WMA(a, Math.max(1, Math.floor(n / 2))), w2 = ma.WMA(a, n); return ma.WMA(a.map((_, i) => w1[i] == null || w2[i] == null ? null : 2 * w1[i] - w2[i]), Math.max(1, Math.round(Math.sqrt(n)))); },
    VWMA(a, n, vol) { return walk(a, i => { if (i < n - 1) return null; let s = 0, w = 0; for (let j = i - n + 1; j <= i; j++) { s += a[j] * vol[j]; w += vol[j]; } return w ? s / w : null; }); },
    LSMA(a, n) { return walk(a, i => { if (i < n - 1) return null; let sx = 0, sy = 0, sxy = 0, sxx = 0; for (let x = 0; x < n; x++) { const y = a[i - n + 1 + x]; if (y == null) return null; sx += x; sy += y; sxy += x * y; sxx += x * x; } const d = n * sxx - sx * sx, b = d ? (n * sxy - sx * sy) / d : 0; return (sy - b * sx) / n + b * (n - 1); }); },
    ALMA(a, n) { const m = Math.floor(.85 * (n - 1)), s = n / 6, w = [];let nm = 0; for (let i = 0; i < n; i++) { const x = Math.exp(-sq(i - m) / (2 * sq(s))); w.push(x); nm += x; } return walk(a, i => { if (i < n - 1) return null; let t = 0; for (let j = 0; j < n; j++) { const v = a[i - n + 1 + j]; if (v == null) return null; t += v * w[j]; } return t / nm; }); },
    DEMA(a, n) { const e1 = ma.EMA(a, n), e2 = ma.EMA(e1, n); return e1.map((v, i) => v == null || e2[i] == null ? null : 2 * v - e2[i]); },
    TEMA(a, n) { const e1 = ma.EMA(a, n), e2 = ma.EMA(e1, n), e3 = ma.EMA(e2, n); return e1.map((v, i) => v == null || e2[i] == null || e3[i] == null ? null : 3 * v - 3 * e2[i] + e3[i]); },
    ZLEMA(a, n) { const lag = Math.floor((n - 1) / 2); return ma.EMA(a.map((v, i) => i >= lag ? v + (v - a[i - lag]) : null), n); },
    T3(a, n) { const b = .7, e = [a]; for (let i = 0; i < 6; i++) e.push(ma.EMA(e[i], n)); const c1 = -(b ** 3), c2 = 3 * b * b + 3 * b ** 3, c3 = -6 * b * b - 3 * b - 3 * b ** 3, c4 = 1 + 3 * b + b ** 3 + 3 * b * b; return walk(a, i => [3, 4, 5, 6].some(q => e[q][i] == null) ? null : c1 * e[6][i] + c2 * e[5][i] + c3 * e[4][i] + c4 * e[3][i]); },
    KAMA(a, n) { const o = []; let r = null; for (let i = 0; i < a.length; i++) { let v = null; if (i >= n) { let vol = 0; for (let j = 0; j < n; j++) vol += Math.abs(a[i - j] - a[i - j - 1]); const er = vol === 0 ? 0 : Math.abs(a[i] - a[i - n]) / vol, sc = sq(er * (2 / 3 - 2 / 31) + 2 / 31), p = r == null ? a[i] : r; v = p + sc * (a[i] - p); } r = v; o.push(v); } return o; },
    McGinley(a, n) { const o = []; let m = null; for (const v of a) { m = (m == null || m === 0) ? v : m + (v - m) / (.6 * n * Math.pow(v / m, 4)); o.push(m); } return o; },
    TMA(a, n) { return ma.SMA(ma.SMA(a, Math.ceil(n / 2)), Math.floor(n / 2) + 1); },
    SuperSmoother(a, n) { const a1 = Math.exp(-1.414 * Math.PI / n), b1 = 2 * a1 * Math.cos(1.414 * Math.PI / n), c3 = -a1 * a1, c1 = 1 - b1 - c3, o = []; for (let i = 0; i < a.length; i++) o.push(i === 0 ? a[0] : c1 * (a[i] + a[i - 1]) / 2 + b1 * o[i - 1] + c3 * (i > 1 ? o[i - 2] : 0)); return o; },
    JMA(a, n) { const be = .45 * (n - 1) / (.45 * (n - 1) + 2), al = be * be, o = []; let e0, e1, e2; for (let i = 0; i < a.length; i++) { if (i === 0) { e0 = a[0]; e1 = 0; e2 = 0; o.push(a[0]); } else { e0 = (1 - al) * a[i] + al * e0; e1 = (a[i] - e0) * (1 - be) + be * e1; e2 = (e0 + 1.5 * e1 - o[i - 1]) * sq(1 - al) + al * al * e2; o.push(e2 + o[i - 1]); } } return o; },
    FRAMA(a, n) { const n1 = Math.max(1, Math.floor(n / 2)), o = []; const ex = (i, k, f, z) => { if (i < k - 1) return null; let m = z; for (let j = i - k + 1; j <= i; j++) m = f(m, a[j]); return m; };
      const hi = (i, k) => ex(i, k, Math.max, -Infinity), lo = (i, k) => ex(i, k, Math.min, Infinity); let fr = null;
      for (let i = 0; i < a.length; i++) { const h1 = hi(i, n1), l1 = lo(i, n1), h2 = i - n1 >= 0 ? hi(i - n1, n1) : null, l2 = i - n1 >= 0 ? lo(i - n1, n1) : null, h3 = hi(i, n), l3 = lo(i, n); let D = 0;
        if (h1 != null && h2 != null && h3 != null) { const N1 = (h1 - l1) / n1, N2 = (h2 - l2) / n1, N3 = (h3 - l3) / n; if (N1 + N2 > 0 && N3 > 0) D = (Math.log(N1 + N2) - Math.log(N3)) / Math.log(2); }
        const al = Math.max(Math.min(Math.exp(-4.6 * (D - 1)), 1), .01); fr = fr == null ? a[i] : al * a[i] + (1 - al) * fr; o.push(fr); } return o; },
    VIDYA(a, n) { const k = 2 / (n + 1), o = []; let v = null; for (let i = 0; i < a.length; i++) { let cmo = 0; if (i >= n) { let vol = 0; for (let j = 0; j < n; j++) vol += Math.abs(a[i - j] - a[i - j - 1]); if (vol !== 0) cmo = 100 * Math.abs(a[i] - a[i - n]) / vol; } const al = k * cmo / 100; v = v == null ? a[i] : al * a[i] + (1 - al) * v; o.push(v); } return o; },
    Median(a, n) { return walk(a, i => { if (i < n - 1) return null; const w = a.slice(i - n + 1, i + 1); if (w.some(x => x == null)) return null; w.sort((x, y) => x - y); const m = w.length >> 1; return w.length % 2 ? w[m] : (w[m - 1] + w[m]) / 2; }); }
  };
  Object.keys(K).forEach(s => ma[s] = (a, n) => { const w = []; let sw = 0; for (let i = 0; i < n; i++) { const x = K[s](i / n); w.push(x); sw += x; }
    return walk(a, idx => { let t = 0; for (let i = 0; i < n; i++) { const v = idx - i >= 0 ? a[idx - i] : 0; t += (v == null ? 0 : v) * w[i]; } return sw !== 0 ? t / sw : a[idx]; }); });
  const maCalc = (type, a, n, vol) => (ma[ma[type] ? type : String(type).toUpperCase()] || ma.EMA)(a, n, vol);

  // ---------- Step Data Source (28 options) ----------
  const SRC_NAMES = ['Real Price', 'Chart Native', 'SMA', 'EMA', 'WMA', 'RMA', 'ALMA', 'DEMA', 'TMA', 'VWMA', 'ZLEMA', 'HMA', 'TEMA', 'SuperSmoother', 'Heikin Ashi', 'Linear Regression', 'Linear Regression Heikin Ashi', 'Kernel Regression', 'Epanechnikov', 'Triangular', 'McGinley Dynamic', 'JMA', 'KAMA', 'FRAMA', 'VIDYA', 'Median', 'Smoothed Heikin Ashi', 'T3'];
  const SRC_MAP = { 'Linear Regression': 'LSMA', 'Kernel Regression': 'Gaussian', 'McGinley Dynamic': 'McGinley' };
  function heikin(s) {
    const c = s.close.map((_, i) => (s.open[i] + s.high[i] + s.low[i] + s.close[i]) / 4), o = [], h = [], l = [];
    c.forEach((v, i) => { o.push(i ? (o[i - 1] + c[i - 1]) / 2 : (s.open[i] + s.close[i]) / 2); h.push(Math.max(s.high[i], o[i], v)); l.push(Math.min(s.low[i], o[i], v)); });
    return { close: c, open: o, high: h, low: l };
  }
  function source(name, len, fld, d) {
    const base = d.std[fld], ha = d.ha[fld];
    if (name === 'Real Price' || name === 'Chart Native') return base;
    if (name === 'Heikin Ashi') return ha;
    if (name === 'Smoothed Heikin Ashi') return ma.SuperSmoother(ha, len);
    if (name === 'Linear Regression Heikin Ashi') return ma.LSMA(ha, len);
    return (ma[SRC_MAP[name] || name] || ma.EMA)(base, len, d.std.volume);
  }

  // ---------- Supertrend / HalfTrend / RSI (used for candle colours) ----------
  const trArr = bars => bars.map((b, i) => { const pc = i ? bars[i - 1].close : b.close; return Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc)); });
  function superTrend(src, atr, f, conf) {
    let upper = null, lower = null, dir = 1; const out = [];
    for (let i = 0; i < src.length; i++) {
      if (atr[i] == null) { out.push(dir); continue; }
      const ub = src[i] + f * atr[i], lb = src[i] - f * atr[i], pu = upper, pl = lower, pc = i ? conf[i - 1] : null;
      upper = pu == null ? ub : (ub < pu || (pc != null && pc > pu) ? ub : pu);
      lower = pl == null ? lb : (lb > pl || (pc != null && pc < pl) ? lb : pl);
      if (pu != null && pl != null) { if (dir === -1 && conf[i] > pu) dir = 1; else if (dir === 1 && conf[i] < pl) dir = -1; }
      out.push(dir);
    }
    return out;
  }
  function halfTrend(d, P) {
    const H = source(P.hSrc, P.hLen, 'high', d), L = source(P.hSrc, P.hLen, 'low', d), C = source(P.hSrc, P.hLen, 'close', d), amp = Math.max(1, P.hAmp | 0), out = [];
    const win = (a, i, f, z) => { if (i < amp - 1) return null; let m = z; for (let j = i - amp + 1; j <= i; j++) m = f(m, a[j]); return m; };
    const avg = (a, i) => { if (i < amp - 1) return null; let s = 0; for (let j = i - amp + 1; j <= i; j++) s += a[j]; return s / amp; };
    const mx = (x, y) => x == null || y == null ? null : Math.max(x, y), mn = (x, y) => x == null || y == null ? null : Math.min(x, y);
    let trend = 0, next = 0, maxLow = null, minHigh = null, up = 0, down = 0;
    for (let i = 0; i < H.length; i++) {
      const pT = i ? trend : null, pUp = i ? up : null, pDown = i ? down : null, pL = i ? L[i - 1] : L[i], pH = i ? H[i - 1] : H[i];
      if (maxLow == null) maxLow = pL; if (minHigh == null) minHigh = pH;
      const hp = win(H, i, Math.max, -Infinity), lp = win(L, i, Math.min, Infinity), hMA = avg(H, i), lMA = avg(L, i);
      if (next === 1) { maxLow = mx(lp, maxLow); if (hMA != null && maxLow != null && hMA < maxLow && C[i] < pL) { trend = 1; next = 0; minHigh = hp; } }
      else { minHigh = mn(hp, minHigh); if (lMA != null && minHigh != null && lMA > minHigh && C[i] > pH) { trend = 0; next = 1; maxLow = lp; } }
      if (trend === 0) { if (pT != null && pT !== 0) up = pDown; else up = pUp == null ? maxLow : mx(maxLow, pUp); }
      else { if (pT != null && pT !== 1) down = pUp; else down = pDown == null ? minHigh : mn(minHigh, pDown); }
      out.push(trend);
    }
    return out;
  }
  function rsi14(c) {
    const o = []; let ag = null, al = null, sg = 0, sl = 0;
    for (let i = 0; i < c.length; i++) {
      if (i === 0) { o.push(null); continue; }
      const ch = c[i] - c[i - 1], g = Math.max(ch, 0), l = Math.max(-ch, 0);
      if (i <= 14) { sg += g; sl += l; if (i === 14) { ag = sg / 14; al = sl / 14; } } else { ag = (ag * 13 + g) / 14; al = (al * 13 + l) / 14; }
      o.push(ag == null ? null : al === 0 ? 100 : ag === 0 ? 0 : 100 - 100 / (1 + ag / al));
    }
    return o;
  }

  // ---------- Candle colours (all 7 KIS modes) ----------
  function candleColors(bars, P, R) {
    const m = P.cMode; if (m === 'None') return null;
    const up = P.cUp, dn = P.cDn, ne = P.cNe;
    return bars.map((_, i) => {
      if (m === 'As Per Step Line') { const c = R.step.dirs[i]; return c === 1 ? P.sUp : c === -1 ? P.sDn : ne; }
      if (m === 'As Per Step Line Breakout/Breakdown') { const s = R.step.srcs[i], p = R.step.sps[i]; return s == null || p == null ? ne : s > p ? P.sUp : s < p ? P.sDn : ne; }
      if (m === 'RSI') { const r = R.rsi[i]; return r == null ? ne : r > 50 ? up : r < 50 ? dn : ne; }
      if (m === 'Smart EMA') { const e = R.ema.ema[i], s = R.ema.smart[i]; return e == null || s == null ? ne : e > s ? up : e < s ? dn : ne; }
      if (m === 'HalfTrend') return R.ht[i] === 0 ? up : dn;
      const a = R.st1[i], b = R.st2[i]; return a === 1 && b === 1 ? up : a === -1 && b === -1 ? dn : ne;
    });
  }

  // Everything the indicator draws, from the settings P
  function compute(bars, daily, P, tfMin) {
    const std = { open: bars.map(b => b.open), high: bars.map(b => b.high), low: bars.map(b => b.low), close: bars.map(b => b.close), volume: bars.map(b => b.volume || 0) };
    const d = { std, ha: heikin(std) }, m = P.cMode, R = {};
    if (P.sShow || m === 'As Per Step Line' || m === 'As Per Step Line Breakout/Breakdown')
      R.step = stepLine(bars, daily, { mode: P.sMode, value: P.sVal, atrLen: Math.max(1, P.sLen | 0), hours: P.sHrs || 6.5, mult: P.sMult, protect: Math.max(0, P.sProt | 0), colorMode: P.sCol, up: P.sUp, down: P.sDn, src: source(P.sSrc, Math.max(1, P.sSrcLen | 0), 'close', d) });
    if (P.eSmart || P.eShow || P.eCloud || m === 'Smart EMA') {
      const base = +P.eBase, sl = tfMin >= base ? P.eSLen : Math.max(1, Math.round(P.eSLen * base / tfMin));
      const smart = ma.EMA(std.close, Math.max(1, sl | 0)), ev = maCalc(P.eType, std.close, Math.max(1, P.eLen | 0), std.volume), sPts = [], ePts = [], cloud = [];
      bars.forEach((b, i) => { if (smart[i] != null) sPts.push({ time: b.time, value: smart[i] }); if (ev[i] != null) ePts.push({ time: b.time, value: ev[i] });
        if (smart[i] != null && ev[i] != null) cloud.push({ time: b.time, a: smart[i], b: ev[i], up: ev[i] > smart[i] }); });
      R.ema = { smart, ema: ev, sPts, ePts, cloud };
    }
    if (m === 'HalfTrend') R.ht = halfTrend(d, P);
    if (m === 'Supertrend 1 & 2') { const tr = trArr(bars), hl2 = bars.map(b => (b.high + b.low) / 2);
      R.st1 = superTrend(hl2, ma.RMA(tr, Math.max(1, P.st1Len | 0)), P.st1Mul, std.close); R.st2 = superTrend(hl2, ma.RMA(tr, Math.max(1, P.st2Len | 0)), P.st2Mul, std.close); }
    if (m === 'RSI') R.rsi = rsi14(std.close);
    R.colors = candleColors(bars, P, R);
    return R;
  }

  // Institution Zone 1: first RED candle (zone timeframe) after the session's opening candle.
  // Zone = fib band (bottom..top) of that candle's range, from that candle to the end of the day.
  function institutionZones(zbars, chart, o) {
    const dr = new Map(); // day -> [firstIdx, lastIdx] in chart bars
    chart.forEach((b, i) => { const d = dayOf(b.time), r = dr.get(d); if (r) r[1] = i; else dr.set(d, [i, i]); });
    const out = []; let curDay = null, sess = null, done = false;
    for (const z of zbars) {
      const d = dayOf(z.time);
      if (d !== curDay) { curDay = d; sess = z.time; done = false; }
      if (!done && z.time > sess && z.close < z.open) {
        done = true;
        const r = dr.get(d); if (!r) continue;
        let s = r[0]; for (let i = r[0]; i <= r[1] && chart[i].time <= z.time; i++) s = i;
        const rng = z.high - z.low;
        out.push({ t0: chart[s].time, t1: chart[r[1]].time, bot: z.low + rng * o.bottom, top: z.low + rng * o.top });
      }
    }
    return out;
  }
  g.KIS = { stepLine, atrSeries, compute, institutionZones, maTypes: MV_TYPES, srcNames: SRC_NAMES };
})(window);
