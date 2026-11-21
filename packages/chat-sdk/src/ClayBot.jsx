import { ANIMATION_BASE, BLUE_ANIMATION_BASE, animationSrc } from "./animations.js";
import { useState } from "react";
import { ClayCanvas } from "./ClayCanvas.jsx";
import { DEFAULT_CLAY_COLOR } from "./clay-color.js";
import "./styles/main.scss";

/**
 * @param {object} props
 * @param {string} [props.clip]
 * @param {"md" | "lg"} [props.size]
 * @param {string} [props.base]
 * @param {"classic" | "blue"} [props.theme]
 * @param {string} [props.clayColor]
 */
export function ClayBot({ clip = "idle.webp", size = "md", base = ANIMATION_BASE, theme = "classic", clayColor = DEFAULT_CLAY_COLOR }) {
  const [failedAsset, setFailedAsset] = useState("");
  const src = animationSrc(clip, theme === "blue" ? BLUE_ANIMATION_BASE : base);
  const assetSrc = theme === "blue" ? `${src}?v=clay-materials-v2` : src;
  return (
    <div className={`clay-bot-stage is-${size} is-${theme}`} aria-hidden="true" data-clip={clip}>
      {theme === "blue" ? (
        <>
          <div className="clay-blue-animated">
            {failedAsset === assetSrc
              ? <img className="clay-bot-clip" src={animationSrc("source-ball.webp", BLUE_ANIMATION_BASE)} alt="" />
              : <ClayCanvas clip={clip} color={clayColor} onError={() => setFailedAsset(assetSrc)} />}
          </div>
          <div className={`clay-blue-reduced${["image.webp", "pop-shape.webp"].includes(clip) ? " is-unicorn" : " is-ball"}`}>
            {["image.webp", "pop-shape.webp"].includes(clip)
              ? <img src={animationSrc("reference-atlas.webp", BLUE_ANIMATION_BASE)} alt="" width="640" height="640" />
              : <ClayCanvas clip={clip} color={clayColor} paused onError={() => setFailedAsset(assetSrc)} />}
          </div>
        </>
      ) : <img key={src} className="clay-bot-clip" src={src} alt="" width="315" height="311" />}
    </div>
  );
}
