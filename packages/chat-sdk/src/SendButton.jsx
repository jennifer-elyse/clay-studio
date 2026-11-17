/** @param {{ stopping: boolean, empty: boolean, onCancel?: () => void }} props */
export function SendButton({ stopping, empty, onCancel }) {
  if (stopping) {
    return (
      <button className="clay-send" type="button" onClick={() => onCancel?.()}>
        Stop
      </button>
    );
  }
  return (
    <button className="clay-send" type="submit" disabled={empty} title={empty ? "Write a message to send." : undefined}>
      Send
    </button>
  );
}
