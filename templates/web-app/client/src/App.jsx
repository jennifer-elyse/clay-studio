import { useEffect, useState } from "react";
import { createRequest, listRequests, patchRequest } from "./api.js";
import { RequestForm } from "./RequestForm.jsx";
import { RequestList } from "./RequestList.jsx";

export function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    const data = await listRequests();
    setItems(data.items);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Request tracker</h1>
      <p>Synthetic store requests. No customer data.</p>
      {error ? <p role="alert">{error}</p> : null}
      <RequestForm
        onCreate={async (input) => {
          await createRequest(input);
          await refresh();
        }}
      />
      <RequestList
        items={items}
        onPatch={async (id, status) => {
          await patchRequest(id, status);
          await refresh();
        }}
      />
    </main>
  );
}
