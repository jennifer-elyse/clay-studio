/** Slash commands whose filename matches the command name (reset → new). */
export const COMMAND_CLIPS = {
  help: "help.webp",
  clear: "clear.webp",
  search: "search.webp",
  think: "think.webp",
  summarize: "summarize.webp",
  write: "write.webp",
  code: "code.webp",
  image: "image.webp",
  settings: "settings.webp",
  reset: "new.webp",
};

/** Clips without a slash-command name — used at random. */
export const AMBIENT_CLIPS = [
  "idle.webp",
  "blink.webp",
  "rolling.webp",
  "pop-shape.webp",
  "interested.webp",
  "judging.webp",
  "concerned.webp",
];

export const ANIMATION_BASE = "/assets/animations";

/**
 * @param {string | null | undefined} commandId
 * @param {object} [opts]
 * @param {string} [opts.previous]
 * @param {() => number} [opts.random]
 */
export function clipForCommand(commandId, opts = {}) {
  if (commandId && COMMAND_CLIPS[commandId]) return COMMAND_CLIPS[commandId];
  const previous = opts.previous;
  const random = opts.random ?? Math.random;
  const pool = AMBIENT_CLIPS.filter((name) => name !== previous);
  const list = pool.length > 0 ? pool : AMBIENT_CLIPS;
  return list[Math.floor(random() * list.length)];
}

/**
 * @param {string} file
 * @param {string} [base]
 */
export function animationSrc(file, base = ANIMATION_BASE) {
  return `${base}/${file}`;
}
