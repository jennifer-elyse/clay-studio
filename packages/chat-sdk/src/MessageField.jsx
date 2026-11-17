/**
 * @param {boolean} locked
 * @param {boolean} busy
 * @param {boolean} editing
 */
function placeholder(locked, busy, editing) {
  if (locked) return "Download Clay Studio to use this";
  if (busy) return "Working…";
  if (editing) return "Edit your message";
  return "Ask Clay";
}

/** @param {object} props */
export function MessageField(props) {
  const { text, locked, busy, editing, onChange, onSubmit } = props;
  return (
    <textarea
      aria-label="Message"
      value={text}
      disabled={busy || locked}
      readOnly={locked}
      placeholder={placeholder(locked, busy, editing)}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}
