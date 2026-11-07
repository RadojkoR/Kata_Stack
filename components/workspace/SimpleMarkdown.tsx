import type { ReactNode } from "react";

/** Najmanji deo Markdown-a koji opisi zadataka koriste: pasusi, liste sa "- ", `kod` u liniji i ``` blokovi. */

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code key={i} className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function SimpleMarkdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];

  source.split(/```[a-z]*\n?/).forEach((chunk, i) => {
    if (i % 2 === 1) {
      blocks.push(
        <pre key={`c${i}`} className="overflow-x-auto rounded bg-zinc-200 p-3 font-mono text-sm dark:bg-zinc-800">
          {chunk.trimEnd()}
        </pre>,
      );
      return;
    }
    chunk
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((paragraph, j) => {
        const lines = paragraph.split("\n");
        const isList = lines.every((l) => l.startsWith("- "));
        const lead = !isList && lines.length > 1 && lines.slice(1).every((l) => l.startsWith("- "));
        const items = (lead ? lines.slice(1) : lines).map((l) => l.slice(2));

        if (isList || lead) {
          blocks.push(
            <div key={`p${i}-${j}`}>
              {lead && <p>{inline(lines[0])}</p>}
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {items.map((item, k) => (
                  <li key={k}>{inline(item)}</li>
                ))}
              </ul>
            </div>,
          );
        } else {
          blocks.push(<p key={`p${i}-${j}`}>{inline(paragraph)}</p>);
        }
      });
  });

  return <div className="space-y-3 text-sm leading-relaxed">{blocks}</div>;
}
