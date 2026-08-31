# One Line — Crit 5 harness

This COMP4020 prototype is a static HTML/CSS/TypeScript game that builds to
plain assets and deploys to GitHub Pages. The deployed interaction is what gets
marked, so every change must preserve the real pointer loop as well as the pure
game rules.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## C5 game harness

- The shipped game teaches through motion and consequence. Do not add control
  copy, a how-to modal, an instructions page, or a README substitute for one.
- The player gets one continuous stroke per attempt. New mechanics must change
  what that stroke means, not add buttons or a second control scheme.
- Rules live as pure transitions in `game.ts`; canvas physics reports events to
  them. A collision may not be decided only inside rendering code.
- A round must visibly end, and all six levels must remain completable inside
  five minutes at both marking viewports.
- Never accept a visual check in place of exercising the finished input loop.
  Run the game with mouse and touch-sized viewports and inspect the console.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
