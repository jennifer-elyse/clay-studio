import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/** Extension to the public folder the app serves. */
const FOLDER_BY_EXT = {
  png: "images",
  jpg: "images",
  jpeg: "images",
  webp: "images",
  gif: "images",
  svg: "images",
  ico: "images",
  pdf: "docs",
  txt: "docs",
  md: "docs",
  csv: "docs",
  rtf: "docs",
  doc: "docs",
  docx: "docs",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  mp4: "video",
  webm: "video",
  mov: "video",
  woff: "fonts",
  woff2: "fonts",
  ttf: "fonts",
  otf: "fonts",
};

const MAX_BYTES = 4 * 1024 * 1024;
const TYPE_HINT = "Use an image, a document, audio, video, or a font.";
const SIZE_HINT = "Each file must be under 4 MB.";

export const ProjectFilesInput = z.object({
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Choose a file.").max(180),
        data: z.string().min(1, SIZE_HINT).max(6_000_000, SIZE_HINT),
      }),
    )
    .min(1, "Choose a file.")
    .max(8, "Upload up to 8 files at a time."),
});

/**
 * A safe public path for an upload, or null when the type is not allowed.
 * @param {string} raw
 * @returns {{ folder: string, name: string } | null}
 */
export function uploadTarget(raw) {
  const base = path.basename(String(raw)).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "");
  const ext = base.includes(".") ? base.split(".").pop().toLowerCase() : "";
  const folder = FOLDER_BY_EXT[ext];
  if (!folder) return null;
  const name = base.toLowerCase();
  if (name.length > 80) return null;
  return { folder, name };
}

/**
 * @param {string[]} paths
 * @returns {string}
 */
export function uploadMessage(paths) {
  const label = paths.length === 1 ? "file" : "files";
  return [`Saved ${paths.length} ${label} in this project.`, ...paths, "The app serves them from these paths."].join("\n");
}

/**
 * Copy uploads into the public folder for their type. Vite serves that folder at /.
 * @param {string} appDir
 * @param {{ name: string, data: string }[]} files
 * @returns {Promise<string[]>}
 */
export async function saveProjectFiles(appDir, files) {
  /** @type {{ dir: string, name: string, bytes: Buffer }[]} */
  const ready = [];
  /** @type {Set<string>} */
  const reserved = new Set();
  for (const file of files) {
    const target = uploadTarget(file.name);
    if (!target) throw new Error(TYPE_HINT);
    const bytes = decodeUpload(file.data);
    const dir = path.join(appDir, "client", "public", target.folder);
    const stored = await nextFileName(dir, target.name, reserved);
    reserved.add(path.join(dir, stored));
    ready.push({ dir, name: stored, bytes });
  }
  /** @type {string[]} */
  const saved = [];
  for (const file of ready) {
    await fs.mkdir(file.dir, { recursive: true });
    await fs.writeFile(path.join(file.dir, file.name), file.bytes);
    saved.push(`/${path.basename(file.dir)}/${file.name}`);
  }
  return saved;
}

/**
 * @param {string} data
 * @returns {Buffer}
 */
function decodeUpload(data) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new Error(`${TYPE_HINT} ${SIZE_HINT}`);
  const bytes = Buffer.from(data, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new Error(SIZE_HINT);
  return bytes;
}

/**
 * @param {string} dir
 * @param {string} name
 * @param {Set<string>} reserved
 */
async function nextFileName(dir, name, reserved) {
  const ext = path.extname(name);
  const stem = name.slice(0, -ext.length);
  let candidate = name;
  let n = 2;
  while (reserved.has(path.join(dir, candidate)) || (await fs.access(path.join(dir, candidate)).then(() => true).catch(() => false))) {
    candidate = `${stem}-${n}${ext}`;
    n += 1;
  }
  return candidate;
}
