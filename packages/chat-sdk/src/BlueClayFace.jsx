import "./BlueClayFace.css";

/** Eye material is layered over the ball without replacing WebP frames. */
function SculptedEye({ side }) {
  return (
    <span className={`clay-blue-eye is-${side}`}>
      <span className="clay-blue-eye-inner">
        <span className="clay-blue-eye-iris" />
      </span>
      <span className="clay-blue-eye-lid is-upper" />
      <span className="clay-blue-eye-lid is-lower" />
    </span>
  );
}

/** The eye layer shares the sphere's canvas and rolling transforms. */
export function BlueClayFace() {
  return (
    <div className="clay-blue-face" aria-hidden="true" data-eyes="sculpted">
      <SculptedEye side="left" />
      <SculptedEye side="right" />
    </div>
  );
}
