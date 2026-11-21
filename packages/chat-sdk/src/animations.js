/** Every registered slash command has a dedicated, stable WebP pathname. */
export const COMMAND_CLIPS = {
  constitution: "constitution.webp",
  spec: "spec.webp",
  clarify: "clarify.webp",
  plan: "plan.webp",
  checklist: "checklist.webp",
  tasks: "tasks.webp",
  analyze: "analyze.webp",
  build: "build.webp",
  converge: "converge.webp",
  help: "help.webp",
  summarize: "summarize.webp",
  upload: "upload.webp",
  seat: "seats.webp",
  think: "think.webp",
  run: "run.webp",
  clear: "clear.webp",
  settings: "settings.webp",
  reset: "new.webp",
  stop: "stop.webp",
  debug: "debug.webp",
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
export const BLUE_ANIMATION_BASE = "/assets/animations/blue";

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
