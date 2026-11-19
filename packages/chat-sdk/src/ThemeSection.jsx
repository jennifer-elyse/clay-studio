/** @param {{ theme: "classic" | "blue", onTheme?: (value: "classic" | "blue") => void }} props */
export function ThemeSection({ theme, onTheme }) {
  const choices = [
    { id: "classic", label: "Purple Clay", detail: "Default Clay appearance" },
    { id: "blue", label: "Blue Clay", detail: "A textured blue clay ball; /image morphs into a white unicorn with a rainbow spiral horn" },
  ];
  return (
    <div className="clay-theme-options" role="group" aria-label="Clay appearance">
      {choices.map((choice) => (
        <button key={choice.id} type="button" className="clay-theme-choice" aria-pressed={theme === choice.id} onClick={() => onTheme?.(choice.id)}>
          <strong>{choice.label}</strong>
          <small>{choice.detail}</small>
        </button>
      ))}
    </div>
  );
}
