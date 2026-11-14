import { PRODUCT_SEATS } from "@cswg/agent-host/seats";

/**
 * @param {object} props
 * @param {string} props.product
 * @param {(id: string) => void} props.onProduct
 */
export function SeatChoices({ product, onProduct }) {
  return (
    <div className="clay-seat-choices" role="radiogroup" aria-label="Product">
      {PRODUCT_SEATS.map((seat) => (
        <button
          key={seat.id}
          type="button"
          role="radio"
          aria-checked={product === seat.id}
          className={`clay-seat-choice${product === seat.id ? " is-selected" : ""}`}
          onClick={() => onProduct(seat.id)}
        >
          <strong>{seat.label}</strong>
          <span>{seat.summary}</span>
        </button>
      ))}
    </div>
  );
}
