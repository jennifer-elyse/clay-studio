import { useEffect, useRef } from "react";

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      resolve(text.slice(text.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * @param {File[]} files
 */
export async function postProjectImages(files) {
  const payload = [];
  for (const file of files) {
    const data = file.size > 4 * 1024 * 1024 ? "" : await fileData(file);
    payload.push({ name: file.name, data });
  }
  await fetch("/api/project-files", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ files: payload }),
  });
}

/**
 * Hidden file input. The Upload command calls `opener.current`.
 * @param {{ opener: { current: (() => void) | null }, project: { name?: string } | null }} props
 */
export function ImageUpload({ opener, project }) {
  const input = useRef(null);
  useEffect(() => {
    opener.current = () => {
      if (!project) {
        void postProjectImages([]);
        return;
      }
      const node = input.current;
      if (!node) return;
      node.value = "";
      node.click();
    };
    return () => {
      opener.current = null;
    };
  }, [opener, project]);
  return (
    <input
      ref={input}
      type="file"
      accept="image/*,.svg,.pdf,.txt,.md,.csv,.rtf,.doc,.docx,audio/*,video/*,.woff,.woff2,.ttf,.otf"
      multiple
      hidden
      aria-label="Files to add to this project"
      onChange={(event) => {
        const picked = [...(event.target.files ?? [])];
        event.target.value = "";
        if (picked.length > 0) void postProjectImages(picked);
      }}
    />
  );
}
