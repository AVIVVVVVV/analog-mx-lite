// Analog MX scoring model. Works in the browser (window.AnalogScore) and in Node (module.exports),
// so pipeline/validate.py uses exactly the same math as the UI.
(function (root) {
  "use strict";

  // field: column in cells.json; kind: match (terrain, compare to target value) or extreme (percentile rank)
  // dir for extreme: +1 = higher value scores higher, -1 = lower value scores higher
  const CRITERIA = {
    slope_median_deg: { label: "Median slope", field: "slope_median_deg", kind: "match", unit: "°", group: "terrain" },
    slope_p90_deg: { label: "Steep-slope share (P90 slope)", field: "slope_p90_deg", kind: "match", unit: "°", group: "terrain" },
    relief_m: { label: "Local relief (P95−P5 elevation)", field: "relief_m", kind: "match", unit: "m", group: "terrain" },
    aridity: { label: "Aridity (low precipitation)", field: "PRECTOTCORR", kind: "extreme", dir: -1, unit: "mm/day" },
    thermal_range: { label: "Daily temperature swing", field: "T2M_RANGE", kind: "extreme", dir: +1, unit: "°C" },
    cold: { label: "Cold (low mean temperature)", field: "T2M", kind: "extreme", dir: -1, unit: "°C" },
    solar: { label: "Solar irradiance", field: "ALLSKY_SFC_SW_DWN", kind: "extreme", dir: +1, unit: "W/m²" },
  };

  const DEFAULT_WEIGHTS = {
    slope_median_deg: 1.0, slope_p90_deg: 1.0, relief_m: 1.0,
    aridity: 1.0, thermal_range: 0.75, cold: 0.5, solar: 0.5,
  };

  const TESTS = [
    { crits: ["slope_median_deg", "slope_p90_deg", "relief_m"], text: "Rover mobility and navigation on comparable slopes" },
    { crits: ["aridity"], text: "Dust mitigation and equipment durability in hyper-arid conditions" },
    { crits: ["thermal_range"], text: "Thermal cycling of hardware and habitats" },
    { crits: ["solar"], text: "Solar power systems" },
  ];

  function value(cell, key) {
    const c = CRITERIA[key];
    let v = cell[c.field];
    if (key === "thermal_range" && (v === null || v === undefined) && cell.T2M_MAX != null && cell.T2M_MIN != null) {
      v = cell.T2M_MAX - cell.T2M_MIN;
    }
    return v === undefined ? null : v;
  }

  // Criteria that are active for a target (match criteria need a sourced numeric value).
  function activeCriteria(target) {
    return Object.keys(CRITERIA).filter((k) => {
      const t = target.criteria[k];
      if (!t) return false;
      if (CRITERIA[k].kind === "match") return t.value !== null && t.value !== undefined;
      return true;
    });
  }

  // Percentile rank in [0,1] with ties averaged; direction applied.
  function percentileFns(cells) {
    const out = {};
    for (const k of Object.keys(CRITERIA)) {
      if (CRITERIA[k].kind !== "extreme") continue;
      const vals = cells.map((c) => value(c, k)).filter((v) => v !== null).sort((a, b) => a - b);
      const n = vals.length;
      out[k] = (x) => {
        if (x === null || n < 2) return null;
        let lo = 0, hi = n;
        while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m] < x) lo = m + 1; else hi = m; }
        let lo2 = lo, hi2 = n;
        while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (vals[m] <= x) lo2 = m + 1; else hi2 = m; }
        const p = (lo + (lo2 - lo - 1) / 2) / (n - 1);
        return CRITERIA[k].dir > 0 ? p : 1 - p;
      };
    }
    return out;
  }

  // Returns [{score, confidence, parts:{key:s_i|null}}] aligned with cells.
  function scoreAll(cells, target, weights, meta, pfns) {
    pfns = pfns || percentileFns(cells);
    const active = activeCriteria(target);
    return cells.map((cell) => {
      let num = 0, den = 0, have = 0;
      const parts = {};
      for (const k of active) {
        const x = value(cell, k);
        let s = null;
        if (x !== null) {
          if (CRITERIA[k].kind === "match") {
            const t = target.criteria[k].value, sig = meta.sigma[CRITERIA[k].field];
            s = Math.exp(-0.5 * Math.pow((x - t) / sig, 2));
          } else {
            s = pfns[k](x);
          }
        }
        parts[k] = s;
        if (s !== null) {
          have++;
          const w = weights[k] ?? 0;
          num += w * s; den += w;
        }
      }
      return {
        score: den > 0 ? (100 * num) / den : null,
        confidence: active.length ? have / active.length : 0,
        parts,
      };
    });
  }

  function testsFor(parts) {
    return TESTS.filter((t) => t.crits.some((k) => parts[k] != null && parts[k] >= 0.7)).map((t) => t.text);
  }

  // Rank (1 = best) and percentile (share of cells scoring <= this one) of index i.
  function rankOf(results, i) {
    const s = results[i].score;
    const scored = results.filter((r) => r.score !== null);
    const better = scored.filter((r) => r.score > s).length;
    return { rank: better + 1, n: scored.length, topPct: (100 * (better + 1)) / scored.length };
  }

  function nearestCell(cells, lat, lon) {
    let best = -1, bd = Infinity;
    cells.forEach((c, i) => {
      const d = Math.pow(c.lat - lat, 2) + Math.pow((c.lon - lon) * Math.cos((lat * Math.PI) / 180), 2);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  const api = { CRITERIA, DEFAULT_WEIGHTS, TESTS, value, activeCriteria, percentileFns, scoreAll, testsFor, rankOf, nearestCell };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AnalogScore = api;
})(typeof window !== "undefined" ? window : globalThis);
