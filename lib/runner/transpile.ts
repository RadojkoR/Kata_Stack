import { transform } from "sucrase";

/** TypeScript → JavaScript. Brojevi linija ostaju isti, pa se greške mogu prikazati u editoru. */
export function transpileTs(source: string): string {
  return transform(source, { transforms: ["typescript"], disableESTransforms: true }).code;
}
