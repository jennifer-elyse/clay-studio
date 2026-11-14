import { useRef } from "react";
import { PRODUCT_SEATS } from "@cswg/agent-host/seats";
import { SeatActions } from "./SeatActions.jsx";
import { SeatChoices } from "./SeatChoices.jsx";
import { SeatConnection } from "./SeatConnection.jsx";
import { useDismiss } from "./use-dismiss.js";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.product]
 * @param {string} [props.current]
 * @param {(id: string) => void} props.onProduct
 * @param {(id: string) => void} props.onUse
 * @param {() => void} props.onClose
 */
export function SeatModal({ open, product = "", current = "", onProduct, onUse, onClose }) {
  const dialog = useRef(/** @type {HTMLDivElement | null} */ (null));
  useDismiss(open, dialog, onClose);
  if (!open) return null;
  const chosen = PRODUCT_SEATS.find((seat) => seat.id === product) ?? null;
  return (
    <div className="clay-modal-backdrop">
      <div
        ref={dialog}
        className="clay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clay-seats-title"
      >
        <h2 id="clay-seats-title">Which product?</h2>
        <p className="clay-modal-lead">Clay uses that account on this computer. Keys stay here.</p>
        <SeatChoices product={product} onProduct={onProduct} />
        {chosen ? <SeatConnection seat={chosen} /> : null}
        <SeatActions chosen={chosen} current={current} onUse={onUse} onClose={onClose} />
      </div>
    </div>
  );
}
