import { ANIMATION_BASE, BLUE_ANIMATION_BASE, animationSrc } from "./animations.js";
import { UnicornMorph } from "./UnicornMorph.jsx";
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
      <img key={src} className="clay-bot-clip" src={src} alt="" width="315" height="311" />
      {theme === "blue" ? (
        <div className={`clay-blue-mascot${clip === "image.webp" ? " is-unicorn" : ""}`}>
          <span className="clay-blue-ball" />
          {clip === "image.webp" ? <UnicornMorph /> : null}
        </div>
      ) : null}
    </div>
  );
}
