import { blueMotionForClip } from "./blue-motion.js";
import "./BlueClayFigure.css";

/** The illustrated WebP is the single source of truth for the Blue Gumby mascot. */
export function BlueClayFigure({ clip = "idle.webp" }) {
  const selected = /^[a-z-]+\.webp$/.test(clip) ? clip : "idle.webp";
  return <img className="clay-blue-figure"
    data-blue-character="true"
    data-motion={blueMotionForClip(selected)}
    src={`/assets/animations/blue/${selected}?v=7-1-showcase-v3`}
    width="320" height="320" draggable={false} alt="" aria-hidden="true" />;
}
