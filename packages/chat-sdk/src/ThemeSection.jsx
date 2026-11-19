const CHOICES = [
  { id: "classic", label: "Purple Clay", detail: "Default Clay appearance" },
  { id: "blue", label: "Blue Clay", detail: "A textured blue clay ball; /image morphs into a white unicorn with a rainbow spiral horn" },
];

/** @param {{ theme: "classic" | "blue", onTheme?: (value: "classic" | "blue") => void }} props */
export function ThemeSection({ theme, onTheme }) {
  return (
    <>
      <p className="clay-modal-lead">Pick how Clay looks. This browser remembers the choice.</p>
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
    </>
  );
}
