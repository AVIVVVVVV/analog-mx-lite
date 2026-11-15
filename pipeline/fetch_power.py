"""Download NASA POWER climatology (regional, one parameter per request) for northern Mexico.

Cached under data/raw/power/<PARAM>_<lat0>_<lon0>.json; re-running skips cached blocks.
"""
import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "power"
OUT.mkdir(parents=True, exist_ok=True)

URL = "https://power.larc.nasa.gov/api/temporal/climatology/regional"
PARAMS = ["T2M", "T2M_RANGE", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"]
LAT_MIN, LAT_MAX = 22, 33
LON_MIN, LON_MAX = -117, -98
BLOCK = 4


def blocks():
    lat = LAT_MIN
    while lat < LAT_MAX:
        lon = LON_MIN
        while lon < LON_MAX:
            yield lat, min(lat + BLOCK, LAT_MAX), lon, min(lon + BLOCK, LON_MAX)
            lon += BLOCK
        lat += BLOCK


def main():
    for p in PARAMS:
        for la0, la1, lo0, lo1 in blocks():
            f = OUT / f"{p}_{la0}_{lo0}.json"
            if f.exists():
                continue
            q = {"latitude-min": la0, "latitude-max": la1, "longitude-min": lo0, "longitude-max": lo1,
                 "parameters": p, "community": "SB", "format": "JSON"}
            for attempt in range(4):
                try:
                    r = requests.get(URL, params=q, timeout=180)
                    if r.status_code == 200 and "features" in r.json():
                        f.write_text(r.text)
                        print(f"ok {f.name} ({len(r.json()['features'])} pts)", flush=True)
                        break
                    print(f"bad {f.name}: {r.status_code} {r.text[:300]}", flush=True)
                except Exception as e:  # network hiccup
                    print(f"err {f.name}: {e}", flush=True)
                time.sleep(10 * (attempt + 1))
            time.sleep(2.5)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
