"""Construye web/cells.json a partir de la caché de NASA POWER (data/raw/power/).

- Celdas = puntos de la rejilla MERRA-2 de POWER (0.5° lat × 0.625° lon), los mismos de T2M.
- Elevación = 3.ª coordenada de geometry.coordinates (POWER: "Elevation from MERRA-2: Average for
  0.5 x 0.625 degree lat/lon region", en metros).
- Sol (ALLSKY_SFC_SW_DWN) viene en rejilla de 1°: se asigna el punto más cercano.
- terrain_var_m = elevación máx − mín entre la celda y sus hasta 8 vecinos POWER.
- Recorte: centro de la celda dentro de data/mexico.geojson (shapely).
También copia targets.json y known_sites.json a web/.
"""
import json
import math
import shutil
from datetime import date
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "power"
DLAT, DLON = 0.5, 0.625
GRID_PARAMS = ["T2M", "T2M_RANGE", "PRECTOTCORR"]  # rejilla MERRA-2
SUN = "ALLSKY_SFC_SW_DWN"  # rejilla de 1°
FILL = -999.0


def load(param):
    """{(lat, lon): (ANN, elev)} con todos los bloques del parámetro (sin duplicados)."""
    pts = {}
    for f in sorted(RAW.glob(f"{param}_*.json")):
        # evitar que T2M_* incluya T2M_RANGE
        if f.stem.rsplit("_", 2)[0] != param:
            continue
        for feat in json.loads(f.read_text())["features"]:
            lon, lat, elev = feat["geometry"]["coordinates"]
            ann = feat["properties"]["parameter"][param]["ANN"]
            pts[(round(lat, 4), round(lon, 4))] = (ann, elev)
    return pts


def key(lat, lon):
    return (round(lat / DLAT), round(lon / DLON))


def main():
    grids = {p: load(p) for p in GRID_PARAMS}
    sun = load(SUN)
    base = grids["T2M"]

    # Elevación de todos los puntos POWER de la rejilla (dentro o fuera de México) para los vecinos
    elev = {key(lat, lon): e for (lat, lon), (_, e) in base.items()}

    geo = json.loads((ROOT / "data" / "mexico.geojson").read_text())
    feats = geo["features"] if geo.get("type") == "FeatureCollection" else [geo]
    mexico = unary_union([shape(f["geometry"]) for f in feats])

    sun_pts = [(lat, lon, v) for (lat, lon), (v, _) in sun.items() if v != FILL]

    cells, dropped = [], 0
    for (lat, lon), (t2m, e) in sorted(base.items()):
        if not mexico.contains(Point(lon, lat)):
            continue
        vals = {p: grids[p].get((lat, lon), (None, None))[0] for p in GRID_PARAMS}
        # punto de sol más cercano (distancia con corrección por coseno de la latitud)
        cl = math.cos(math.radians(lat))
        s = min(sun_pts, key=lambda q: (q[0] - lat) ** 2 + ((q[1] - lon) * cl) ** 2)
        vals[SUN] = s[2]
        ki, kj = key(lat, lon)
        neigh = [elev[(ki + a, kj + b)] for a in (-1, 0, 1) for b in (-1, 0, 1) if (ki + a, kj + b) in elev]
        if any(v is None or v == FILL for v in vals.values()) or e is None or len(neigh) < 2:
            dropped += 1
            continue
        cells.append({
            "lat": lat, "lon": lon, "elev_m": round(e, 1),
            "terrain_var_m": round(max(neigh) - min(neigh), 1),
            "PRECTOTCORR": vals["PRECTOTCORR"], "T2M_RANGE": vals["T2M_RANGE"],
            "T2M": vals["T2M"], SUN: vals[SUN],
        })

    meta = {
        "generated": date.today().isoformat(),
        "grid": {"dlat": DLAT, "dlon": DLON,
                 "note": "NASA POWER MERRA-2 grid points; sunshine from nearest 1° POWER point"},
        "units": {"elev_m": "m", "terrain_var_m": "m", "PRECTOTCORR": "mm/day", "T2M_RANGE": "°C",
                  "T2M": "°C", SUN: "W/m²"},
    }
    out = ROOT / "web" / "cells.json"
    out.write_text(json.dumps({"meta": meta, "cells": cells}, separators=(",", ":"), ensure_ascii=False),
                   encoding="utf-8")
    for name in ["targets.json", "known_sites.json"]:
        src = ROOT / "data" / name
        if src.exists():
            shutil.copy(src, ROOT / "web" / name)

    fields = ["elev_m", "terrain_var_m", "PRECTOTCORR", "T2M_RANGE", "T2M", SUN]
    missing = {f: sum(c.get(f) is None for c in cells) for f in fields}
    print(f"wrote {out}: {len(cells)} cells, {dropped} dropped for missing data; missing per field: {missing}")
    for f in fields:
        xs = [c[f] for c in cells]
        print(f"  {f:<18} min {min(xs):8.2f}  max {max(xs):8.2f}")


if __name__ == "__main__":
    main()
