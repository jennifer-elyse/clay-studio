/**
 * @param {object} props
 * @param {import("@cswg/agent-host/seats").ProductSeat} props.seat
 */
export function SeatConnection({ seat }) {
  return (
    <section className="clay-seat-details" aria-label={`${seat.label} connection`}>
      <h3>Connection</h3>
      <ul>
        {seat.details.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
