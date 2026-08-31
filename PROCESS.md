# Process overview

## What I built

**One Line** is a six-level browser game about drawing one continuous barrier around a dog before bees attack. The stroke is both the only control and a limited resource: releasing it starts a five-second survival round, and using less ink earns more stars. Strikers, flankers, and breakers now read terrain and probe barriers; the levels demand crossfire defence, anchoring, channel closure, moving-target coverage, breaker resistance, and a final four-direction wave.

## The moments that mattered

### Turning the brief into a harness

Before building the canvas, I separated the round rules from its presentation and added a focused test for the contract that mattered most: a bee collision must end a round immediately, while surviving five seconds must award stars and advance. I first ran the test with `game.ts` absent and saw it fail, then implemented the smallest pure state transitions needed to make it green. I also added the no-tutorial, one-stroke, visible-ending, and real-input-loop constraints to `CLAUDE.md`. This made later visual work answer a stable game contract rather than invent rules inside rendering code. See [`66169e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/66169e3).

> “Even if the player just moves the mouse casually, the result should feel like a simple game rather than a demonstration.”

### Teaching through motion instead of copy

I removed the starter page and made the canvas the entire interaction surface. A pulsing dot traces a partial arc around the worried dog; the hive and dog establish the threat; holding draws a glowing line; releasing immediately launches bees; and the timer ring, expressions, check/cross, stars, and circular retry mark explain state without instructional prose. Six short level compositions reuse that single action while changing the spatial problem. See [`672aa6a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/672aa6a).

> “Redesign only the gameplay as a TikTok-style mini-game, like drawing a circle to save the dog.”

### Correcting the physics after playing it

The first finished desktop playtest exposed a mismatch the unit tests could not catch: a closed circle was recognised correctly, but the soft rope collapsed into a flat line under gravity. That made the result feel unrelated to the player's gesture. I changed the barrier to preserve local spans and return softly toward the drawn shape, while still allowing bee impacts to deform it. I then replayed the win and loss paths at 1920×1080 and 390×844, completed all six levels, reached the 13/18-star ending, and checked the console for warnings or errors. The resulting playtest-driven correction is included in [`672aa6a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/672aa6a).

### Replacing cosmetic difficulty with spatial decisions

A second critique correctly identified that direct-homing bees often missed the dog, while every environment rewarded the same large circle. I froze measurable criteria before changing code: every undefended level must lose inside three seconds, a generic circle may clear at most two levels, no bee may stay stalled for more than 0.75 seconds, and every level needs two verified solutions. The new challenge contract first failed because `challenge.ts` did not exist, then went green in [`3e1cb7f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/3e1cb7f). The AI and level rebuild landed in [`8617819`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-2513238602/commit/8617819). The first moving-platform roof still failed because flankers escaped around its sides, so I added a two-pillar chamber and reran both solutions rather than weakening the criterion. Final measured undefended loss times were 1.18–2.27 seconds; the circle cleared 2/6; all twelve desktop strategies and all six phone levels passed; maximum observed stall was 0.65 seconds.

> “If it does not meet the acceptance standards, optimise again until it does.”

## Verification

- `tsc --noEmit`
- `vite build`
- `vitest run` — 23 tests passed
- Desktop at 1920×1080: six undefended failures, twelve successful strategies, 2/6 generic-circle result
- Phone at 390×844: all six level strategies passed through the real pointer loop
- Browser console: no warnings or errors
