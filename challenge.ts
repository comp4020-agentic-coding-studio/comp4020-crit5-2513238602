export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BeeRole = "striker" | "flanker" | "breaker";
export type LevelMechanic = "crossfire" | "anchors" | "channel" | "moving" | "breaker" | "waves";

export interface LevelDefinition {
  mechanic: LevelMechanic;
  dog: Point;
  hives: Point[];
  terrain: Rect[];
  anchors: Point[];
  ink: number;
  speed: number;
  spawnEvery: number;
  wind: number;
  roles: BeeRole[];
  circleCounter: "none" | "ink" | "motion" | "breaker" | "multiple-entries";
  solutions: [string, string, ...string[]];
  dogMotion?: { amplitude: number; period: number };
}

export const LEVELS: LevelDefinition[] = [
  {
    mechanic: "crossfire",
    dog: { x: 0.5, y: 0.68 },
    hives: [
      { x: 0.12, y: 0.5 },
      { x: 0.88, y: 0.5 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.44, y: 0.77, width: 0.12, height: 0.07 },
    ],
    anchors: [],
    ink: 1.15,
    speed: 0.52,
    spawnEvery: 0.25,
    wind: 0,
    roles: ["striker", "flanker", "striker", "flanker"],
    circleCounter: "none",
    solutions: ["tight loop around the dog", "grounded arch that blocks both attack lanes"],
  },
  {
    mechanic: "anchors",
    dog: { x: 0.5, y: 0.72 },
    hives: [
      { x: 0.5, y: 0.12 },
      { x: 0.86, y: 0.35 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.34, y: 0.55, width: 0.045, height: 0.29 },
      { x: 0.615, y: 0.55, width: 0.045, height: 0.29 },
    ],
    anchors: [
      { x: 0.36, y: 0.53 },
      { x: 0.64, y: 0.53 },
    ],
    ink: 0.58,
    speed: 0.5,
    spawnEvery: 0.2,
    wind: 0,
    roles: ["striker", "flanker", "striker"],
    circleCounter: "ink",
    solutions: ["straight roof between anchors", "shallow anchored dome"],
  },
  {
    mechanic: "channel",
    dog: { x: 0.5, y: 0.67 },
    hives: [
      { x: 0.08, y: 0.62 },
      { x: 0.92, y: 0.62 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.26, y: 0.44, width: 0.05, height: 0.26 },
      { x: 0.69, y: 0.44, width: 0.05, height: 0.26 },
      { x: 0.31, y: 0.44, width: 0.13, height: 0.035 },
      { x: 0.56, y: 0.44, width: 0.13, height: 0.035 },
    ],
    anchors: [
      { x: 0.3, y: 0.72 },
      { x: 0.7, y: 0.72 },
    ],
    ink: 0.78,
    speed: 0.58,
    spawnEvery: 0.18,
    wind: 0,
    roles: ["flanker", "flanker", "striker", "breaker"],
    circleCounter: "multiple-entries",
    solutions: ["single S-stroke across both side entries", "low anchored cup joining the channel posts"],
  },
  {
    mechanic: "moving",
    dog: { x: 0.5, y: 0.69 },
    hives: [
      { x: 0.1, y: 0.24 },
      { x: 0.9, y: 0.24 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.28, y: 0.76, width: 0.44, height: 0.04 },
      { x: 0.255, y: 0.5, width: 0.05, height: 0.34 },
      { x: 0.695, y: 0.5, width: 0.05, height: 0.34 },
    ],
    anchors: [
      { x: 0.28, y: 0.5 },
      { x: 0.72, y: 0.5 },
    ],
    ink: 1.1,
    speed: 0.56,
    spawnEvery: 0.18,
    wind: 0,
    roles: ["flanker", "striker", "flanker", "striker"],
    circleCounter: "motion",
    dogMotion: { amplitude: 0.17, period: 3.4 },
    solutions: ["wide roof above the full platform", "long capsule enclosing the movement lane"],
  },
  {
    mechanic: "breaker",
    dog: { x: 0.5, y: 0.7 },
    hives: [
      { x: 0.5, y: 0.1 },
      { x: 0.87, y: 0.38 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.31, y: 0.57, width: 0.055, height: 0.27 },
      { x: 0.635, y: 0.57, width: 0.055, height: 0.27 },
    ],
    anchors: [
      { x: 0.338, y: 0.55 },
      { x: 0.662, y: 0.55 },
    ],
    ink: 0.82,
    speed: 0.6,
    spawnEvery: 0.15,
    wind: 0,
    roles: ["breaker", "striker", "flanker", "breaker"],
    circleCounter: "breaker",
    solutions: ["anchored roof that resists breakers", "diagonal shield pinned from a post to the ground"],
  },
  {
    mechanic: "waves",
    dog: { x: 0.5, y: 0.68 },
    hives: [
      { x: 0.14, y: 0.18 },
      { x: 0.86, y: 0.18 },
      { x: 0.12, y: 0.58 },
      { x: 0.88, y: 0.58 },
    ],
    terrain: [
      { x: 0, y: 0.85, width: 1, height: 0.15 },
      { x: 0.23, y: 0.5, width: 0.05, height: 0.35 },
      { x: 0.72, y: 0.5, width: 0.05, height: 0.35 },
    ],
    anchors: [
      { x: 0.255, y: 0.48 },
      { x: 0.745, y: 0.48 },
    ],
    ink: 1,
    speed: 0.64,
    spawnEvery: 0.12,
    wind: 0.12,
    roles: ["flanker", "striker", "breaker", "flanker", "breaker", "striker"],
    circleCounter: "breaker",
    solutions: ["anchored canopy with grounded sides", "tight W-shield joining both posts"],
  },
];

function pointInsideRect(point: Point, rect: Rect, margin = 0): boolean {
  return (
    point.x >= rect.x - margin &&
    point.x <= rect.x + rect.width + margin &&
    point.y >= rect.y - margin &&
    point.y <= rect.y + rect.height + margin
  );
}

export function segmentHitsRect(from: Point, to: Point, rect: Rect, margin = 0): boolean {
  for (let step = 0; step <= 24; step++) {
    const ratio = step / 24;
    const point = { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
    if (pointInsideRect(point, rect, margin)) return true;
  }
  return false;
}

export function chooseRouteTarget(
  from: Point,
  goal: Point,
  terrain: Rect[],
  side: -1 | 1,
  width: number,
  height: number,
): Point {
  const margin = Math.max(18, Math.min(width, height) * 0.035);
  const blocker = terrain.find((rect) => segmentHitsRect(from, goal, rect, margin * 0.45));
  if (!blocker) return goal;

  const left = blocker.x - margin;
  const right = blocker.x + blocker.width + margin;
  const top = blocker.y - margin;
  const bottom = blocker.y + blocker.height + margin;
  const candidates = side > 0
    ? [{ x: right, y: top }, { x: right, y: bottom }, { x: left, y: top }, { x: left, y: bottom }]
    : [{ x: left, y: bottom }, { x: left, y: top }, { x: right, y: bottom }, { x: right, y: top }];
  return candidates
    .map((point, order) => ({
      point: { x: Math.max(margin, Math.min(width - margin, point.x)), y: Math.max(margin, Math.min(height - margin, point.y)) },
      score: Math.hypot(point.x - from.x, point.y - from.y) + Math.hypot(goal.x - point.x, goal.y - point.y) + order * 0.01,
    }))
    .sort((a, b) => a.score - b.score)[0].point;
}

export function projectedUnprotectedHitSeconds(level: LevelDefinition, width: number, height: number): number {
  const shortSide = Math.min(width, height);
  const dog = { x: level.dog.x * width, y: level.dog.y * height };
  const distance = Math.min(
    ...level.hives.map((hive) => Math.hypot(hive.x * width - dog.x, hive.y * height - dog.y)),
  );
  return level.spawnEvery + distance / (shortSide * level.speed);
}

export function genericCircleCanClear(level: LevelDefinition): boolean {
  const genericCircleLength = Math.PI * 2 * 0.12;
  return level.circleCounter === "none" && level.ink >= genericCircleLength;
}
