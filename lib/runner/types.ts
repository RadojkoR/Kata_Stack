/**
 * Ugovor koji važi za sve adaptere (worker, worker-ts, types, kasnije iframe-react i webcontainer).
 * Runner ne vraća rečenice na srpskom ili engleskom nego kodove i vrednosti; prevodi ih UI.
 */

/** Ime testa: običan string ili po jedan tekst za svaki jezik. */
export type TestName = string | { sr: string; en: string };

export interface RunInput {
  code: string;
  tests: string;
  /** Skriveni testovi se šalju samo pri Submit-u. */
  hiddenTests?: string;
  timeoutMs?: number;
}

export type AssertionCode =
  /** Vrednost nije ona koja se očekuje. */
  | "mismatch"
  /** Provera sa `.not` je prošla, a nije smela. */
  | "negated"
  /** `toThrow`: ništa nije bačeno. */
  | "not-thrown"
  /** `.rejects`: promise je razrešen. */
  | "resolved-unexpectedly"
  /** `.resolves`: promise je odbijen. */
  | "rejected-unexpectedly";

export interface TestResult {
  name: TestName;
  passed: boolean;
  /** Skriveni testovi ne otkrivaju ni ime ni vrednosti; UI prikazuje samo `hiddenIndex`. */
  hidden?: boolean;
  hiddenIndex?: number;
  /** Kad padne provera iz `expect`: koja je i šta se očekivalo/dobilo (vrednosti, ne rečenice). */
  failure?: { code: AssertionCode; matcher: string };
  expected?: string;
  actual?: string;
  /** Poruka izuzetka koji je test bacio mimo `expect` (izvorna poruka JavaScript-a). */
  error?: string;
}

export interface LogEntry {
  level: "log" | "warn" | "error";
  text: string;
}

export interface TypeErrorInfo {
  line: number;
  column?: number;
  /** Poruka TypeScript kompajlera (na engleskom). */
  message: string;
}

export type RunError =
  | { code: "timeout"; ms: number }
  /** Izuzetak ili sintaksna greška pri učitavanju koda; `message` je izvorna poruka. */
  | { code: "exception" | "transpile" | "worker"; message: string };

export interface RunResult {
  tests: TestResult[];
  logs: LogEntry[];
  /** Greška van testova. */
  error?: RunError;
  typeErrors?: TypeErrorInfo[];
  timedOut: boolean;
  durationMs: number;
}

export interface Runner {
  run(input: RunInput): Promise<RunResult>;
}

/** Zadatak je rešen kad nema greške, nije isteklo vreme i svi testovi prolaze. Greške tipova se računaju posebno. */
export function allPassed(result: RunResult): boolean {
  return !result.error && !result.timedOut && result.tests.length > 0 && result.tests.every((t) => t.passed);
}

export const DEFAULT_TIMEOUT_MS = 3000;
