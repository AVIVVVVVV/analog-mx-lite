# Analog MX Lite — plan para Claude Code

Eres el único desarrollador. El humano (Habib) solo da credenciales, revisa y graba la demo. Decide sin preguntar; pregunta **solo** si necesitas credenciales o una cuenta.

## 0. Contexto

Ya existe una versión completa en `C:\Users\habib\Desktop\analog-mx` (publicada en https://avivvvvvv.github.io/analog-mx/). Esta carpeta es una **versión más básica** del mismo proyecto:

- **La interfaz y la funcionalidad son las mismas en esencia:** selector de objetivo (Luna / Marte), mapa de calor del norte de México, sliders de pesos, top 10, validación con El Pinacate y Cuatro Ciénegas, y ficha del sitio con "What you could test here" y "What Earth can't simulate".
- **Los datos son más simples:** solo lo que reuniría alguien que no trabaja en exploración espacial. Nada de modelos de elevación, pendientes, LOLA, MOLA, Copernicus ni percentiles de relieve. Solo clima de NASA POWER (que trae también la elevación de cada punto) y unos cuantos datos básicos de la Luna y Marte de las fichas de la NASA.
- **Se elimina la sección de datos** (la lista de datasets del pie de página) y las notas científicas largas.

Todo lo que ve el usuario va en **inglés**. Los comentarios del código pueden ir en español.

**Reglas que se mantienen:**
- Nunca inventes datos ni cifras: todo número sale de los datos o de una fuente citada.
- No fuerces la validación: repórtala como salga.
- Mantén la declaración de uso de IA en los textos de entrega.

## 1. Qué se reutiliza de `../analog-mx`

Copia estos archivos (no los enlaces; esta es una carpeta y un repo independientes):

| De `C:\Users\habib\Desktop\analog-mx\` | A esta carpeta | Qué hacer después |
|---|---|---|
| `web/index.html`, `web/style.css`, `web/app.js`, `web/score.js` | `web/` | Simplificar (pasos 4–5) |
| `pipeline/fetch_power.py` | `pipeline/` | Reducir los parámetros (paso 2) |
| `data/raw/power/*.json` | `data/raw/power/` | Es caché: evita volver a descargar |
| `data/mexico.geojson` | `data/` | Igual |
| `data/known_sites.json` | `data/` | Igual |
| `.github/workflows/pages.yml` | igual | Igual |

**No copies:** `fetch_dem.py`, `features.py`, `target_terrain.py`, `data/raw/dem/`, `data/target_terrain.json`, `docs/`, `README.md`, `PROGRESS.md`.

## 2. Datos (versión básica)

**Una sola fuente científica: NASA POWER climatology** (sin login). Usa solo 4 parámetros, valor anual `ANN`:

| Parámetro POWER | Nombre en la UI | Unidad |
|---|---|---|
| `PRECTOTCORR` | Rainfall | mm/day |
| `T2M_RANGE` | Day–night temperature swing | °C |
| `T2M` | Average temperature | °C |
| `ALLSKY_SFC_SW_DWN` | Sunshine | W/m² (verifica la unidad en `parameters` de la respuesta) |

**Elevación:** cada punto de POWER trae una tercera coordenada en `geometry.coordinates` (p. ej. `[-115.625, 30.0, 240.02]`). Verifica en la respuesta o en la documentación de POWER que es la elevación del punto en metros. Si no puedes confirmarlo, quita el criterio de terreno en lugar de suponerlo.

**Celdas:** usa como celdas los puntos de la rejilla de temperatura de POWER (0.5° de latitud × 0.625° de longitud). El sol viene en una rejilla de 1°: a cada celda asígnale el punto de sol más cercano. Recorta a México con `data/mexico.geojson` (centro de la celda dentro del polígono, con shapely).

**Terreno simple, "Terrain variation":** para cada celda, la diferencia en metros entre la elevación más alta y la más baja de la celda y sus vecinas inmediatas (hasta 8 puntos POWER alrededor). Es un indicador de "zona montañosa o plana", no una pendiente.

`requirements.txt`: solo `requests` y `shapely`. No uses `rasterio`, `pandas` ni `earthaccess`.

## 3. Modelo de puntuación (`web/score.js`, reescrito y más simple)

5 criterios. Todos se puntúan igual: **`s` = rango percentil de la celda dentro de la región** (0 a 1, empates promediados), en la dirección "más parecido a la Luna/Marte":

| Criterio | Campo | Más alto si… |
|---|---|---|
| Dryness | `PRECTOTCORR` | llueve menos |
| Temperature swing | `T2M_RANGE` | la oscilación es mayor |
| Cold | `T2M` | hace más frío |
| Sunshine | `ALLSKY_SFC_SW_DWN` | hay más sol |
| Terrain variation | `terrain_var_m` | hay más diferencia de altura |

`S = 100 · Σ(w·s) / Σ(w)`. Sin σ, sin criterios "match" y sin confianza (todas las celdas tienen datos; si alguna no tiene, quítala del mapa).

**Pesos por defecto por objetivo** (el usuario los cambia con sliders; botón "Reset weights"):

| Criterio | Moon: Mons Mouton | Mars: Gale Crater |
|---|---|---|
| Dryness | 1.0 | 1.0 |
| Temperature swing | 1.0 | 1.0 |
| Cold | 0.5 | 0.75 |
| Sunshine | 0.5 | 0.25 |
| Terrain variation | 1.0 | 0.5 |

Justificación en lenguaje simple para el README: el sitio lunar es una meseta montañosa del polo sur; Gale es un cráter con planicie y una montaña central.

**"What you could test here"** (se muestra si `s ≥ 0.7`): terreno → "Rover mobility on rough terrain"; dryness → "Dust and equipment durability in very dry conditions"; temperature swing → "Thermal cycling of hardware and habitats"; sunshine → "Solar power systems".

Exporta las funciones para Node igual que en la versión completa (`module.exports` / `window.AnalogScore`), para que `validate.py` use el mismo código que el navegador.

## 4. `data/targets.json` (simple)

Por objetivo: `name`, `short_name`, `body`, una descripción de 1–2 frases en inglés sencillo, `weights` (la tabla de arriba), `facts` y `earth_cannot_simulate`.

`facts` lleva 3 o 4 datos básicos, cada uno con `source_url`. Usa solo estas fuentes, que ya están verificadas en la versión completa (`../analog-mx/data/targets.json`):
- Luna: gravedad 1.62 m/s², presión ≈3×10⁻¹⁵ bar, temperatura ecuatorial 95 K a 390 K → https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html. Región candidata de Artemis III → https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/
- Marte: gravedad 3.73 m/s², presión 6.36 mb, 95.1 % CO₂, temperatura media ≈−59 °C → https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html. Gale y el yeso → https://science.nasa.gov/earth/earth-observatory/gypsum-on-earth-and-mars-80502/

`earth_cannot_simulate`: copia las listas de la versión completa, acortadas a 4 puntos cada una.

## 5. Web: mismos componentes, menos texto

Parte de los archivos copiados y quita, sin cambiar el diseño (mismo tema oscuro, layout, colores, leyenda, marcadores y deep links `#mars_gale/26.9,-102.1`):

1. **Pie de página:** borra la lista de datasets y los párrafos de atribución. Deja solo `Built for NASA Space Apps Challenge 2026 · Source code` (enlace al repo nuevo).
2. **Atribución del mapa** (la línea pequeña de la esquina del mapa): déjala como `Basemap: NASA GIBS · Climate: NASA POWER`. Es la atribución mínima de las fuentes y no es la "sección de data".
3. **Ficha del objetivo:** nombre, descripción corta y la lista de `facts` con enlaces. Quita la tabla de criterios con valores objetivo y los `<details>` de notas.
4. **Ficha del sitio:** puntuación, rango, tabla de 3 columnas (Criterion · Here · Match 0–1 con barra), "What you could test here" y "What Earth can't simulate". Quita la columna "Target", la confianza, la línea de clima al pie, el tamaño de celda y la nota de percentiles.
5. **Sliders:** 5 en lugar de 7, con los nombres simples de la tabla del paso 3. Al cambiar de objetivo se cargan los pesos por defecto de ese objetivo.
6. **Validación y top 10:** iguales que antes.
7. Título de la página: `Analog MX Lite`.

## 6. Pipeline

```
pipeline/fetch_power.py   # 4 parámetros, caché en data/raw/power/ (ya copiada → no descarga casi nada)
pipeline/build_cells.py   # POWER + elevación + vecinos + recorte a México -> web/cells.json; copia targets.json y known_sites.json a web/
pipeline/validate.py      # corre web/score.js con Node; imprime rango y percentil de los 2 sitios conocidos
```

`cells.json`: `{"meta": {"generated", "grid", "units"}, "cells": [{"lat", "lon", "elev_m", "terrain_var_m", "PRECTOTCORR", "T2M_RANGE", "T2M", "ALLSKY_SFC_SW_DWN"}]}`

## 7. Fases (commit al terminar cada una; actualiza `PROGRESS.md` en cada commit)

| # | Fase | Terminado cuando |
|---|---|---|
| 0 | Setup: `git init`, copiar archivos (§1), `requirements.txt`, `.gitignore` (`data/raw/`, `__pycache__/`). Verifica `gh auth status` (el CLI está en `C:\Program Files\GitHub CLI`, agrégalo al PATH si hace falta) | `pip install` ok y `gh` autenticado |
| 1 | Pipeline (§2, §6) | `web/cells.json` sin valores faltantes |
| 2 | `score.js` + `targets.json` (§3, §4) | `validate.py` imprime los rangos |
| 3 | Web simplificada (§5) | funciona en `python -m http.server`, sin errores en consola, también a ~400 px de ancho (captura con Chrome headless) |
| 4 | Publicar: `gh repo create analog-mx-lite --public --source . --push`, activa Pages con `gh api -X POST repos/{owner}/analog-mx-lite/pages -f build_type=workflow`, espera el workflow | la URL abre en una ventana privada |
| 5 | Textos (§8) | listos para copiar y pegar |

**Validación:** meta top 10 % para cada sitio en su objetivo. Si no lo logra, revisa las direcciones de los criterios y ajusta los pesos **una vez** como máximo, documentándolo. Si sigue bajo, dilo en la UI y en el README con una explicación simple. La versión completa obtuvo Cuatro Ciénegas en el top 5.1 % para Marte y El Pinacate en el puesto 345 de 431 para la Luna; con datos más simples el resultado puede cambiar en cualquier dirección.

## 8. Textos (inglés, tono sencillo)

- **`README.md`** (corto): qué es, captura, cómo correrlo (3 comandos), fuentes en una línea ("Climate and elevation: NASA POWER. Basemap: NASA GIBS. Moon/Mars facts: NASA fact sheets. Mexico border: Natural Earth."), cómo se calcula la puntuación en 4–5 frases, resultados de la validación, 3 limitaciones, créditos con la declaración de IA.
- **`docs/submission.md`**: título, resumen ≤ 100 palabras, descripción, uso de datos de NASA (POWER, GIBS, fichas NASA), limitaciones y "what Earth can't simulate", guion del video de 30 s (misma estructura que la versión completa: 0–5 s problema; 5–15 s Luna y El Pinacate; 15–25 s Marte, Cuatro Ciénegas y un candidato nuevo con su ficha; 25–30 s nombre y "Open NASA data"), y la declaración de IA: *"Code written with the help of Claude Code (AI coding assistant), reviewed by the team."*

## 9. Al terminar

Avisa a Habib con la URL pública, los resultados de la validación y lo que haya quedado pendiente.
