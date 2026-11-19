import { useEffect, useRef } from "react";
import { animationSrc, BLUE_ANIMATION_BASE } from "./animations.js";
import { recolorClayPixels } from "./clay-color.js";

const SIDE = 320;

/** Render the authored animated WebP on Canvas so only the clay pixels recolor.
 * The browser advances animated WebP frames; drawing the image captures its
 * current frame, with no separate facial layers drifting out of registration.
 */
export function ClayCanvas({ clip = "idle.webp", color, onError }) {
  const canvasRef = useRef(null);
  const onErrorRef = useRef(onError);
  const colorRef = useRef(color);
  onErrorRef.current = onError;
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    const buffer = document.createElement("canvas");
    buffer.width = buffer.height = SIDE;
    const bctx = buffer.getContext("2d", { willReadFrequently: true });
    let cancelled = false;
    let animationId = null;

    const image = new Image();
    image.decoding = "async";
    image.src = animationSrc(clip, BLUE_ANIMATION_BASE) + "?v=7-1-clay-color-v1";

    function draw() {
      if (cancelled) return;
      try {
        bctx.clearRect(0, 0, SIDE, SIDE);
        bctx.drawImage(image, 0, 0, SIDE, SIDE);
        const frame = bctx.getImageData(0, 0, SIDE, SIDE);
        recolorClayPixels(frame.data, colorRef.current);
        ctx.clearRect(0, 0, SIDE, SIDE);
        ctx.putImageData(frame, 0, 0);
      } catch {
        onErrorRef.current?.();
        return;
      }
      animationId = requestAnimationFrame(draw);
    }

    image.onload = () => {
      if (!cancelled) draw();
    };
    image.onerror = () => {
      if (!cancelled) onErrorRef.current?.();
    };
    return () => {
      cancelled = true;
      image.onload = image.onerror = null;
      if (animationId !== null) cancelAnimationFrame(animationId);
    };
  }, [clip]);

  return <canvas ref={canvasRef} width={SIDE} height={SIDE}
    className="clay-bot-clip clay-bot-canvas" aria-hidden="true" />;
}
