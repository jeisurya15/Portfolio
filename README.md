# Worlds in Progress — Jei Surya

A desktop-first spatial portfolio built with React, Three.js and Framer Motion.

## Run locally

```powershell
npm install
npm run dev
```

Open the Local URL printed by Vite. The preferred address is http://127.0.0.1:5174/#intro.

```powershell
npm run build
npm run preview
```

The production output is `dist/`. It must be served by a web server; opening index.html directly as a file will not load modules correctly.

## Explore

- Scroll or hold W/S to walk along the curved route. Arrow keys also work when focus is outside a button.
- Drag the scene to look around. Escape recenters the view.
- Guided walk visits the remaining spaces with a pause between them. Manual input takes control.
- The bottom chapter controls and Explore work provide direct navigation.
- Scene only hides the interface; Escape or Back to portfolio restores it.
- Pause animation freezes the scene, while chapter navigation remains available.
- Project actions change the illustrated 3D exhibits. Read the project opens professional details and available source links.

## Current source

`src/atlas/main.jsx` is the entry point. `App.jsx` and `style.css` define the editorial interface. `scene.js` owns the camera, input and movement. `world.js` constructs the landscape and illustrated project displays. `character.js` contains the human rig with distance-driven foot placement. `data.js` adapts the existing professional content from `src/workshop-content.js`.

All 3D geometry and interface studies are procedural. Project screens are labelled illustrative and are not screenshots of deployed applications. Résumé and project content were retained from the existing portfolio. No live backend or fabricated performance metrics have been added.

The design uses warm stone, sage and terracotta, soft daylight, an open landscape, and nine individually composed spaces. Framer Motion handles interface transitions. Reduced-motion preferences are respected. Desktop was the requested design and test scope.

## References and backup

Visual exploration: https://threeui.com/browse/tag/hero?sort=recentfetch and https://21st.dev. No paid component source or third-party artwork was copied. UI/UX Pro Max was initialized with `npx uipro-cli init --ai antigravity`; its keyboard, contrast and focus guidance informed the work.

The previous local version is preserved at `D:\Jei-Surya-Portfolio-before-redesign-2026-11-03`. The original GitHub repository was not modified. Earlier unused source modules are retained for reference; the production build uses the new atlas entry.
