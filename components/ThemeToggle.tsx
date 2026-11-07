"use client";

import { useLayoutEffect } from "react";
import { applyTheme, readTheme, useTheme } from "@/lib/use-theme";

type Props = {
  label: string;
  names: { dark: string; light: string };
};

export function ThemeToggle({ label, names }: Props) {
  const theme = useTheme();

  // U razvoju React ponovo montira komponente i briše atribut koji je postavila skripta iz <head>; vraćamo ga.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", readTheme());
  }, []);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`${label}: ${names[next]}`}
      title={`${label}: ${names[next]}`}
      className="rounded px-2 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
