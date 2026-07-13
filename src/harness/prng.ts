/**
 * Deterministic seeded PRNG for the acceptance harness.
 *
 * Same seed → same sequence → same generated campaign → same expected results.
 * mulberry32 is a small, well-distributed 32-bit generator; the specific choice
 * is left to implementation by the spec, only its determinism matters.
 */

export class Prng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Uniformly pick one element. Throws on an empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("cannot pick from an empty array");
    return items[this.int(items.length)]!;
  }
}
