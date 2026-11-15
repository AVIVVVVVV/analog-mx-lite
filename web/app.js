/* Analog MX Lite — UI. Datos: cells.json (salida del pipeline), targets.json, known_sites.json */
(async function () {
  "use strict";
  const S = window.AnalogScore;

  const [data, targets, known] = await Promise.all(
    ["cells.json", "targets.json", "known_sites.json"].map((f) => fetch(f).then((r) => r.json()))
  );
  const cells = data.cells, meta = data.meta;
  const pct = S.percentiles(cells);
  const targetKeys = Object.keys(targets);
  const KEYS = Object.keys(S.CRITERIA);
  const state = { target: targetKeys[0], weights: null, results: null, selected: null };
  const defaultWeights = () => ({ ...targets[state.target].weights });

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (url, text) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || "source")}</a>` : "");
  const fmt = (v, d = 1) => (v === null || v === undefined ? "—" : Number(v).toFixed(d));
  const fmtLat = (c) => `${c.lat.toFixed(2)}°N, ${Math.abs(c.lon).toFixed(2)}°W`;
  // rampa secuencial tipo viridis
  const RAMP = ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"];
  function color(t) {
    t = Math.max(0, Math.min(1, t));
    const x = t * (RAMP.length - 1), i = Math.min(Math.floor(x), RAMP.length - 2), f = x - i;
    const a = parseInt(RAMP[i].slice(1), 16), b = parseInt(RAMP[i + 1].slice(1), 16);
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  function verdict(topPct) { return topPct <= 10 ? "pass" : topPct <= 25 ? "mid" : "fail"; }

  // ---------- map ----------
  const map = L.map("map", { preferCanvas: true, zoomSnap: 0.5, worldCopyJump: false }).setView([27.5, -107], 5.5);
  L.tileLayer(
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
    { maxNativeZoom: 8, maxZoom: 11, attribution: 'Basemap: <a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a> · Climate: <a href="https://power.larc.nasa.gov/">NASA POWER</a>' }
  ).addTo(map);
  const renderer = L.canvas({ padding: 0.3 });
  map.fitBounds(L.latLngBounds(cells.map((c) => [c.lat, c.lon])).pad(0.05));
  const hd = meta.grid.dlat / 2, hw = meta.grid.dlon / 2;
  const rects = cells.map((c, i) =>
    L.rectangle([[c.lat - hd, c.lon - hw], [c.lat + hd, c.lon + hw]], {
      renderer, weight: 0, fillOpacity: 0.72, color: "#fff",
    }).on("click", () => selectCell(i))
      .bindTooltip(() => `${fmtLat(c)} · score ${fmt(state.results[i].score, 0)}`, { sticky: true })
      .addTo(map)
  );
  let selRect = null;
  known.sites.forEach((s) =>
    L.marker([s.lat, s.lon], {
      icon: L.divIcon({ className: "known-marker", iconSize: [16, 16] }), zIndexOffset: 1000,
    }).bindTooltip(`<b>${esc(s.name)}</b><br>${esc(s.why)}`).on("click", () => selectCell(S.nearestCell(cells, s.lat, s.lon))).addTo(map)
  );

  // ---------- target ----------
  function setTarget(k) {
    state.target = k;
    state.weights = defaultWeights();
    renderTargetButtons(); renderTargetCard(); renderSliders(); update();
  }

  function renderTargetButtons() {
    $("target-buttons").innerHTML = targetKeys
      .map((k) => `<button data-k="${k}" class="${k === state.target ? "active" : ""}">${esc(targets[k].body)}: ${esc(targets[k].short_name || k)}</button>`)
      .join("");
    $("target-buttons").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setTarget(b.dataset.k)));
  }

  function renderTargetCard() {
    const t = targets[state.target];
    const facts = (t.facts || []).map((f) =>
      `<tr><td>${esc(f.label)}</td><td>${esc(f.value)} ${link(f.source_url)}</td></tr>`).join("");
    $("target-card").innerHTML = `
      <h3>${esc(t.name)}</h3>
      ${t.description ? `<p class="small">${esc(t.description)}</p>` : ""}
      ${facts ? `<table class="kv facts">${facts}</table>` : ""}`;
  }

  // ---------- sliders ----------
  function renderSliders() {
    $("sliders").innerHTML = KEYS.map((k) =>
      `<div class="slider"><label><span>${esc(S.CRITERIA[k].label)}</span><b id="wv-${k}">${state.weights[k].toFixed(2)}</b></label>
        <input type="range" min="0" max="2" step="0.05" value="${state.weights[k]}" data-k="${k}" aria-label="${esc(S.CRITERIA[k].label)} weight"></div>`
    ).join("");
    $("sliders").querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", () => {
        state.weights[inp.dataset.k] = parseFloat(inp.value);
        $("wv-" + inp.dataset.k).textContent = state.weights[inp.dataset.k].toFixed(2);
        scheduleUpdate();
      })
    );
  }
  $("reset").addEventListener("click", () => { state.weights = defaultWeights(); renderSliders(); update(); });

  // ---------- update ----------
  let raf = null;
  function scheduleUpdate() { if (!raf) raf = requestAnimationFrame(() => { raf = null; update(); }); }

  function update() {
    const t = targets[state.target];
    state.results = S.scoreAll(cells, state.weights, pct);
    const scores = state.results.map((r) => r.score);
    const lo = Math.min(...scores), hi = Math.max(...scores);
    rects.forEach((r, i) => r.setStyle({ fillColor: color((state.results[i].score - lo) / (hi - lo || 1)), fillOpacity: 0.72 }));
    $("legend").innerHTML = `<b>Similarity to ${esc(t.short_name || t.name)}</b>
      <div class="ramp" style="background:linear-gradient(90deg,${RAMP.join(",")})"></div>
      <div class="ends"><span>${lo.toFixed(0)}</span><span>score (0–100)</span><span>${hi.toFixed(0)}</span></div>
      <div class="small">● known analog site</div>`;

    // top 10
    const order = state.results.map((r, i) => i).sort((a, b) => state.results[b].score - state.results[a].score);
    $("top10").innerHTML = order.slice(0, 10).map((i) => {
      const r = state.results[i], c = cells[i];
      const near = known.sites.find((s) => S.nearestCell(cells, s.lat, s.lon) === i);
      return `<li data-i="${i}"><b>${r.score.toFixed(1)}</b> <span class="bar" style="width:${r.score * 0.8}px"></span>
        <span class="small">${fmtLat(c)}${near ? " · " + esc(near.name) : ""}</span></li>`;
    }).join("");
    $("top10").querySelectorAll("li").forEach((li) => li.addEventListener("click", () => selectCell(+li.dataset.i, true)));

    // validación
    let below = false;
    $("validation").innerHTML = known.sites.map((s) => {
      const i = S.nearestCell(cells, s.lat, s.lon);
      const rk = S.rankOf(state.results, i);
      const expected = state.target.startsWith(s.expected_target);
      const v = verdict(rk.topPct);
      if (expected && v !== "pass") below = true;
      return `<div class="val-site ${expected ? v : ""}" data-i="${i}">
        <div><b>${esc(s.name)}</b> ${expected ? `<span class="badge">${v === "pass" ? "TOP 10%" : v === "mid" ? "TOP 25%" : "BELOW TOP 25%"}</span>` : `<span class="small">(analog for ${esc(s.expected_target === "moon" ? "the Moon" : "Mars")}, not this target)</span>`}</div>
        <div><span class="big">#${rk.rank}</span> <span class="small">of ${rk.n} cells · top ${rk.topPct.toFixed(1)}% · score ${fmt(state.results[i].score)}</span></div>
        <div class="small">${esc(s.why)} ${link(s.source_url)}</div></div>`;
    }).join("") + `<p class="small">Rank of the cell containing each site with the current weights. Goal: known analog in the top 10% for its target.</p>`
      + (below ? `<p class="small"><b>Below the goal.</b> This Lite version only uses yearly climate and a rough height difference on a ~55 km grid. It can't see what makes these places special (lava fields and craters at El Pinacate, gypsum dunes at Cuatro Ciénegas), so the mountains and other deserts outrank them.</p>` : "");
    $("validation").querySelectorAll(".val-site").forEach((d) => d.addEventListener("click", () => selectCell(+d.dataset.i, true)));

    if (state.selected !== null) renderSite(state.selected);
  }

  // ---------- ficha del sitio ----------
  function selectCell(i, fly) {
    state.selected = i;
    if (selRect) map.removeLayer(selRect);
    const c = cells[i];
    selRect = L.rectangle([[c.lat - hd, c.lon - hw], [c.lat + hd, c.lon + hw]], { color: "#fff", weight: 2.5, fill: false, interactive: false }).addTo(map);
    if (fly) map.flyTo([c.lat, c.lon], Math.max(map.getZoom(), 7), { duration: 0.6 });
    renderSite(i);
  }

  function renderSite(i) {
    const c = cells[i], r = state.results[i], t = targets[state.target];
    const rk = S.rankOf(state.results, i);
    const near = known.sites.filter((s) => S.nearestCell(cells, s.lat, s.lon) === i);
    const rows = KEYS.map((k) => {
      const cr = S.CRITERIA[k], s = r.parts[k];
      return `<tr><td>${esc(cr.label)}</td><td class="num">${fmt(S.value(c, k), cr.digits)} ${cr.unit}</td>
        <td class="num"><span class="bar" style="width:${s * 40}px"></span> ${s.toFixed(2)}</td></tr>`;
    }).join("");
    const tests = S.testsFor(r.parts);
    $("site-content").innerHTML = `
      <div class="small">${fmtLat(c)} · elevation ${fmt(c.elev_m, 0)} m</div>
      ${near.length ? `<h3 style="margin-top:4px">${near.map((s) => esc(s.name)).join(", ")}</h3>` : ""}
      <div style="display:flex;gap:16px;align-items:flex-end;margin:8px 0">
        <div><div class="score-big">${fmt(r.score, 1)}</div><div class="small">score vs ${esc(t.short_name || t.name)}</div></div>
        <div><b>#${rk.rank}</b> <span class="small">of ${rk.n} (top ${rk.topPct.toFixed(1)}%)</span></div>
      </div>
      <table class="kv"><tr><th>Criterion</th><th>Here</th><th>Match (0–1)</th></tr>${rows}</table>
      <h3 style="margin-top:12px">What you could test here</h3>
      ${tests.length ? `<ul class="tight">${tests.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="small">No criterion reaches a match of 0.70 in this cell.</p>`}
      <h3 style="margin-top:12px">What Earth can't simulate</h3>
      <ul class="tight">${(t.earth_cannot_simulate || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    $("site-panel").hidden = false;
  }
  $("close-panel").addEventListener("click", () => {
    $("site-panel").hidden = true; state.selected = null;
    if (selRect) { map.removeLayer(selRect); selRect = null; }
  });

  // deep link: #<target_key>/<lat>,<lon>
  const [hk, hc] = decodeURIComponent(location.hash.slice(1)).split("/");
  setTarget(targets[hk] ? hk : targetKeys[0]);
  if (hc) { const [la, lo] = hc.split(",").map(Number); if (isFinite(la) && isFinite(lo)) selectCell(S.nearestCell(cells, la, lo), true); }
})().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML("afterbegin", `<div style="padding:12px;background:#f85149;color:#000">Failed to load data: ${e.message}</div>`);
});
