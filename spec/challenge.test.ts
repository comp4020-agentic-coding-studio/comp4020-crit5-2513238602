import { describe, expect, it } from "vitest";
import {
  LEVELS,
  chooseRouteTarget,
  genericCircleCanClear,
  projectedUnprotectedHitSeconds,
} from "../challenge.ts";

describe("challenge contract", () => {
  it("gives every level a distinct spatial mechanic and a fast unprotected loss", () => {
    expect(new Set(LEVELS.map((level) => level.mechanic)).size).toBe(6);
    for (const level of LEVELS) {
      expect(projectedUnprotectedHitSeconds(level, 1920, 1080)).toBeLessThanOrEqual(3);
      expect(projectedUnprotectedHitSeconds(level, 390, 844)).toBeLessThanOrEqual(3);
      expect(level.solutions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("prevents a generic circle from clearing more than two levels", () => {
    expect(LEVELS.filter(genericCircleCanClear).length).toBeLessThanOrEqual(2);
  });

  it("routes around blocking terrain instead of steering into it", () => {
    const target = chooseRouteTarget({ x: 100, y: 300 }, { x: 900, y: 300 }, [
      { x: 430, y: 180, width: 140, height: 260 },
    ], 1, 1000, 600);

    expect(target).not.toEqual({ x: 900, y: 300 });
    expect(target.x).toBeGreaterThan(570);
    expect(target.y).toBeLessThan(180);
  });
});
