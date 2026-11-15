// Analog MX Lite — modelo de puntuación. Funciona en el navegador (window.AnalogScore) y en Node
// (module.exports), así pipeline/validate.py usa exactamente la misma matemática que la UI.
(function (root) {
  "use strict";

  // dir: +1 = un valor más alto se parece más a la Luna/Marte; -1 = un valor más bajo
  const CRITERIA = {
    dryness: { label: "Dryness", here: "Rainfall", field: "PRECTOTCORR", dir: -1, unit: "mm/day", digits: 2 },
    temp_swing: { label: "Temperature swing", here: "Day–night swing", field: "T2M_RANGE", dir: +1, unit: "°C", digits: 1 },
    cold: { label: "Cold", here: "Average temperature", field: "T2M", dir: -1, unit: "°C", digits: 1 },
    sunshine: { label: "Sunshine", here: "Sunshine", field: "ALLSKY_SFC_SW_DWN", dir: +1, unit: "W/m²", digits: 0 },
    terrain: { label: "Terrain variation", here: "Terrain variation", field: "terrain_var_m", dir: +1, unit: "m", digits: 0 },
  };

  const TESTS = [
    { crit: "terrain", text: "Rover mobility on rough terrain" },
    { crit: "dryness", text: "Dust and equipment durability in very dry conditions" },
    { crit: "temp_swing", text: "Thermal cycling of hardware and habitats" },
    { crit: "sunshine", text: "Solar power systems" },
  ];

  function value(cell, key) {
    const v = cell[CRITERIA[key].field];
    return v === undefined ? null : v;
  }

  // Rango percentil en [0,1] (empates promediados) con la dirección aplicada: s[key][i] por celda.
  function percentiles(cells) {
    const out = {};
    for (const k of Object.keys(CRITERIA)) {
      const vals = cells.map((c) => value(c, k)).sort((a, b) => a - b);
      const n = vals.length;
      out[k] = cells.map((c) => {
        const x = value(c, k);
        let lo = 0, hi = n;
        while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m] < x) lo = m + 1; else hi = m; }
        let lo2 = lo, hi2 = n;
        while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (vals[m] <= x) lo2 = m + 1; else hi2 = m; }
        const p = n > 1 ? (lo + (lo2 - lo - 1) / 2) / (n - 1) : 0.5;
        return CRITERIA[k].dir > 0 ? p : 1 - p;
      });
    }
    return out;
  }

  // S = 100 · Σ(w·s) / Σ(w). Devuelve [{score, parts:{key: s}}] alineado con cells.
  function scoreAll(cells, weights, pct) {
    pct = pct || percentiles(cells);
    const keys = Object.keys(CRITERIA);
    const den = keys.reduce((a, k) => a + (weights[k] || 0), 0);
    return cells.map((cell, i) => {
      let num = 0;
      const parts = {};
      for (const k of keys) {
        parts[k] = pct[k][i];
        num += (weights[k] || 0) * parts[k];
      }
      return { score: den > 0 ? (100 * num) / den : 0, parts };
    });
  }

  function testsFor(parts) {
    return TESTS.filter((t) => parts[t.crit] >= 0.7).map((t) => t.text);
  }

  // Rango (1 = mejor) y porcentaje "top" de la celda i.
  function rankOf(results, i) {
    const s = results[i].score;
    const better = results.filter((r) => r.score > s).length;
    return { rank: better + 1, n: results.length, topPct: (100 * (better + 1)) / results.length };
  }

  function nearestCell(cells, lat, lon) {
    let best = -1, bd = Infinity;
    cells.forEach((c, i) => {
      const d = Math.pow(c.lat - lat, 2) + Math.pow((c.lon - lon) * Math.cos((lat * Math.PI) / 180), 2);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  const api = { CRITERIA, TESTS, value, percentiles, scoreAll, testsFor, rankOf, nearestCell };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AnalogScore = api;
})(typeof window !== "undefined" ? window : globalThis);
