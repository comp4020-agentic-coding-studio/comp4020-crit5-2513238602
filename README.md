# One Line

A tiny, tutorial-free browser game made for COMP4020 Crit 5. Draw one continuous barrier, release it, and keep the dog safe from the bees for five seconds. Strikers rush, flankers probe edges, and breakers punish unanchored loops. Six levels turn the stroke into a different spatial decision each time; the final score is out of 18 stars.

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

The production build is a static Vite site deployed through GitHub Pages. Pure round transitions live in `game.ts`, level contracts and route selection live in `challenge.ts`, and the canvas input, physics, collisions, runtime sensors, and feedback live in `main.ts`.
