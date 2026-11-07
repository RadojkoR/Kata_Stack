"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { createSafeStorage } from "./storage/browser";
import { DEFAULT_THEME, UI_STORAGE_KEY, type Theme } from "./theme";

/** Ključ `ks:ui`: podešavanja interfejsa (za sada samo tema). */
const UiSchema = z.object({ theme: z.enum(["dark", "light"]).optional() });

export function readTheme(): Theme {
  try {
    const raw = createSafeStorage().getItem(UI_STORAGE_KEY);
    const parsed = UiSchema.safeParse(raw ? JSON.parse(raw) : {});
    return parsed.success && parsed.data.theme ? parsed.data.theme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  createSafeStorage().setItem(UI_STORAGE_KEY, JSON.stringify({ theme }));
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Trenutna tema iz atributa `data-theme` na `<html>`. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"),
    () => DEFAULT_THEME,
  );
}
