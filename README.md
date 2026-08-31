# One Line

A tiny, tutorial-free browser game made for COMP4020 Crit 5. Draw one continuous barrier, release it, and keep the dog safe from the bees for five seconds. Six levels vary the terrain, anchors, hive directions, wind, and available ink; the final score is out of 18 stars.

## Run locally

```sh
pnpm install
pnpm dev
```

## Verify

```sh
pnpm check
pnpm check:evidence
```

The production build is a static Vite site deployed through GitHub Pages. The rules are pure transitions in `game.ts`; the canvas input, drawing, collisions, and feedback live in `main.ts`.
