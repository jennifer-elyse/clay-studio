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
  const locked = document.documentElement.dataset.clay === "download";

  function submit() {
    const next = text.trim();
    if (!next || busy || locked) return;
    const sent = onSend(next);
    if (sent !== false) setText("");
  }

  return (
    <div className="clay-composer">
      <form action={() => submit()}>
        <textarea
          aria-label="Message"
          value={text}
          disabled={busy || locked}
          readOnly={locked}
          placeholder={locked ? "Download Clay Studio to use this" : busy ? "Working…" : "Ask Clay"}
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
