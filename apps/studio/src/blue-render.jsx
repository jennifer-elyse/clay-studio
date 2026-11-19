import { createRoot } from "react-dom/client";
import { BlueClayFigure } from "../../../packages/chat-sdk/src/BlueClayFigure.jsx";
import "../../../packages/chat-sdk/src/tokens.css";

const clip = new URLSearchParams(window.location.search).get("clip") ?? "idle.webp";
const root = document.getElementById("root");
root.style.cssText = "width:320px;height:320px;overflow:hidden;background:transparent";
createRoot(root).render(
  <div className="clay-root is-blue" style={{ width: 320, height: 320, minHeight: 320, background: "transparent" }}>
    <div className="clay-bot-stage is-blue" style={{ width: 320, height: 320, border: "none", boxShadow: "none", background: "transparent", overflow: "hidden" }}>
      <BlueClayFigure clip={clip} />
    </div>
  </div>,
);
