/**
 * One model name. Free text: the user is trusted, no catalog.
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {{ value: string, placeholder: string }} props.field
 * @param {boolean} props.disabled
 */
export function SeatModelField({ name, label, field, disabled }) {
  const id = `clay-seat-model-${name}`;
  return (
    <label className="clay-seat-model" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type="text"
        defaultValue={field.value}
        placeholder={field.placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}
