import {
  continueGame,
  createGameState,
  LEVEL_COUNT,
  releaseStroke,
  SURVIVAL_MS,
  tickRound,
  type GameState,
} from "./game.ts";

const canvasElement = document.querySelector<HTMLCanvasElement>("#game");
if (!canvasElement) throw new Error("missing #game canvas");
const canvas: HTMLCanvasElement = canvasElement;
const ink = canvas.getContext("2d");
if (!ink) throw new Error("2d context unavailable");
const draw = ink;

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RopePoint extends Point {
  oldX: number;
  oldY: number;
  restX: number;
  restY: number;
  pinned: boolean;
}

interface Barrier {
  points: RopePoint[];
  lengths: number[];
  braces: Array<{ a: number; b: number; length: number }>;
  closed: boolean;
  closingLength: number;
}

interface Bee extends Point {
  vx: number;
  vy: number;
  phase: number;
}

interface LevelDefinition {
  dog: Point;
  hives: Point[];
  terrain: Rect[];
  anchors: Point[];
  ink: number;
  speed: number;
  spawnEvery: number;
  wind: number;
}

interface LevelRuntime {
  dog: Point;
  hives: Point[];
  terrain: Rect[];
  anchors: Point[];
  inkLimit: number;
  beeSpeed: number;
  spawnEvery: number;
  wind: number;
}

const LEVELS: LevelDefinition[] = [
  {
    dog: { x: 0.38, y: 0.72 },
    hives: [{ x: 0.82, y: 0.34 }],
    terrain: [{ x: 0, y: 0.82, width: 1, height: 0.18 }],
    anchors: [],
    ink: 1.28,
    speed: 0.82,
    spawnEvery: 0.72,
    wind: 0,
  },
  {
    dog: { x: 0.5, y: 0.73 },
    hives: [{ x: 0.5, y: 0.14 }],
    terrain: [
      { x: 0, y: 0.83, width: 1, height: 0.17 },
      { x: 0.08, y: 0.47, width: 0.3, height: 0.035 },
      { x: 0.62, y: 0.47, width: 0.3, height: 0.035 },
    ],
    anchors: [
      { x: 0.37, y: 0.46 },
      { x: 0.63, y: 0.46 },
    ],
    ink: 1.16,
    speed: 0.9,
    spawnEvery: 0.64,
    wind: 0,
  },
  {
    dog: { x: 0.27, y: 0.69 },
    hives: [{ x: 0.84, y: 0.29 }],
    terrain: [
      { x: 0, y: 0.83, width: 1, height: 0.17 },
      { x: 0.5, y: 0.58, width: 0.055, height: 0.25 },
    ],
    anchors: [{ x: 0.53, y: 0.56 }],
    ink: 1.05,
    speed: 0.96,
    spawnEvery: 0.58,
    wind: 0,
  },
  {
    dog: { x: 0.69, y: 0.72 },
    hives: [{ x: 0.15, y: 0.31 }],
    terrain: [
      { x: 0, y: 0.83, width: 1, height: 0.17 },
      { x: 0.44, y: 0.36, width: 0.045, height: 0.47 },
    ],
    anchors: [{ x: 0.46, y: 0.34 }],
    ink: 1.25,
    speed: 1,
    spawnEvery: 0.54,
    wind: 0.34,
  },
  {
    dog: { x: 0.5, y: 0.71 },
    hives: [
      { x: 0.13, y: 0.31 },
      { x: 0.87, y: 0.31 },
    ],
    terrain: [{ x: 0, y: 0.83, width: 1, height: 0.17 }],
    anchors: [
      { x: 0.28, y: 0.48 },
      { x: 0.72, y: 0.48 },
    ],
    ink: 1.48,
    speed: 1.06,
    spawnEvery: 0.48,
    wind: 0,
  },
  {
    dog: { x: 0.5, y: 0.7 },
    hives: [
      { x: 0.16, y: 0.18 },
      { x: 0.84, y: 0.18 },
    ],
    terrain: [
      { x: 0, y: 0.84, width: 1, height: 0.16 },
      { x: 0.23, y: 0.55, width: 0.05, height: 0.29 },
      { x: 0.72, y: 0.55, width: 0.05, height: 0.29 },
    ],
    anchors: [
      { x: 0.25, y: 0.53 },
      { x: 0.75, y: 0.53 },
    ],
    ink: 1.38,
    speed: 1.14,
    spawnEvery: 0.4,
    wind: 0.2,
  },
];

let width = 1;
let height = 1;
let dpr = 1;
let gameState: GameState = createGameState();
let level = makeLevel(0);
let rawStroke: Point[] = [];
let barrier: Barrier | null = null;
let bees: Bee[] = [];
let isDrawing = false;
let inkUsed = 0;
let spawnClock = 0;
let hiveCursor = 0;
let lastFrameAt = 0;
let accumulator = 0;
let audio: AudioContext | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function makeLevel(index: number): LevelRuntime {
  const source = LEVELS[index] ?? LEVELS[0];
  const shortSide = Math.min(width, height);
  return {
    dog: { x: source.dog.x * width, y: source.dog.y * height },
    hives: source.hives.map((point) => ({ x: point.x * width, y: point.y * height })),
    terrain: source.terrain.map((rect) => ({
      x: rect.x * width,
      y: rect.y * height,
      width: rect.width * width,
      height: rect.height * height,
    })),
    anchors: source.anchors.map((point) => ({ x: point.x * width, y: point.y * height })),
    inkLimit: source.ink * shortSide,
    beeSpeed: (72 + shortSide * 0.13) * source.speed,
    spawnEvery: source.spawnEvery,
    wind: source.wind * shortSide,
  };
}

function resetLevel(): void {
  level = makeLevel(gameState.levelIndex);
  rawStroke = [];
  barrier = null;
  bees = [];
  isDrawing = false;
  inkUsed = 0;
  spawnClock = 0;
  hiveCursor = 0;
}

function resize(): void {
  const nextWidth = Math.max(1, canvas.clientWidth);
  const nextHeight = Math.max(1, canvas.clientHeight);
  if (nextWidth === width && nextHeight === height) return;
  width = nextWidth;
  height = nextHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  draw.setTransform(dpr, 0, 0, dpr, 0, 0);
  resetLevel();
}

function pointerPosition(event: PointerEvent): Point {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: clamp(event.clientX - bounds.left, 0, bounds.width),
    y: clamp(event.clientY - bounds.top, 0, bounds.height),
  };
}

function ensureAudio(): AudioContext {
  if (!audio) audio = new AudioContext();
  void audio.resume();
  return audio;
}

function tone(frequency: number, duration: number, volume: number, type: OscillatorType = "sine"): void {
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function pointNearSupport(point: Point): boolean {
  const threshold = Math.max(18, Math.min(width, height) * 0.035);
  if (point.x < threshold || point.x > width - threshold || point.y < threshold || point.y > height - threshold) return true;
  if (level.anchors.some((anchor) => distance(point, anchor) < threshold * 1.35)) return true;
  return level.terrain.some((rect) => {
    const insideX = point.x >= rect.x - threshold && point.x <= rect.x + rect.width + threshold;
    const insideY = point.y >= rect.y - threshold && point.y <= rect.y + rect.height + threshold;
    if (!insideX || !insideY) return false;
    const edgeDistance = Math.min(
      Math.abs(point.x - rect.x),
      Math.abs(point.x - (rect.x + rect.width)),
      Math.abs(point.y - rect.y),
      Math.abs(point.y - (rect.y + rect.height)),
    );
    return edgeDistance < threshold;
  });
}

function buildBarrier(points: Point[]): Barrier | null {
  if (points.length < 2) return null;
  const ropePoints: RopePoint[] = points.map((point, index) => ({
    x: point.x,
    y: point.y,
    oldX: point.x,
    oldY: point.y,
    restX: point.x,
    restY: point.y,
    pinned: (index === 0 || index === points.length - 1) && pointNearSupport(point),
  }));
  const lengths: number[] = [];
  for (let i = 1; i < ropePoints.length; i++) lengths.push(distance(ropePoints[i - 1], ropePoints[i]));
  const closingLength = distance(ropePoints[0], ropePoints[ropePoints.length - 1]);
  const closed = ropePoints.length > 8 && closingLength < Math.max(28, Math.min(width, height) * 0.07);
  const braces: Barrier["braces"] = [];
  const braceSpan = 4;
  const braceCount = closed ? ropePoints.length : Math.max(0, ropePoints.length - braceSpan);
  for (let index = 0; index < braceCount; index++) {
    const other = (index + braceSpan) % ropePoints.length;
    braces.push({ a: index, b: other, length: distance(ropePoints[index], ropePoints[other]) });
  }
  return { points: ropePoints, lengths, braces, closed, closingLength };
}

function appendStroke(target: Point): void {
  const previous = rawStroke.at(-1);
  if (!previous) {
    rawStroke.push(target);
    return;
  }
  const segmentLength = distance(previous, target);
  if (segmentLength < 3 || inkUsed >= level.inkLimit) return;
  const allowed = Math.min(segmentLength, level.inkLimit - inkUsed);
  const steps = Math.max(1, Math.ceil(allowed / 9));
  for (let step = 1; step <= steps; step++) {
    const travelled = Math.min(allowed, (step / steps) * allowed);
    const ratio = travelled / segmentLength;
    rawStroke.push({
      x: previous.x + (target.x - previous.x) * ratio,
      y: previous.y + (target.y - previous.y) * ratio,
    });
  }
  inkUsed += allowed;
}

function constrainPair(a: RopePoint, b: RopePoint, targetLength: number): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const current = Math.hypot(dx, dy) || 0.0001;
  const correction = (current - targetLength) / current;
  if (!a.pinned && !b.pinned) {
    a.x += dx * correction * 0.5;
    a.y += dy * correction * 0.5;
    b.x -= dx * correction * 0.5;
    b.y -= dy * correction * 0.5;
  } else if (!a.pinned) {
    a.x += dx * correction;
    a.y += dy * correction;
  } else if (!b.pinned) {
    b.x -= dx * correction;
    b.y -= dy * correction;
  }
}

function resolvePointTerrain(point: RopePoint): void {
  const radius = Math.max(5, Math.min(width, height) * 0.012);
  point.x = clamp(point.x, radius, width - radius);
  point.y = clamp(point.y, radius, height - radius);
  for (const rect of level.terrain) {
    const left = rect.x - radius;
    const right = rect.x + rect.width + radius;
    const top = rect.y - radius;
    const bottom = rect.y + rect.height + radius;
    if (point.x <= left || point.x >= right || point.y <= top || point.y >= bottom) continue;
    const distances = [point.x - left, right - point.x, point.y - top, bottom - point.y];
    const nearest = distances.indexOf(Math.min(...distances));
    if (nearest === 0) point.x = left;
    else if (nearest === 1) point.x = right;
    else if (nearest === 2) point.y = top;
    else point.y = bottom;
  }
}

function updateBarrier(dt: number): void {
  if (!barrier) return;
  const gravity = Math.min(width, height) * 0.34;
  const shapeReturn = 1 - Math.exp(-18 * dt);
  for (const point of barrier.points) {
    if (point.pinned) continue;
    const vx = (point.x - point.oldX) * 0.992;
    const vy = (point.y - point.oldY) * 0.992;
    point.oldX = point.x;
    point.oldY = point.y;
    point.x += vx + level.wind * dt * dt;
    point.y += vy + gravity * dt * dt;
    point.x += (point.restX - point.x) * shapeReturn;
    point.y += (point.restY - point.y) * shapeReturn;
  }
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 1; i < barrier.points.length; i++) {
      constrainPair(barrier.points[i - 1], barrier.points[i], barrier.lengths[i - 1]);
    }
    if (barrier.closed) constrainPair(barrier.points[barrier.points.length - 1], barrier.points[0], barrier.closingLength);
    for (const brace of barrier.braces) {
      constrainPair(barrier.points[brace.a], barrier.points[brace.b], brace.length);
    }
    for (const point of barrier.points) if (!point.pinned) resolvePointTerrain(point);
  }
}

function spawnBee(): void {
  if (bees.length >= 18) return;
  const hive = level.hives[hiveCursor % level.hives.length];
  hiveCursor += 1;
  const angle = (hiveCursor * 2.399) % (Math.PI * 2);
  bees.push({
    x: hive.x + Math.cos(angle) * 14,
    y: hive.y + Math.sin(angle) * 14,
    vx: Math.cos(angle) * 12,
    vy: Math.sin(angle) * 12,
    phase: angle,
  });
}

function closestOnSegment(point: Point, a: Point, b: Point): { point: Point; ratio: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const ratio = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1);
  return { point: { x: a.x + dx * ratio, y: a.y + dy * ratio }, ratio };
}

function collideBeeWithBarrier(bee: Bee): void {
  if (!barrier || barrier.points.length < 2) return;
  const radius = Math.max(11, Math.min(width, height) * 0.026);
  const segmentCount = barrier.closed ? barrier.points.length : barrier.points.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    const a = barrier.points[i];
    const b = barrier.points[(i + 1) % barrier.points.length];
    const closest = closestOnSegment(bee, a, b);
    const dx = bee.x - closest.point.x;
    const dy = bee.y - closest.point.y;
    const gap = Math.hypot(dx, dy);
    if (gap >= radius) continue;
    const nx = gap > 0.001 ? dx / gap : 0;
    const ny = gap > 0.001 ? dy / gap : -1;
    bee.x = closest.point.x + nx * radius;
    bee.y = closest.point.y + ny * radius;
    const incoming = bee.vx * nx + bee.vy * ny;
    if (incoming < 0) {
      bee.vx -= 1.75 * incoming * nx;
      bee.vy -= 1.75 * incoming * ny;
    }
    const push = 1.5;
    if (!a.pinned) {
      a.x -= nx * push * (1 - closest.ratio);
      a.y -= ny * push * (1 - closest.ratio);
    }
    if (!b.pinned) {
      b.x -= nx * push * closest.ratio;
      b.y -= ny * push * closest.ratio;
    }
    return;
  }
}

function collideBeeWithTerrain(bee: Bee): void {
  const radius = Math.max(8, Math.min(width, height) * 0.019);
  for (const rect of level.terrain) {
    const nearestX = clamp(bee.x, rect.x, rect.x + rect.width);
    const nearestY = clamp(bee.y, rect.y, rect.y + rect.height);
    const dx = bee.x - nearestX;
    const dy = bee.y - nearestY;
    const gap = Math.hypot(dx, dy);
    if (gap >= radius || gap < 0.001) continue;
    const nx = dx / gap;
    const ny = dy / gap;
    bee.x = nearestX + nx * radius;
    bee.y = nearestY + ny * radius;
    const incoming = bee.vx * nx + bee.vy * ny;
    if (incoming < 0) {
      bee.vx -= 1.8 * incoming * nx;
      bee.vy -= 1.8 * incoming * ny;
    }
  }
}

function updateBees(dt: number): boolean {
  spawnClock += dt;
  while (spawnClock >= level.spawnEvery) {
    spawnClock -= level.spawnEvery;
    spawnBee();
  }
  const dogRadius = clamp(Math.min(width, height) * 0.052, 20, 34);
  const beeRadius = Math.max(8, Math.min(width, height) * 0.019);
  for (const bee of bees) {
    bee.phase += dt * 8;
    const dx = level.dog.x - bee.x;
    const dy = level.dog.y - bee.y;
    const gap = Math.hypot(dx, dy) || 1;
    const targetVx = (dx / gap) * level.beeSpeed + Math.cos(bee.phase) * 18;
    const targetVy = (dy / gap) * level.beeSpeed + Math.sin(bee.phase * 1.3) * 18;
    bee.vx += (targetVx - bee.vx) * Math.min(1, dt * 2.6);
    bee.vy += (targetVy - bee.vy) * Math.min(1, dt * 2.6);
    bee.x += bee.vx * dt;
    bee.y += bee.vy * dt;
    collideBeeWithTerrain(bee);
    collideBeeWithBarrier(bee);
    if (distance(bee, level.dog) < dogRadius + beeRadius * 0.72) return true;
  }
  return false;
}

function update(dt: number): void {
  if (gameState.phase !== "surviving") return;
  updateBarrier(dt);
  const previousPhase = gameState.phase;
  const beeHit = updateBees(dt);
  gameState = tickRound(gameState, {
    deltaMs: dt * 1000,
    beeHit,
    inkUsed,
    inkLimit: level.inkLimit,
  });
  if (previousPhase !== gameState.phase) {
    if (gameState.phase === "lost") tone(92, 0.42, 0.14, "sawtooth");
    else {
      tone(523, 0.2, 0.09);
      window.setTimeout(() => tone(784, 0.34, 0.08), 110);
    }
  }
}

function roundedRect(rect: Rect, radius: number): void {
  draw.beginPath();
  draw.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
}

function drawBackground(now: number): void {
  const gradient = draw.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#201b3d");
  gradient.addColorStop(0.62, "#342454");
  gradient.addColorStop(1, "#563044");
  draw.fillStyle = gradient;
  draw.fillRect(0, 0, width, height);
  draw.fillStyle = "rgba(255, 242, 188, 0.16)";
  for (let i = 0; i < 26; i++) {
    const x = (((i * 173.3) % 997) / 997) * width;
    const y = (((i * 337.7) % 613) / 613) * height * 0.72;
    const pulse = 0.6 + Math.sin(now * 0.0015 + i) * 0.4;
    draw.beginPath();
    draw.arc(x, y, 1 + pulse, 0, Math.PI * 2);
    draw.fill();
  }
}

function drawTerrain(): void {
  for (const rect of level.terrain) {
    const gradient = draw.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
    gradient.addColorStop(0, "#75617f");
    gradient.addColorStop(1, "#3f354f");
    roundedRect(rect, Math.min(18, rect.height * 0.45));
    draw.fillStyle = gradient;
    draw.fill();
    draw.strokeStyle = "rgba(255,255,255,0.1)";
    draw.lineWidth = 2;
    draw.stroke();
  }
  for (const anchor of level.anchors) {
    const pulse = 1 + Math.sin(performance.now() * 0.005 + anchor.x) * 0.12;
    draw.beginPath();
    draw.arc(anchor.x, anchor.y, 11 * pulse, 0, Math.PI * 2);
    draw.fillStyle = "#f8d77a";
    draw.fill();
    draw.beginPath();
    draw.arc(anchor.x, anchor.y, 4, 0, Math.PI * 2);
    draw.fillStyle = "#4c3559";
    draw.fill();
  }
}

function drawHive(hive: Point, now: number): void {
  const radius = clamp(Math.min(width, height) * 0.052, 20, 31);
  draw.save();
  draw.translate(hive.x, hive.y + Math.sin(now * 0.003 + hive.x) * 4);
  draw.fillStyle = "#f2b94d";
  draw.strokeStyle = "#7a452f";
  draw.lineWidth = 3;
  draw.beginPath();
  draw.ellipse(0, 0, radius * 0.82, radius, 0, 0, Math.PI * 2);
  draw.fill();
  draw.stroke();
  draw.strokeStyle = "rgba(122,69,47,0.65)";
  for (const y of [-0.42, 0, 0.42]) {
    draw.beginPath();
    draw.ellipse(0, radius * y, radius * (0.7 - Math.abs(y) * 0.15), radius * 0.12, 0, 0, Math.PI * 2);
    draw.stroke();
  }
  draw.beginPath();
  draw.arc(radius * 0.35, radius * 0.18, radius * 0.22, 0, Math.PI * 2);
  draw.fillStyle = "#31213a";
  draw.fill();
  draw.restore();
}

function drawBee(bee: Bee): void {
  const size = Math.max(8, Math.min(width, height) * 0.019);
  draw.save();
  draw.translate(bee.x, bee.y);
  draw.rotate(Math.atan2(bee.vy, bee.vx));
  draw.fillStyle = "rgba(230,239,255,0.7)";
  draw.beginPath();
  draw.ellipse(-2, -size * 0.72, size * 0.65, size * 0.38, -0.45, 0, Math.PI * 2);
  draw.ellipse(-2, size * 0.72, size * 0.65, size * 0.38, 0.45, 0, Math.PI * 2);
  draw.fill();
  draw.fillStyle = "#f5c84b";
  draw.beginPath();
  draw.ellipse(0, 0, size, size * 0.62, 0, 0, Math.PI * 2);
  draw.fill();
  draw.strokeStyle = "#38263f";
  draw.lineWidth = Math.max(2, size * 0.22);
  for (const x of [-0.28, 0.25]) {
    draw.beginPath();
    draw.moveTo(size * x, -size * 0.55);
    draw.lineTo(size * x, size * 0.55);
    draw.stroke();
  }
  draw.restore();
}

function drawDog(now: number): void {
  const radius = clamp(Math.min(width, height) * 0.052, 20, 34);
  const worried = gameState.phase === "surviving";
  const lost = gameState.phase === "lost";
  const happy = gameState.phase === "won" || gameState.phase === "complete";
  const bob = gameState.phase === "drawing" || happy ? Math.sin(now * 0.005) * 2.5 : 0;
  draw.save();
  draw.translate(level.dog.x, level.dog.y + bob);
  if (gameState.phase === "drawing") {
    draw.beginPath();
    draw.arc(0, 0, radius * (1.42 + Math.sin(now * 0.004) * 0.07), 0, Math.PI * 2);
    draw.strokeStyle = "rgba(255,232,147,0.25)";
    draw.lineWidth = 3;
    draw.stroke();
  }
  draw.fillStyle = "#8d5a45";
  draw.beginPath();
  draw.ellipse(-radius * 0.72, -radius * 0.25, radius * 0.48, radius * 0.72, -0.38, 0, Math.PI * 2);
  draw.ellipse(radius * 0.72, -radius * 0.25, radius * 0.48, radius * 0.72, 0.38, 0, Math.PI * 2);
  draw.fill();
  draw.beginPath();
  draw.arc(0, 0, radius, 0, Math.PI * 2);
  draw.fillStyle = "#d99561";
  draw.fill();
  draw.fillStyle = "#342337";
  if (lost) {
    draw.lineWidth = 3;
    draw.strokeStyle = "#342337";
    for (const x of [-0.36, 0.36]) {
      draw.beginPath();
      draw.moveTo(radius * (x - 0.1), -radius * 0.25);
      draw.lineTo(radius * (x + 0.1), -radius * 0.05);
      draw.moveTo(radius * (x + 0.1), -radius * 0.25);
      draw.lineTo(radius * (x - 0.1), -radius * 0.05);
      draw.stroke();
    }
  } else {
    const eyeHeight = worried ? radius * 0.14 : radius * 0.2;
    for (const x of [-0.35, 0.35]) {
      draw.beginPath();
      draw.ellipse(radius * x, -radius * 0.16, radius * 0.09, eyeHeight, 0, 0, Math.PI * 2);
      draw.fill();
    }
  }
  draw.beginPath();
  draw.ellipse(0, radius * 0.2, radius * 0.2, radius * 0.15, 0, 0, Math.PI * 2);
  draw.fill();
  draw.strokeStyle = "#342337";
  draw.lineWidth = 3;
  draw.beginPath();
  if (happy) draw.arc(0, radius * 0.34, radius * 0.34, 0.12 * Math.PI, 0.88 * Math.PI);
  else draw.arc(0, radius * 0.7, radius * 0.28, 1.12 * Math.PI, 1.88 * Math.PI);
  draw.stroke();
  draw.restore();
}

function strokePath(points: Point[], closed: boolean): void {
  if (points.length < 2) return;
  draw.beginPath();
  draw.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) draw.lineTo(points[i].x, points[i].y);
  if (closed) draw.closePath();
  draw.stroke();
}

function drawBarrier(now: number): void {
  const lineWidth = clamp(Math.min(width, height) * 0.024, 9, 17);
  const points = barrier?.points ?? rawStroke;
  if (points.length < 2) return;
  draw.save();
  draw.lineCap = "round";
  draw.lineJoin = "round";
  draw.lineWidth = lineWidth + 6;
  draw.strokeStyle = "rgba(31, 21, 48, 0.42)";
  strokePath(points, barrier?.closed ?? false);
  const gradient = draw.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff6c7");
  gradient.addColorStop(0.5, "#f4d176");
  gradient.addColorStop(1, "#ff9d78");
  draw.lineWidth = lineWidth;
  draw.strokeStyle = gradient;
  draw.shadowColor = "rgba(255,216,112,0.55)";
  draw.shadowBlur = gameState.phase === "drawing" ? 14 + Math.sin(now * 0.01) * 3 : 8;
  strokePath(points, barrier?.closed ?? false);
  draw.restore();
}

function drawFirstMoveAffordance(now: number): void {
  if (gameState.levelIndex !== 0 || gameState.phase !== "drawing" || rawStroke.length > 0 || isDrawing) return;
  const radius = clamp(Math.min(width, height) * 0.12, 46, 76);
  const start = Math.PI * 1.1;
  const end = Math.PI * 2.9;
  draw.save();
  draw.setLineDash([5, 10]);
  draw.lineWidth = 3;
  draw.strokeStyle = "rgba(255,246,199,0.2)";
  draw.beginPath();
  draw.arc(level.dog.x, level.dog.y, radius, start, end);
  draw.stroke();
  draw.setLineDash([]);
  const progress = (now * 0.00022) % 1;
  const angle = start + (end - start) * progress;
  draw.beginPath();
  draw.arc(level.dog.x + Math.cos(angle) * radius, level.dog.y + Math.sin(angle) * radius, 7, 0, Math.PI * 2);
  draw.fillStyle = "rgba(255,246,199,0.85)";
  draw.shadowColor = "#ffe481";
  draw.shadowBlur = 16;
  draw.fill();
  draw.restore();
}

function drawHud(): void {
  const shortSide = Math.min(width, height);
  const top = clamp(shortSide * 0.07, 32, 48);
  const dotGap = clamp(shortSide * 0.04, 15, 24);
  const startX = width / 2 - ((LEVEL_COUNT - 1) * dotGap) / 2;
  for (let i = 0; i < LEVEL_COUNT; i++) {
    draw.beginPath();
    draw.arc(startX + i * dotGap, top, i === gameState.levelIndex ? 6 : 4, 0, Math.PI * 2);
    draw.fillStyle = i < gameState.levelIndex ? "#f7ca65" : i === gameState.levelIndex ? "#fff5c2" : "rgba(255,255,255,0.2)";
    draw.fill();
  }
  const barWidth = clamp(width * 0.2, 72, 170);
  const barHeight = 7;
  const barX = width - barWidth - clamp(shortSide * 0.055, 20, 42);
  const ratio = clamp(1 - inkUsed / level.inkLimit, 0, 1);
  draw.fillStyle = "rgba(255,255,255,0.14)";
  draw.beginPath();
  draw.roundRect(barX, top - barHeight / 2, barWidth, barHeight, barHeight);
  draw.fill();
  if (ratio > 0) {
    draw.fillStyle = ratio < 0.2 ? "#ff8f77" : "#f6d16d";
    draw.beginPath();
    draw.roundRect(barX, top - barHeight / 2, barWidth * ratio, barHeight, barHeight);
    draw.fill();
  }
  draw.save();
  draw.translate(barX - 13, top);
  draw.rotate(-0.7);
  draw.fillStyle = "#fff5c2";
  draw.fillRect(-2, -8, 4, 16);
  draw.restore();
  if (gameState.phase === "surviving") {
    const timerRadius = clamp(shortSide * 0.035, 15, 23);
    const centreX = clamp(shortSide * 0.09, 38, 62);
    draw.beginPath();
    draw.arc(centreX, top, timerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (gameState.elapsedMs / SURVIVAL_MS));
    draw.strokeStyle = "#fff4bd";
    draw.lineWidth = 5;
    draw.lineCap = "round";
    draw.stroke();
  }
}

function drawResult(now: number): void {
  if (gameState.phase !== "won" && gameState.phase !== "lost" && gameState.phase !== "complete") return;
  draw.fillStyle = gameState.phase === "lost" ? "rgba(53,18,49,0.55)" : "rgba(29,24,56,0.5)";
  draw.fillRect(0, 0, width, height);
  const centreY = height * 0.3;
  draw.textAlign = "center";
  draw.textBaseline = "middle";
  draw.font = `800 ${clamp(Math.min(width, height) * 0.16, 54, 110)}px system-ui`;
  draw.fillStyle = gameState.phase === "lost" ? "#ff806f" : "#ffe783";
  draw.fillText(gameState.phase === "lost" ? "×" : gameState.phase === "complete" ? "♛" : "✓", width / 2, centreY);
  if (gameState.phase !== "lost") {
    const rating = gameState.stars[gameState.levelIndex] ?? 0;
    draw.font = `700 ${clamp(Math.min(width, height) * 0.06, 24, 42)}px system-ui`;
    draw.letterSpacing = "0.14em";
    draw.fillStyle = "#ffd568";
    const stars = gameState.phase === "complete" ? gameState.stars.reduce((sum, value) => sum + value, 0) : rating;
    draw.fillText(gameState.phase === "complete" ? `★ ${stars}/${LEVEL_COUNT * 3}` : "★".repeat(stars), width / 2, centreY + 84);
    draw.letterSpacing = "0px";
  }
  const pulse = 1 + Math.sin(now * 0.006) * 0.08;
  const restartY = height * 0.67;
  draw.beginPath();
  draw.arc(width / 2, restartY, 34 * pulse, 0, Math.PI * 2);
  draw.fillStyle = "rgba(255,247,205,0.15)";
  draw.fill();
  draw.strokeStyle = "#fff3b0";
  draw.lineWidth = 4;
  draw.beginPath();
  draw.arc(width / 2, restartY, 17, -Math.PI * 0.25, Math.PI * 1.35);
  draw.stroke();
  draw.beginPath();
  draw.moveTo(width / 2 - 15, restartY - 13);
  draw.lineTo(width / 2 - 5, restartY - 15);
  draw.lineTo(width / 2 - 8, restartY - 5);
  draw.stroke();
}

function render(now: number): void {
  draw.clearRect(0, 0, width, height);
  drawBackground(now);
  drawTerrain();
  for (const hive of level.hives) drawHive(hive, now);
  for (const bee of bees) drawBee(bee);
  drawFirstMoveAffordance(now);
  drawBarrier(now);
  drawDog(now);
  drawHud();
  drawResult(now);
}

function frame(now: number): void {
  resize();
  const elapsed = lastFrameAt ? Math.min(0.05, (now - lastFrameAt) / 1000) : 0;
  lastFrameAt = now;
  accumulator += elapsed;
  const step = 1 / 60;
  while (accumulator >= step) {
    update(step);
    accumulator -= step;
  }
  render(now);
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  ensureAudio();
  if (gameState.phase === "won" || gameState.phase === "lost" || gameState.phase === "complete") {
    gameState = continueGame(gameState);
    resetLevel();
    tone(330, 0.13, 0.05);
    return;
  }
  if (gameState.phase !== "drawing" || isDrawing) return;
  canvas.setPointerCapture(event.pointerId);
  isDrawing = true;
  rawStroke = [pointerPosition(event)];
  inkUsed = 0;
  tone(440, 0.08, 0.025);
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDrawing || gameState.phase !== "drawing") return;
  appendStroke(pointerPosition(event));
});

function finishStroke(event: PointerEvent): void {
  if (!isDrawing || gameState.phase !== "drawing") return;
  appendStroke(pointerPosition(event));
  isDrawing = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  barrier = buildBarrier(rawStroke);
  gameState = releaseStroke(gameState);
  tone(220, 0.18, 0.05, "triangle");
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
window.addEventListener("resize", resize);

resize();
requestAnimationFrame(frame);
