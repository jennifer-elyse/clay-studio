import { PRODUCT_SEATS } from "@cswg/agent-host/seats";
import { AdvancedSeatOptions } from "./AdvancedSeatOptions.jsx";
import { SeatActions } from "./SeatActions.jsx";
import { SeatChoices } from "./SeatChoices.jsx";
import { SeatConnection } from "./SeatConnection.jsx";

/**
 * @param {object} props
 * @param {string} props.product
 * @param {string} props.current
 * @param {boolean} props.busy
 * @param {object | null} [props.seatSettings]
 * @param {(input: object) => Promise<{ ok: boolean, message?: string }>} [props.onSaveSettings]
 * @param {(id: string) => void} props.onProduct
 * @param {(id: string) => void} props.onUse
 */
export function SeatSection({ product, current, busy, seatSettings = null, onSaveSettings, onProduct, onUse }) {
  const chosen = PRODUCT_SEATS.find((seat) => seat.id === product) ?? null;
  return (
    <>
      <p className="clay-modal-lead">Clay uses that account on this computer. Keys stay here.</p>
      <SeatChoices product={product} onProduct={onProduct} />
      {chosen ? <AdvancedSeatOptions seat={chosen.id} settings={seatSettings} onSave={onSaveSettings} /> : null}
      {chosen ? <SeatConnection seat={chosen} /> : null}
      <SeatActions chosen={chosen} current={current} busy={busy} onUse={onUse} />
    </>
  );
}
