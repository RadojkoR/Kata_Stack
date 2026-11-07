/** Duboko poređenje za `toEqual`: kao u Jest-u, svojstva sa vrednošću `undefined` se ignorišu. */
export function deepEqual(a: unknown, b: unknown): boolean {
  return eq(a, b, new WeakMap());
}

function definedKeys(o: object): string[] {
  return Object.keys(o).filter((k) => (o as Record<string, unknown>)[k] !== undefined);
}

function eq(a: unknown, b: unknown, seen: WeakMap<object, object>): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

  if (seen.get(a) === b) return true;
  seen.set(a, b);

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && Object.is(a.getTime(), b.getTime());
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && String(a) === String(b);
  }
  if (a instanceof Error || b instanceof Error) {
    return a instanceof Error && b instanceof Error && a.name === b.name && a.message === b.message;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    const rest = [...b];
    return [...a].every((x) => {
      const i = rest.findIndex((y) => eq(x, y, seen));
      if (i === -1) return false;
      rest.splice(i, 1);
      return true;
    });
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    return [...a].every(([k, v]) => b.has(k) && eq(v, b.get(k), seen));
  }

  if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) return false;

  const ka = definedKeys(a);
  const kb = definedKeys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      eq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], seen),
  );
}
