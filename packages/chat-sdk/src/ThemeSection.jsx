import { CLAY_COLOR_PRESETS, DEFAULT_CLAY_COLOR } from "./clay-color.js";

const CHOICES = [
  { id: "classic", label: "Purple Clay", detail: "Original Clay appearance" },
  { id: "blue", label: "Clay", detail: "Sculpted clay mascot with customizable color and unicorn transformation" },
];

/** Theme is kept compatible with existing stored 'blue' values. */
export function ThemeSection({ theme, onTheme, clayColor = DEFAULT_CLAY_COLOR, onClayColor }) {
  return (
    <>
      <p className="clay-modal-lead">Choose Clay's appearance. Your browser remembers your preferences.</p>
      <div className="clay-theme-options" role="group" aria-label="Clay appearance">
        {CHOICES.map((choice) => {
          const selected = theme === choice.id;
          return (
            <button key={choice.id} type="button" className="clay-theme-choice" aria-pressed={selected} onClick={() => onTheme?.(choice.id)}>
              <strong>{choice.label}</strong>
              <small>{choice.detail}</small>
              <span className="clay-theme-state">{selected ? "Selected" : "Available"}</span>
            </button>
          );
        })}
      </div>
      {theme === "blue" && (
        <div className="clay-colors">
          <h3>Clay color</h3>
          <p className="clay-modal-lead">Change the clay body without changing its eyes, mouth or unicorn shape.</p>
          <div className="clay-color-presets" role="group" aria-label="Clay color presets">
            {CLAY_COLOR_PRESETS.map(({ name, value }) => (
              <button key={value} type="button" aria-label={name} aria-pressed={clayColor.toUpperCase() === value}
                title={name} className="clay-color-choice" style={{ "--clay-choice-color": value }}
                onClick={() => onClayColor?.(value)}>
                <span className="clay-color-swatch" />{name}
              </button>
            ))}
          </div>
          <label className="clay-color-custom">
            <span>Custom color</span>
            <input type="color" aria-label="Custom Clay color" value={clayColor}
              onChange={(event) => onClayColor?.(event.target.value)} />
            <output>{clayColor.toUpperCase()}</output>
          </label>
        </div>
      )}
    </>
  );
}
