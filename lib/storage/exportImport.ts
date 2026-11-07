import { ProgressExportSchema, isSolved, type ProgressExport } from "@/types/progress";

export type ParsedExport = { ok: true; data: ProgressExport } | { ok: false; reason: string };

/** Proverava sadržaj fajla koji je korisnik izabrao za uvoz. Ništa se ne upisuje dok ne prođe provera. */
export function parseExportFile(text: string): ParsedExport {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: "JSON" };
  }

  const result = ProgressExportSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, reason: `${issue.path.join(".") || "(root)"}: ${issue.message}` };
  }
  return { ok: true, data: result.data };
}

export function summarizeExport(data: ProgressExport): { exercises: number; solved: number; attempts: number } {
  return {
    exercises: data.progress.length,
    solved: data.progress.filter(isSolved).length,
    attempts: data.attempts.length,
  };
}

export function exportFileName(date: Date): string {
  return `kata-stack-${date.toISOString().slice(0, 10)}.json`;
}
