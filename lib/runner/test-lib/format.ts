const MAX_DEPTH = 4;
const MAX_LENGTH = 300;

function truncate(s: string): string {
  return s.length > MAX_LENGTH ? `${s.slice(0, MAX_LENGTH)}…` : s;
}

function fmt(v: unknown, depth: number, seen: Set<object>): string {
  if (v === null) return "null";
  switch (typeof v) {
    case "undefined":
      return "undefined";
    case "string":
      return JSON.stringify(v);
    case "number":
      return Object.is(v, -0) ? "-0" : String(v);
    case "bigint":
      return `${v}n`;
    case "boolean":
    case "symbol":
      return String(v);
    case "function":
      return `[Function ${v.name || "anonymous"}]`;
  }

  const obj = v as object;
  if (seen.has(obj)) return "[Circular]";
  if (obj instanceof Date) return `Date(${Number.isNaN(obj.getTime()) ? "Invalid" : obj.toISOString()})`;
  if (obj instanceof RegExp) return String(obj);
  if (obj instanceof Error) return `${obj.name}: ${obj.message}`;
  if (depth >= MAX_DEPTH) return Array.isArray(obj) ? "[…]" : "{…}";

  seen.add(obj);
  try {
    if (Array.isArray(obj)) return `[${obj.map((x) => fmt(x, depth + 1, seen)).join(", ")}]`;
    if (obj instanceof Set) return `Set {${[...obj].map((x) => fmt(x, depth + 1, seen)).join(", ")}}`;
    if (obj instanceof Map) {
      const entries = [...obj].map(([k, x]) => `${fmt(k, depth + 1, seen)} => ${fmt(x, depth + 1, seen)}`);
      return `Map {${entries.join(", ")}}`;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    const body = keys.map((k) => `${k}: ${fmt((obj as Record<string, unknown>)[k], depth + 1, seen)}`);
    return `{ ${body.join(", ")} }`;
  } finally {
    seen.delete(obj);
  }
}

/** Prikaz vrednosti u poruci o grešci testa. */
export function formatValue(v: unknown): string {
  return truncate(fmt(v, 0, new Set()));
}

/** Prikaz argumenata `console.log`: stringovi kakvi jesu, ostalo kao vrednosti. */
export function formatLogArgs(args: unknown[]): string {
  return truncate(args.map((a) => (typeof a === "string" ? a : fmt(a, 0, new Set()))).join(" "));
}
