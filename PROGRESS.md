# Progress — Analog MX Lite

| Phase | Status | Notes |
|---|---|---|
| 0 Setup | done | Files copied from ../analog-mx, git init, `pip install` ok, `gh` authenticated (AVIVVVVVV). POWER elevation confirmed: point CSV header says "Elevation from MERRA-2: Average for 0.5 x 0.625 degree lat/lon region (meters)". |
| 1 Pipeline | done | `build_cells.py`: 351 cells (POWER MERRA-2 grid inside Mexico, lat 22–32.5), 0 missing values. |
| 2 Scoring + targets | done | 5 criteria, percentile ranks. Plan weights: Pinacate #195/351 (top 55.6%, Moon), Cuatro Ciénegas #222/351 (top 63.2%, Mars). Directions checked (all as specified). One adjustment: Cold weight 0 for both targets (no Earth place is close to Moon/Mars cold, so it only pointed at mountains). Result: Pinacate #121/351 (top 34.5%), Cuatro Ciénegas #183/351 (top 52.1%). Below the top-10% goal; reported as-is. |
| 3 Web | done | Simplified UI; checked with headless Chrome at 1400 px and 400 px (iframe, since headless clamps windows to ≥504 px). No console errors; deep link #mars_gale/26.9,-102.1 shows score 51.4, same as validate.py. |
| 4 Publish | done | https://avivvvvvv.github.io/analog-mx-lite/ — Pages workflow green; checked in a fresh incognito headless profile. |
| 5 Texts | done | README.md, docs/submission.md (with AI declaration). |
