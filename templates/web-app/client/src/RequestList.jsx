/**
 * @param {object} props
 * @param {Array<{ id: string, title: string, status: string }>} props.items
 * @param {(id: string, status: string) => void} props.onPatch
 */
export function RequestList({ items, onPatch }) {
  return (
    <div className="card">
      <h2>Open requests</h2>
      {items.length === 0 ? <p>Nothing yet. File the first one.</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <div className="status">{item.status}</div>
            </div>
            {item.status === "submitted" ? (
              <div>
                <button className="ok" type="button" onClick={() => onPatch(item.id, "approved")}>
                  Approve
                </button>{" "}
                <button className="no" type="button" onClick={() => onPatch(item.id, "rejected")}>
                  Reject
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
