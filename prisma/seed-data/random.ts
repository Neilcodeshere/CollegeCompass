/**
 * Small seeded pseudo-random generator (mulberry32). The same seed always
 * produces the same dataset, so every environment and test sees identical data.
 */
export type Random = {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  float(min: number, max: number): number;
  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Standard normal sample (mean 0, standard deviation 1). */
  normal(): number;
};

export function at<T>(items: readonly T[], index: number): T {
  if (index < 0 || index >= items.length) {
    throw new RangeError(`Index ${index} is out of range for a list of ${items.length}.`);
  }
  return items[index] as T;
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    float: (min, max) => min + next() * (max - min),
    int,
    chance: (probability) => next() < probability,
    pick: (items) => at(items, Math.floor(next() * items.length)),
    shuffle: (items) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [at(copy, j), at(copy, i)];
      }
      return copy;
    },
    normal: () => {
      const u = 1 - next(); // (0, 1], avoids log(0)
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
