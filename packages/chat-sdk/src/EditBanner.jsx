/** @param {{ onCancel: () => void }} props */
export function EditBanner({ onCancel }) {
  return (
    <p className="clay-editing" role="status">
      Editing a message.
      <button type="button" className="clay-quiet" onClick={onCancel}>
        Cancel edit
      </button>
    </p>
  );
}
