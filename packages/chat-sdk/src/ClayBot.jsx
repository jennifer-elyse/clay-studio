import { ANIMATION_BASE, BLUE_ANIMATION_BASE, animationSrc } from "./animations.js";
import { useTheme } from "./use-theme.js";
import "./ClayBot.css";

/**
 * @param {object} props
 * @param {string} [props.clip]
 * @param {"md" | "lg"} [props.size]
 * @param {string} [props.base]
 * @param {"classic" | "blue"} [props.theme] Overrides the theme chosen in Settings.
 */
export function ClayBot({ clip = "idle.webp", size = "md", base = ANIMATION_BASE, theme }) {
  const inherited = useTheme();
  const active = theme ?? inherited;
  const src = animationSrc(clip, active === "blue" ? BLUE_ANIMATION_BASE : base);
  return (
    <div className={`clay-bot-stage is-${size} is-${active}`} aria-hidden="true" data-clip={clip}>
      <img key={src} className="clay-bot-clip" src={src} alt="" width="315" height="311" />
    </div>
  );
}
