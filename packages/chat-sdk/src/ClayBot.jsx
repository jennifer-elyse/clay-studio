import { ANIMATION_BASE, BLUE_ANIMATION_BASE, animationSrc } from "./animations.js";
import { useState } from "react";
import "./ClayBot.css";

/**
 * @param {object} props
 * @param {string} [props.clip]
 * @param {"md" | "lg"} [props.size]
 * @param {string} [props.base]
 * @param {"classic" | "blue"} [props.theme]
 */
export function ClayBot({ clip = "idle.webp", size = "md", base = ANIMATION_BASE, theme = "classic" }) {
  const [failedAsset, setFailedAsset] = useState("");
  const src = animationSrc(clip, theme === "blue" ? BLUE_ANIMATION_BASE : base);
  return (
    <div className={`clay-bot-stage is-${size} is-${theme}`} aria-hidden="true" data-clip={clip}>
      {theme === "blue" ? (
        <>
          <div className="clay-blue-animated">
            {<img key={src} className="clay-bot-clip"
                  src={failedAsset === src ? animationSrc("source-ball.webp", BLUE_ANIMATION_BASE) : src}
                  alt="" width="320" height="320" onError={() => setFailedAsset(src)} />}
          </div>
          <div className="clay-blue-reduced">
            <img className="clay-bot-clip" src={animationSrc(
              ["image.webp", "pop-shape.webp"].includes(clip) ? "source-unicorn.webp" : "source-ball.webp",
              BLUE_ANIMATION_BASE
            )} alt="" width="320" height="320" />
          </div>
        </>
      ) : <img key={src} className="clay-bot-clip" src={src} alt="" width="315" height="311" />}
    </div>
  );
}
