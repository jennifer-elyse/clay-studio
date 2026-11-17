import { useState } from "react";
import { EditBanner } from "./EditBanner.jsx";
import { MessageField } from "./MessageField.jsx";
import { SendButton } from "./SendButton.jsx";
import { useEscape } from "./use-escape.js";

/** @param {object} props */
export function Composer(props) {
  const { onSend, onCancel, busy = false, editing = false, onCancelEdit, value, onChange } = props;
  const [inner, setInner] = useState("");
  const text = value ?? inner;
  const setText = onChange ?? setInner;
  const locked = document.documentElement.dataset.clay === "download";
  const stopping = busy && !locked;
  useEscape(stopping, onCancel);
  useEscape(!stopping && editing, onCancelEdit);

  function submit() {
    const next = text.trim();
    if (!next || busy || locked) return;
    if (onSend(next) !== false) setText("");
  }

  return (
    <div className="clay-composer">
      {editing ? <EditBanner onCancel={() => onCancelEdit?.()} /> : null}
      <form action={() => submit()}>
        <MessageField text={text} locked={locked} busy={busy} editing={editing} onChange={setText} onSubmit={submit} />
        <SendButton stopping={stopping} empty={!text.trim()} onCancel={onCancel} />
      </form>
      <p className="clay-banner">Do not paste customer, payment, HR, or secret data.</p>
    </div>
  );
}
