import { describe, expect, it } from "vitest";
import { continueGame, createGameState, releaseStroke, tickRound } from "../game.ts";

describe("one-line dog rescue rules", () => {
  it("ends the round immediately when a bee reaches the dog", () => {
    const playing = releaseStroke(createGameState());
    const lost = tickRound(playing, { deltaMs: 16, beeHit: true, inkUsed: 180, inkLimit: 400 });

    expect(lost.phase).toBe("lost");
    expect(lost.elapsedMs).toBe(0);

    const frozen = tickRound(lost, { deltaMs: 5000, beeHit: false, inkUsed: 180, inkLimit: 400 });
    expect(frozen).toEqual(lost);
  });

  it("survives for five seconds, awards ink stars, and advances", () => {
    const playing = releaseStroke(createGameState());
    const won = tickRound(playing, { deltaMs: 5000, beeHit: false, inkUsed: 180, inkLimit: 400 });

    expect(won.phase).toBe("won");
    expect(won.stars).toEqual([3]);

    const next = continueGame(won);
    expect(next.phase).toBe("drawing");
    expect(next.levelIndex).toBe(1);
  });

  it("retries the current level after a loss and finishes after level six", () => {
    let state = createGameState();

    state = tickRound(releaseStroke(state), { deltaMs: 1, beeHit: true, inkUsed: 200, inkLimit: 400 });
    expect(continueGame(state).levelIndex).toBe(0);

    state = createGameState(5);
    state = tickRound(releaseStroke(state), { deltaMs: 5000, beeHit: false, inkUsed: 300, inkLimit: 500 });
    expect(state.phase).toBe("complete");
    expect(continueGame(state)).toEqual(createGameState());
  });
});
