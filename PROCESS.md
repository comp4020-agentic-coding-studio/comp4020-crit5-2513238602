# Process overview

## What I built

**One Line** is a six-level browser game about drawing one continuous barrier around a dog before bees attack. The stroke is both the only control and a limited resource: releasing it starts a five-second survival round, and using less ink earns more stars. Terrain, anchors, wind, changing hive positions, clear loss/retry states, and a final score create variation without adding an instruction screen.

## The moments that mattered

### Turning the brief into a harness

Before building the canvas, I separated the round rules from its presentation and added a focused test for the contract that mattered most: a bee collision must end a round immediately, while surviving five seconds must award stars and advance. I first ran the test with `game.ts` absent and saw it fail, then implemented the smallest pure state transitions needed to make it green. I also added the no-tutorial, one-stroke, visible-ending, and real-input-loop constraints to `CLAUDE.md`. This made later visual work answer a stable game contract rather than invent rules inside rendering code. See [`66169e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/66169e3).

> “Even if the player just moves the mouse casually, the result should feel like a simple game rather than a demonstration.”

### Teaching through motion instead of copy

I removed the starter page and made the canvas the entire interaction surface. A pulsing dot traces a partial arc around the worried dog; the hive and dog establish the threat; holding draws a glowing line; releasing immediately launches bees; and the timer ring, expressions, check/cross, stars, and circular retry mark explain state without instructional prose. Six short level compositions reuse that single action while changing the spatial problem. See [`672aa6a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/672aa6a).

> “Redesign only the gameplay as a TikTok-style mini-game, like drawing a circle to save the dog.”

### Correcting the physics after playing it

The first finished desktop playtest exposed a mismatch the unit tests could not catch: a closed circle was recognised correctly, but the soft rope collapsed into a flat line under gravity. That made the result feel unrelated to the player's gesture. I changed the barrier to preserve local spans and return softly toward the drawn shape, while still allowing bee impacts to deform it. I then replayed the win and loss paths at 1920×1080 and 390×844, completed all six levels, reached the 13/18-star ending, and checked the console for warnings or errors. The resulting playtest-driven correction is included in [`672aa6a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/672aa6a).

## Verification

- `tsc --noEmit`
- `vite build`
- `vitest run` — 20 tests passed
- Desktop playthrough at 1920×1080: win, loss/retry, all six levels, final score
- Phone playthrough at 390×844: full input loop and successful round
- Browser console: no warnings or errors
