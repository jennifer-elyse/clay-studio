import { ANIMATION_BASE, BLUE_ANIMATION_BASE, animationSrc } from "./animations.js";
import { BlueClayFace } from "./BlueClayFace.jsx";
import "./ClayBot.css";

/**
 * @param {object} props
 * @param {string} [props.clip]
 * @param {"md" | "lg"} [props.size]
 * @param {string} [props.base]
 * @param {"classic" | "blue"} [props.theme]
 */
export function ClayBot({ clip = "idle.webp", size = "md", base = ANIMATION_BASE, theme = "classic" }) {
  const src = animationSrc(clip, theme === "blue" ? BLUE_ANIMATION_BASE : base);
  return (
    <div className={`clay-bot-stage is-${size} is-${theme}`} aria-hidden="true" data-clip={clip}>
      <div key={src} className="clay-bot-figure">
        <img className="clay-bot-clip" src={src} alt="" width="315" height="311" />
        {theme === "blue" ? <BlueClayFace /> : null}
      </div>
    </div>
  );
}
