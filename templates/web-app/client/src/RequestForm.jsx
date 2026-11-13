import { useState } from "react";

/**
 * @param {object} props
 * @param {(input: { title: string, detail: string }) => Promise<void>} props.onCreate
 */
export function RequestForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onCreate({ title, detail });
        setTitle("");
        setDetail("");
      }}
    >
      <h2>New request</h2>
      <p>
        <label>
          Title
          <br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
      </p>
      <p>
        <label>
          Detail
          <br />
          <textarea value={detail} onChange={(e) => setDetail(e.target.value)} />
        </label>
      </p>
      <button className="primary" type="submit">
        Submit
      </button>
    </form>
  );
}
