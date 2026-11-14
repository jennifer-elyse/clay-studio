import { useState } from "react";

/**
 * @param {object} props
 * @param {(text: string) => void} props.onSend
 * @param {boolean} [props.busy]
 * @param {string} [props.value]
 * @param {(value: string) => void} [props.onChange]
 */
export function Composer({ onSend, busy = false, value, onChange }) {
  const [inner, setInner] = useState("");
  const text = value ?? inner;
  const setText = onChange ?? setInner;

  function submit() {
    const next = text.trim();
    if (!next || busy) return;
    onSend(next);
    setText("");
  }

  return (
    <div className="clay-composer">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          aria-label="Message"
          value={text}
          disabled={busy}
          placeholder={busy ? "Working…" : "Ask Clay"}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button className="clay-send" type="submit" disabled={busy || !text.trim()}>
          Send
        </button>
      </form>
      <p className="clay-banner">Do not paste customer, payment, HR, or secret data.</p>
    </div>
  );
}
