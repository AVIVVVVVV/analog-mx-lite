# Analog MX Lite — Space Apps 2026 submission text

## Title
Analog MX Lite: finding Moon and Mars test sites in Mexico with open NASA climate data

## Short summary (≤ 100 words)
Analog MX Lite is an interactive map that scores 351 cells of northern Mexico from 0 to 100 for how much each one is like a future landing site: the Mons Mouton plateau near the Moon's south pole (Artemis III candidate) or Gale Crater on Mars. It only uses NASA POWER climate and elevation data. Five criteria count: dryness, day–night temperature swing, cold, sunshine and terrain variation. Users move weight sliders, see the top 10 cells, check two known analog sites and read what each place can, and cannot, test.

## Project description

**What it does.** Pick a target (Moon or Mars) and a heat map of northern Mexico shows how similar each cell is, from 0 to 100. Five sliders change how much each criterion counts, and the map updates right away. Click a cell to see its score, its rank, and its values for each criterion with a 0–1 match bar. The card also lists "What you could test here" (rover mobility, dust, thermal cycling, solar power) and "What Earth can't simulate" (gravity, vacuum or thin CO₂ air, radiation, dust).

**How it works.** A short Python script reads NASA POWER annual climatology (rainfall, daily temperature range, average temperature, sunshine). Each POWER grid point also comes with its elevation. Each cell is one POWER point (0.5° × 0.625°). "Terrain variation" is the height difference between a cell and its neighbours. Each criterion is scored by the cell's rank within the region, toward the Moon/Mars direction. The final score is a weighted average. Everything runs in the browser on a static website.

**Validation.** We check two places NASA has already used as analogs, with the default weights:
- El Pinacate (Apollo astronaut training) ranks **#121 of 351 (top 34.5%)** for the Moon target.
- Cuatro Ciénegas (gypsum dunes, a Gale Crater analog) ranks **#183 of 351 (top 52.1%)** for the Mars target.

Our goal was the top 10%, and neither site reaches it. With the plan's first weights they ranked #195 and #222. We made one documented change: the "Cold" weight is 0 for both targets, because no Earth place is close to lunar or Martian cold, so this criterion only pointed at the mountains. We report the result as it came out. Climate averaged over ~55 km cells can't see lava fields, craters or gypsum dunes. The full Analog MX version, which uses detailed elevation models, put Cuatro Ciénegas in the top 5.1%. That shows how much the result depends on the data.

**Benefits.** A simple, transparent starting point to shortlist field-test sites close to home, built only from open data that anyone can download.

## Use of NASA data
- **NASA POWER** climatology API (annual values): precipitation (PRECTOTCORR), daily temperature range (T2M_RANGE), mean temperature (T2M), surface solar irradiance (ALLSKY_SFC_SW_DWN), and the MERRA-2 grid elevation that comes with each point.
- **NASA GIBS** Blue Marble shaded relief: map basemap.
- **NASA fact sheets and articles** cited in the target cards: NSSDC Moon and Mars fact sheets, the Artemis III candidate regions announcement (Oct 2024), and NASA Earth Observatory articles on El Pinacate and on gypsum at Cuatro Ciénegas and Gale.
- Other: Natural Earth country borders to clip the grid to Mexico.

## Limitations and what Earth can't simulate
- Cells are about 55 km wide, so small features such as dune fields and craters disappear.
- "Terrain variation" is a height difference between grid points, not a slope.
- Criteria are relative to northern Mexico: no place on Earth reaches lunar or Martian temperatures or pressures.
- Earth can't simulate: 1/6 g (Moon) and ~3/8 g (Mars) gravity, hard vacuum or a thin ~6 mbar CO₂ atmosphere, the space radiation environment, sharp charged lunar dust and Martian global dust storms.

## 30-second demo video script

| Time | On screen | Narration (English) | Subtitles |
|---|---|---|---|
| 0–5 s | Map of northern Mexico, cursor idle | "Before we send a rover to the Moon or Mars, where on Earth do we test it?" | Before we send a rover to the Moon or Mars, where on Earth do we test it? |
| 5–15 s | Click **Moon: Mons Mouton**, heat map updates; open El Pinacate's validation card (#121, top 34.5%); click the #1 cell in northern Baja California | "Pick the Artemis III Mons Mouton plateau. Analog MX Lite scores every cell using NASA climate data. El Pinacate trained Apollo crews, but here it ranks in the top 35 percent. The dry mountains of Baja California rank first." | Mons Mouton (Artemis III) vs. every cell. El Pinacate: top 35%. Baja mountains rank #1. |
| 15–25 s | Click **Mars: Gale Crater**; Cuatro Ciénegas card (#183); then click the #1 cell in Baja California Sur (27.5°N, 113.1°W; deep link `#mars_gale/27.5,-113.125`); its card shows "What you could test here" and "What Earth can't simulate" | "Switch to Gale Crater. Climate alone misses Cuatro Ciénegas's gypsum dunes, and the tool says so. Its top new candidate is in Baja California Sur: very dry, sunny, with big temperature swings. And it says what Earth can't simulate." | Gale Crater: climate alone misses Cuatro Ciénegas. New candidate: Baja California Sur. What you can test, and what Earth can't. |
| 25–30 s | Zoom out, title "Analog MX Lite" | "Analog MX Lite. Built on open NASA data." | Analog MX Lite · Open NASA data |

## Use of AI
Code written with the help of Claude Code (AI coding assistant), reviewed by the team. All data values come from NASA POWER or the cited NASA sources, or are computed by the open-source pipeline in this repository. No AI-generated images or data are used. The project does not use NASA logos or imply NASA endorsement.
