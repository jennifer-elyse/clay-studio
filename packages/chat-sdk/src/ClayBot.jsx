import { ANIMATION_BASE, animationSrc } from "./animations.js";
import "./ClayBot.css";

/**
 * @param {object} props
 * @param {string} [props.clip]
 * @param {"md" | "lg"} [props.size]
 * @param {string} [props.base]
 */
export function ClayBot({ clip = "idle.webp", size = "md", base = ANIMATION_BASE }) {
  const src = animationSrc(clip, base);
  return (
    <div className={`clay-bot-stage is-${size}`} aria-hidden="true" data-clip={clip}>
      <img key={src} className="clay-bot-clip" src={src} alt="" width="315" height="311" />
    </div>
  );
}
