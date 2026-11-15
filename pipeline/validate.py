"""Imprime el rango y el percentil de los sitios conocidos con los pesos por defecto de cada objetivo.

Corre web/score.js con Node, así la validación usa exactamente el mismo código que la web.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

JS = r"""
const root = process.argv[1];
const S = require(root + '/web/score.js');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(root + '/web/cells.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync(root + '/data/targets.json', 'utf8'));
const sites = JSON.parse(fs.readFileSync(root + '/data/known_sites.json', 'utf8'));
const pct = S.percentiles(data.cells);
const out = [];
for (const site of sites.sites) {
  for (const [tk, t] of Object.entries(targets)) {
    const res = S.scoreAll(data.cells, t.weights, pct);
    const i = S.nearestCell(data.cells, site.lat, site.lon);
    const r = S.rankOf(res, i);
    out.push({site: site.name, expected: site.expected_target, target: tk, cell: [data.cells[i].lat, data.cells[i].lon],
      score: res[i].score, rank: r.rank, n: r.n, top_pct: r.topPct, parts: res[i].parts});
  }
}
console.log(JSON.stringify(out));
"""


def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    res = subprocess.run(["node", "-e", JS, str(ROOT).replace("\\", "/")], capture_output=True, text=True,
                         encoding="utf-8", check=True)
    rows = json.loads(res.stdout)
    for r in rows:
        star = "  <== expected" if r["target"].startswith(r["expected"]) else ""
        print(f"{r['site']:<28} vs {r['target']:<18} cell {r['cell']}  score {r['score']:.1f}  "
              f"rank {r['rank']}/{r['n']}  top {r['top_pct']:.1f}%{star}")
        if star:
            print("    parts:", {k: round(v, 2) for k, v in r["parts"].items()})
    (ROOT / "data" / "validation.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
