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
    const pts = [];
    let sp = null, dir = 0, rc = 0, dp = -1, lastDay = null, prevDailyATR = null, dist = null;
    const hit = (d, n) => { // direction update for a move of n bricks in direction d
      if (dir === 0) dir = d;
      else if (dir === d) rc = 0;
      else { rc += n; if (rc > o.protect) { dir = d; rc = 0; } }
    };
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i], src = b.close, d = dayOf(b.time);
      if (d !== lastDay) { // new day: brick uses the previous completed daily ATR
        lastDay = d;
        while (dp + 1 < daily.length && dayOf(daily[dp + 1].time) < d) dp++;
        prevDailyATR = dp >= 0 ? dATR[dp] : null;
      }
      switch (o.mode) {
        case 'Fixed Points': dist = o.value; break;
        case 'ATR Points': dist = cATR[i]; break;
        case 'Session ATR': dist = prevDailyATR == null ? null : (prevDailyATR / o.hours) / 2; break;
        case 'Percentage (Fixed)': dist = src * (o.value / 100); break;
        case 'Daily ATR %': dist = prevDailyATR == null ? null : prevDailyATR * o.mult; break;
        default: dist = null;
      }
      if (sp == null) { sp = src; dir = 0; rc = 0; }
      else if (src > 0) {
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
      if (o.colorMode === 'Dynamic Candles Breakout/Breakdown') { if (src > sp) cd = 1; else if (src < sp) cd = -1; }
      pts.push({ time: b.time, value: sp, color: cd === 1 ? o.up : cd === -1 ? o.down : '#808080' });
    }
    const comp = o.mode === 'Percentage (Compounding)', pct = o.value / 100;
    const step = comp ? sp * pct : dist;
    const master = o.mode === 'Daily ATR %' || o.mode === 'Session ATR' ? prevDailyATR : null;
    return {
      points: pts,
      last: {
        level: sp, dir, step, master,
        up: step == null ? null : comp ? sp * (1 + pct) : sp + step,
        down: step == null ? null : comp ? sp * (1 - pct) : sp - step
      }
    };
  }

  // ---------- Moving averages (subset of the Pine "MV Type" list) ----------
  const ma = {
    ema(a, n) { const k = 2 / (n + 1), o = []; let p = null; for (const v of a) { if (v == null) { o.push(null); continue; } p = p == null ? v : k * v + (1 - k) * p; o.push(p); } return o; },
    sma(a, n) { return a.map((_, i) => { if (i < n - 1) return null; let s = 0; for (let j = i - n + 1; j <= i; j++) { if (a[j] == null) return null; s += a[j]; } return s / n; }); },
    wma(a, n) { const d = n * (n + 1) / 2; return a.map((_, i) => { if (i < n - 1) return null; let s = 0; for (let j = 0; j < n; j++) { const v = a[i - j]; if (v == null) return null; s += v * (n - j); } return s / d; }); },
    rma(a, n) { const o = []; let p = null; a.forEach((v, i) => { if (v == null) { o.push(null); return; } if (p == null) { if (i < n - 1) { o.push(null); return; } let s = 0; for (let j = i - n + 1; j <= i; j++) { if (a[j] == null) { o.push(null); return; } s += a[j]; } p = s / n; } else p = (p * (n - 1) + v) / n; o.push(p); }); return o; },
    hma(a, n) { const w1 = ma.wma(a, Math.floor(n / 2)), w2 = ma.wma(a, n); return ma.wma(a.map((_, i) => w1[i] == null || w2[i] == null ? null : 2 * w1[i] - w2[i]), Math.round(Math.sqrt(n))); },
    vwma(a, n, vol) { return a.map((_, i) => { if (i < n - 1) return null; let s = 0, w = 0; for (let j = i - n + 1; j <= i; j++) { s += a[j] * vol[j]; w += vol[j]; } return w ? s / w : null; }); },
    dema(a, n) { const e1 = ma.ema(a, n), e2 = ma.ema(e1, n); return e1.map((v, i) => v == null || e2[i] == null ? null : 2 * v - e2[i]); },
    tema(a, n) { const e1 = ma.ema(a, n), e2 = ma.ema(e1, n), e3 = ma.ema(e2, n); return e1.map((v, i) => v == null || e2[i] == null || e3[i] == null ? null : 3 * v - 3 * e2[i] + e3[i]); },
    zlema(a, n) { const lag = Math.floor((n - 1) / 2); return ma.ema(a.map((v, i) => i >= lag ? v + (v - a[i - lag]) : null), n); },
    lsma(a, n) { return a.map((_, i) => { if (i < n - 1) return null; let sx = 0, sy = 0, sxy = 0, sxx = 0; for (let x = 0; x < n; x++) { const y = a[i - n + 1 + x]; if (y == null) return null; sx += x; sy += y; sxy += x * y; sxx += x * x; } const b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return (sy - b * sx) / n + b * (n - 1); }); }
  };

  // Smart EMA (Scaled mode) + EMA + cloud. o: {sLen, baseMin, tfMin, type, len}
  function smartCloud(bars, o) {
    const close = bars.map(b => b.close), vol = bars.map(b => b.volume);
    const sl = o.tfMin >= o.baseMin ? o.sLen : Math.max(1, Math.round(o.sLen * o.baseMin / o.tfMin));
    const smart = ma.ema(close, sl);
    const fn = ma[o.type] || ma.ema;
    const emaV = fn(close, o.len, vol);
    const sPts = [], ePts = [], cloud = [];
    for (let i = 0; i < bars.length; i++) {
      if (smart[i] != null) sPts.push({ time: bars[i].time, value: smart[i] });
      if (emaV[i] != null) ePts.push({ time: bars[i].time, value: emaV[i] });
      if (smart[i] != null && emaV[i] != null) cloud.push({ time: bars[i].time, a: smart[i], b: emaV[i], up: emaV[i] > smart[i] });
    }
    return { smart: sPts, ema: ePts, cloud, smartLen: sl };
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
  g.KIS = { stepLine, atrSeries, smartCloud, institutionZones, maTypes: Object.keys(ma) };
})(window);
