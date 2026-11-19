import { createContext, useContext, useState } from "react";
import { THEMES, readTheme, saveTheme } from "./theme.js";

/** @type {import("react").Context<"classic" | "blue">} */
export const ThemeContext = createContext("classic");

export function useTheme() {
  return useContext(ThemeContext);
}

/** Remembers Purple Clay (`classic`) or Blue Clay for this browser. */
export function useStudioTheme() {
  const [theme, setTheme] = useState(readTheme);

  /** @param {"classic" | "blue"} next */
  function chooseTheme(next) {
    if (!THEMES.includes(next)) return;
    setTheme(next);
    saveTheme(next);
  }

  return { theme, chooseTheme };
}
