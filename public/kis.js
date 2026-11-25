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
  g.KIS = { stepLine, atrSeries };
})(window);
