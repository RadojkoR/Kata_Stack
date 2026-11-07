/** Deklaracije `test` i `expect` za Monaco, da i pomoćne funkcije zadatka imaju autocomplete (Korak 6). */
export const TEST_API_DTS = `
declare function test(
  name: string | { sr: string; en: string },
  fn: () => void | Promise<void>,
): void;

interface Matchers<R> {
  toBe(expected: unknown): R;
  toEqual(expected: unknown): R;
  toBeTruthy(): R;
  toBeFalsy(): R;
  toContain(item: unknown): R;
  toHaveLength(length: number): R;
  toThrow(expected?: string | RegExp | (new (...args: any[]) => Error)): R;
}

interface Expectation extends Matchers<void> {
  not: Matchers<void>;
  /** Vraća Promise: test mora da ga sačeka (await). */
  resolves: Matchers<Promise<void>> & { not: Matchers<Promise<void>> };
  rejects: Matchers<Promise<void>> & { not: Matchers<Promise<void>> };
}

declare function expect(received: unknown): Expectation;
`;
