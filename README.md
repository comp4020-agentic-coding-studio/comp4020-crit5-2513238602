# One Line

**[▶ Play One Line now — no download required](https://comp4020-agentic-coding-studio.github.io/comp4020-crit5-2513238602/)**

A tiny, tutorial-free browser game made for COMP4020 Crit 5. Draw one continuous barrier and keep the dog safe from the bees. Six levels turn the same one-stroke action into different spatial challenges, with a final score out of 18 stars.

## How to play

1. **Press and drag** with a mouse, trackpad, or finger to draw one continuous protective line.
2. **Release** to lock in the barrier and start the bee attack.
3. Keep every bee away from the dog for **five seconds** to clear the level.
4. After a win or loss, **click or tap anywhere** to continue or retry.
5. Use less ink to earn more stars: every cleared level awards 1–3 stars.

The pale bar at the top shows the ink remaining, while the circular timer appears during an attack. Terrain can support a barrier, and glowing gold points can anchor it. Yellow strikers charge directly, small pale flankers probe around edges, and large red breakers punish unsupported lines. A simple circle works early, but later levels require roofs, anchored shields, channel blocks, and protection for a moving dog.

### Goal

Clear all six levels and aim for **18/18 stars**. You get only one line per attempt, so its position, shape, and length all matter.

**[Launch the game →](https://comp4020-agentic-coding-studio.github.io/comp4020-crit5-2513238602/)**

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
