import { useEffect, useRef } from "react";
import { BLUE_ANIMATION_BASE } from "./animations.js";
import { CLAY_MATERIAL_VERSION, composeClayMaterial } from "./clay-color.js";

const SIDE = 320;

/** One animated four-panel WebP shares its clock across the original artwork,
 * neutral diffuse/body mask, light and specular. No color-keying at runtime.
 */
export function ClayCanvas({ clip = "idle.webp", color, paused = false, onError }) {
  const canvasRef = useRef(null);
  const colorRef = useRef(color);
  const errorRef = useRef(onError);
  colorRef.current = color;
  errorRef.current = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!ctx) {
      errorRef.current?.();
      return undefined;
    }
    const buffer = document.createElement("canvas");
    buffer.width = buffer.height = SIDE * 2;
    const bctx = buffer.getContext("2d", { willReadFrequently: true });
    if (!bctx) {
      errorRef.current?.();
      return undefined;
    }
    let cancelled = false;
    let animationId = null;
    let lastDraw = -Infinity;
    const image = new Image();
    image.decoding = "async";

    function draw(timestamp) {
      if (cancelled) return;
      if (timestamp - lastDraw >= 32) {
        try {
          bctx.clearRect(0, 0, SIDE * 2, SIDE * 2);
          bctx.drawImage(image, 0, 0, SIDE * 2, SIDE * 2);
          const original = bctx.getImageData(0, 0, SIDE, SIDE);
          const diffuse = bctx.getImageData(SIDE, 0, SIDE, SIDE);
          const light = bctx.getImageData(0, SIDE, SIDE, SIDE);
          const specular = bctx.getImageData(SIDE, SIDE, SIDE, SIDE);
          composeClayMaterial(original, diffuse, light, specular, colorRef.current);
          ctx.putImageData(original, 0, 0);
          lastDraw = timestamp;
        } catch {
          errorRef.current?.();
          return;
        }
      }
      if (!paused) animationId = requestAnimationFrame(draw);
    }

    image.onload = () => {
      if (!cancelled) animationId = requestAnimationFrame(draw);
    };
    image.onerror = () => {
      if (!cancelled) errorRef.current?.();
    };
    image.src = BLUE_ANIMATION_BASE + "/material/" + clip + "?v=" + CLAY_MATERIAL_VERSION;

    return () => {
      cancelled = true;
      image.onload = image.onerror = null;
      if (animationId !== null) cancelAnimationFrame(animationId);
    };
  }, [clip, paused]);

  return <canvas ref={canvasRef} width={SIDE} height={SIDE}
    className="clay-bot-clip clay-bot-canvas" aria-hidden="true" />;
}
