/** @param {{ direction?: "down" | "up" }} props */
export function Chevron({ direction = "down" }) {
  const path = direction === "up" ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6";
  return (
    <svg className="clay-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
