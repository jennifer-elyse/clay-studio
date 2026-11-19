/**
 * Each legacy blue WebP retains its dedicated pathname. For the visible
 * Blue Gumby character, render motions from one shared scalable rig instead:
 * eyes, eyelids, and body can no longer drift on separate image timelines.
 * @param {string} clip
 */
export function blueMotionForClip(clip) {
  const name = String(clip).replace(/\.webp$/, "");
  if (["image", "pop-shape"].includes(name)) return "morph";
  if (["rolling", "run"].includes(name)) return "roll";
  if (["plan", "think", "spec", "summarize"].includes(name)) return "think";
  if (["build", "code", "write", "fix", "debug", "docs"].includes(name)) return "focus";
  if (["help", "settings", "new", "seats"].includes(name)) return "bounce";
  if (["interested", "search", "upload"].includes(name)) return "interested";
  if (["judging", "concerned"].includes(name)) return name;
  if (["clear", "stop"].includes(name)) return "settle";
  return "idle";
}
