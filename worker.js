// Cloudflare Worker: only the data API (/api/*). Static files in public/ are served by Cloudflare assets.
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/candles") {
      try {
        const q = u.searchParams, sym = encodeURIComponent(q.get("symbol") || "^NSEI");
        const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + sym + "?interval=" + (q.get("interval") || "5m") + "&range=" + (q.get("range") || "5d");
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!r.ok) throw new Error("Yahoo error " + r.status);
        const j = await r.json();
        const res = j.chart && j.chart.result && j.chart.result[0];
        if (!res) throw new Error("No data for symbol");
        const off = res.meta.gmtoffset || 0, t = res.timestamp || [], x = res.indicators.quote[0], out = [];
        for (let i = 0; i < t.length; i++) {
          if (x.open[i] == null || x.close[i] == null) continue;
          out.push({ time: t[i] + off, open: x.open[i], high: x.high[i], low: x.low[i], close: x.close[i], volume: x.volume[i] || 0 });
        }
        return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return env.ASSETS.fetch(req);
  }
};
