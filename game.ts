export const LEVEL_COUNT = 6;
export const SURVIVAL_MS = 5000;

export type GamePhase = "drawing" | "surviving" | "won" | "lost" | "complete";

export interface GameState {
  phase: GamePhase;
  levelIndex: number;
  elapsedMs: number;
  stars: number[];
}

export interface RoundTick {
  deltaMs: number;
  beeHit: boolean;
  inkUsed: number;
  inkLimit: number;
}

export function createGameState(levelIndex = 0, stars: number[] = []): GameState {
  return {
    phase: "drawing",
    levelIndex,
    elapsedMs: 0,
    stars: [...stars],
  };
}

export function releaseStroke(state: GameState): GameState {
  if (state.phase !== "drawing") return state;
  return { ...state, phase: "surviving", elapsedMs: 0 };
}

export function starRating(inkUsed: number, inkLimit: number): number {
  if (inkLimit <= 0) return 1;
  const remaining = Math.max(0, 1 - inkUsed / inkLimit);
  return 1 + Number(remaining >= 0.25) + Number(remaining >= 0.45);
}

export function tickRound(state: GameState, tick: RoundTick): GameState {
  if (state.phase !== "surviving") return state;
  if (tick.beeHit) return { ...state, phase: "lost" };

  const elapsedMs = Math.min(SURVIVAL_MS, state.elapsedMs + Math.max(0, tick.deltaMs));
  if (elapsedMs < SURVIVAL_MS) return { ...state, elapsedMs };

  const stars = [...state.stars];
  stars[state.levelIndex] = starRating(tick.inkUsed, tick.inkLimit);
  return {
    ...state,
    elapsedMs,
    stars,
    phase: state.levelIndex === LEVEL_COUNT - 1 ? "complete" : "won",
  };
}

export function continueGame(state: GameState): GameState {
  if (state.phase === "lost") return createGameState(state.levelIndex, state.stars);
  if (state.phase === "won") return createGameState(state.levelIndex + 1, state.stars);
  if (state.phase === "complete") return createGameState();
  return state;
}
