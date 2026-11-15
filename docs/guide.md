# Analog MX Lite, explained simply

## 1. What is it?

Before NASA sends a rover or a habitat to the Moon or Mars, it tests it on Earth in places that look and feel a bit similar. These places are called **analogs**. Analog MX Lite is a web map that answers one question:

> *Which places in northern Mexico are most like a Moon or Mars landing site?*

Try it: https://avivvvvvv.github.io/analog-mx-lite/

## 2. How do I use it?

1. **Pick a target** at the top: *Moon: Mons Mouton* or *Mars: Gale Crater*.
2. **Look at the map.** Yellow areas are the most similar and purple areas the least.
3. **Move the sliders** to decide how much each criterion counts. *Reset weights* goes back to the defaults.
4. **Check the Top 10** list to jump to the best areas.
5. **Click any area** to open its card, which shows:
   - its score (0–100) and its rank
   - its real values (rain, temperature, sun…) and how well each one matches (0–1)
   - **What you could test here** (for example solar panels or rover driving)
   - **What Earth can't simulate** (for example low gravity)

You can share a link to a specific place, like `…/analog-mx-lite/#mars_gale/26.9,-102.1`.

## 3. Where does the data come from?

| What | Source |
|---|---|
| Rain, temperature, day–night swing, sunshine, elevation | NASA POWER (yearly averages, 2001–2025) |
| Map background | NASA GIBS |
| Moon and Mars facts (gravity, air, temperature) | NASA fact sheets |
| Mexico border | Natural Earth |

Nothing is made up. Every number comes from these sources.

## 4. How is the score calculated?

The map is split into **351 squares**, about 55 km wide, each matching one NASA POWER data point.

Each square gets 5 marks from 0 to 1:

| Criterion | Gets a high mark when… |
|---|---|
| Dryness | it rains very little |
| Temperature swing | days are much hotter than nights |
| Cold | the average temperature is low |
| Sunshine | it gets a lot of sun |
| Terrain variation | there is a big height difference with the squares around it |

A mark is just **the square's position in a ranking**. For example, 0.9 for dryness means that square is drier than about 90% of the others.

The **score** is the average of the 5 marks, weighted by the sliders, times 100.

**Default weights:** the Moon site is a mountainous plateau, so terrain counts fully. Gale Crater is mostly a flat crater floor, so terrain counts half. **Cold** starts at 0 for both, because no place on Earth gets anywhere near as cold as the Moon or Mars, so it only pointed at the mountains.

## 5. Does it work? (validation)

We checked two places NASA has already used as analogs:

| Place | Why it's known | Result |
|---|---|---|
| El Pinacate, Sonora | Apollo astronauts trained there | #121 of 351 (top 34.5%) for the Moon |
| Cuatro Ciénegas, Coahuila | Gypsum dunes, like Gale Crater | #183 of 351 (top 52.1%) for Mars |

The goal was the **top 10%**, and **we didn't reach it**. We say so openly in the app. The data is too coarse to "see" lava fields or gypsum dunes, which are what make those places special. The full version of the project, which uses detailed elevation data, did much better for Cuatro Ciénegas (top 5.1%).

## 6. Limitations

- Squares are big (~55 km), so small features disappear.
- "Terrain variation" is only a height difference, not a real slope.
- Scores are relative: no place on Earth is truly like the Moon or Mars.

## 7. How is the project built? (for developers)

```
pipeline/fetch_power.py   → downloads NASA POWER data (cached in data/raw/power/)
pipeline/build_cells.py   → turns it into web/cells.json (351 squares)
pipeline/validate.py      → prints the rank of the two known sites
web/score.js              → the scoring math (same file used by the website and validate.py)
web/app.js                → the map and the interface
data/targets.json         → Moon/Mars description, facts, default weights
```

To run it locally:

```
pip install -r requirements.txt
python pipeline/build_cells.py
python -m http.server -d web 8000
```

Each push to `main` publishes the `web/` folder to GitHub Pages automatically.

## 8. Credits

- **Habib**: idea, review and demo
- Code written with the help of Claude Code (AI coding assistant), reviewed by the team
- Data: NASA POWER, NASA GIBS, NASA fact sheets, Natural Earth. Map library: Leaflet
