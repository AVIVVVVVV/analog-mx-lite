# Analog MX Lite — slide content

One section per slide. Each one has a **title**, the **text** to put on the slide (short) and **what to show**. All numbers come from the app and `pipeline/validate.py`.

---

## Slide 1 — Title
**Title:** Analog MX Lite
**Text:** Finding Moon and Mars test sites in Mexico with open NASA data
**Show:** Screenshot of the map (`docs/screenshot.png`) · NASA Space Apps Challenge 2026 · Habib
**Link:** https://avivvvvvv.github.io/analog-mx-lite/

---

## Slide 2 — The problem
**Title:** Where on Earth do we test before going to the Moon or Mars?
**Text:**
- Rovers, habitats and solar panels are tested on Earth first, in "analog" sites
- Good analogs are dry, sunny, with big temperature swings and rough ground
- Mexico has deserts and mountains close to home. Which places fit best?

**Show:** Photo or map of northern Mexico

---

## Slide 3 — Our solution
**Title:** A map that scores every place from 0 to 100
**Text:**
- Pick a target: **Moon (Mons Mouton, Artemis III candidate)** or **Mars (Gale Crater, Curiosity)**
- The map colours 351 areas of northern Mexico by how similar they are
- Move sliders to change what matters most
- Click any area to see what you could test there

**Show:** Screenshot with the heat map and the site card

---

## Slide 4 — The data (all open)
**Title:** Built only on open data
**Text:**
- **NASA POWER:** rainfall, temperature, day–night swing, sunshine and elevation
- **NASA GIBS:** map background
- **NASA fact sheets:** Moon and Mars gravity, air pressure and temperature
- **Natural Earth:** Mexico border

**Show:** The source names as plain text (don't use NASA logos)

---

## Slide 5 — How the score works
**Title:** 5 simple criteria
**Text:**

| Criterion | More like the Moon/Mars when… |
|---|---|
| Dryness | it rains less |
| Temperature swing | days and nights differ more |
| Cold | it is colder |
| Sunshine | there is more sun |
| Terrain variation | the land is more uneven |

Each area gets 0–1 per criterion (its rank in the region). The score is the weighted average × 100.

**Show:** The sliders panel

---

## Slide 6 — Results: top candidates
**Title:** Best matches
**Text:**
- **Moon:** #1 is northern Baja California (31.5°N, 115.6°W), score 82.5. It is dry, sunny, with big temperature swings and uneven terrain
- **Mars:** #1 is Baja California Sur (27.5°N, 113.1°W), score 85.2. It is very dry and sunny, with big temperature swings

**Show:** Top 10 list + the site card of the #1 Mars cell (`#mars_gale/27.5,-113.125`)

---

## Slide 7 — Validation (honest result)
**Title:** Do known analog sites show up?
**Text:**
- **El Pinacate** (Apollo astronaut training): #121 of 351, top 34.5% for the Moon
- **Cuatro Ciénegas** (gypsum dunes, Gale analog): #183 of 351, top 52.1% for Mars
- Goal was top 10%. **Not reached.** We report it as it is
- Why: yearly climate on ~55 km areas can't see lava fields or gypsum dunes

**Show:** The validation cards with the red badges

---

## Slide 8 — What Earth can't simulate
**Title:** Limits of any Earth analog
**Text:**
- Low gravity: 1.62 m/s² on the Moon, 3.73 m/s² on Mars (Earth: 9.8)
- Almost no air: a vacuum on the Moon, 6.36 mb of CO₂ on Mars
- Space radiation
- Lunar dust and Martian dust storms

**Show:** The "What Earth can't simulate" part of the site card

---

## Slide 9 — Limitations and next steps
**Title:** What's next
**Text:**
- Areas are big (~55 km): add finer elevation data
- Terrain is only a height difference: add slope
- Add soil/mineral data (e.g. gypsum) for Mars
- The full version, [Analog MX](https://avivvvvvv.github.io/analog-mx/), uses detailed elevation and puts Cuatro Ciénegas in the top 5.1%

---

## Slide 10 — Credits
**Text:**
- Habib: idea, review and demo
- Code written with the help of Claude Code (AI coding assistant), reviewed by the team
- Data: NASA POWER, NASA GIBS, NASA fact sheets, Natural Earth
- Try it: https://avivvvvvv.github.io/analog-mx-lite/
- Code: https://github.com/AVIVVVVVV/analog-mx-lite
