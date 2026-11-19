import { useId } from "react";
import { blueMotionForClip } from "./blue-motion.js";
import "./BlueClayFigure.css";

function Eye({ x, suffix, id }) {
  const clip = `${id}-eye-${suffix}`;
  return (
    <g className={`clay-eye is-${suffix}`}>
      <ellipse cx={x} cy="103" rx="34" ry="32" fill="url(#clay-socket)" />
      <ellipse cx={x} cy="100" rx="29" ry="28" fill="url(#clay-sclera)" />
      <clipPath id={clip}><ellipse cx={x} cy="100" rx="29" ry="28" /></clipPath>
      <g clipPath={`url(#${clip})`}>
        <g className="clay-gaze">
          <circle cx={x + 4} cy="105" r="16" fill="url(#clay-iris)" />
          <circle cx={x + 5} cy="105" r="8.5" fill="#081b34" />
          <ellipse cx={x - 1} cy="98" rx="4.8" ry="5.8" fill="#ffffff" opacity=".96" />
          <circle cx={x + 10} cy="111" r="2.3" fill="#a5dcff" opacity=".7" />
        </g>
        <path className="clay-eye-shutter" d={`M ${x - 36} 58 Q ${x} 48 ${x + 36} 58 L ${x + 36} 134 L ${x - 36} 134 Z`} fill="url(#clay-lid)" />
      </g>
      <path d={`M ${x - 32} 93 Q ${x - 29} 67 ${x - 7} 65 Q ${x + 22} 59 ${x + 31} 83`}
        stroke="url(#clay-lid)" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d={`M ${x - 25} 122 Q ${x} 140 ${x + 25} 119`}
        stroke="#2679bf" strokeWidth="9" fill="none" strokeLinecap="round" opacity=".95" />
      <path d={`M ${x - 23} 125 Q ${x} 134 ${x + 21} 123`}
        stroke="#8cc9f7" strokeWidth="2.2" fill="none" opacity=".45" strokeLinecap="round" />
    </g>
  );
}

function BlueBody({ id }) {
  return (
    <g className="clay-blue-body">
      <path d="M119 24 C154 20 192 39 210 72 C230 109 221 164 196 194 C174 222 130 226 96 217 C60 216 33 191 25 151 C16 115 25 75 54 49 C73 32 96 25 119 24 Z"
        fill="url(#clay-body)" stroke="#1d5d9b" strokeWidth="1.5" />
      <path d="M43 82 C52 54 73 43 96 35 M31 133 C25 113 34 96 39 90 M166 38 C190 50 205 75 211 95"
        stroke="#a7d9f5" strokeWidth="3" strokeLinecap="round" opacity=".24" fill="none" />
      <path d="M55 163 Q70 170 77 193 M170 196 Q190 174 193 154 M104 42 Q126 33 145 38"
        stroke="#143e72" strokeWidth="4.5" strokeLinecap="round" opacity=".16" fill="none" />
      <Eye x={85} suffix="left" id={id} />
      <Eye x={158} suffix="right" id={id} />
      <path d="M116 141 Q120 147 124 140" fill="none" stroke="#205e9c" strokeWidth="3" strokeLinecap="round" opacity=".28" />
      <path d="M119 24 C154 20 192 39 210 72 C230 109 221 164 196 194 C174 222 130 226 96 217 C60 216 33 191 25 151 C16 115 25 75 54 49 C73 32 96 25 119 24 Z"
        fill="#fff" opacity=".16" filter={`url(#${id}-grain)`} />
    </g>
  );
}

function Unicorn() {
  return (
    <g className="clay-unicorn">
      <ellipse cx="114" cy="196" rx="74" ry="18" fill="#204b74" opacity=".17" />
      <path d="M56 159 C38 124 52 89 76 81 C83 47 115 40 147 58 C176 57 195 85 193 115 C216 146 187 194 154 202 C103 215 75 191 56 159Z"
        fill="url(#clay-unicorn-white)" stroke="#c9c8e3" strokeWidth="2"/>
      <path d="M68 114 C52 96 48 66 65 57 C83 64 96 76 97 92Z" fill="#f8f4fa" stroke="#d1c4e2" strokeWidth="3"/>
      <path d="M72 84 Q67 75 65 66 Q81 70 87 86Z" fill="#f0a6cf"/>
      <path d="M161 90 C160 57 179 48 193 64 C192 89 183 100 173 105Z" fill="#f7f3fb" stroke="#d4c4df" strokeWidth="3"/>
      <path d="M171 88 Q175 70 187 65 Q188 84 175 94Z" fill="#f2b6d1"/>
      <path d="M110 69 C113 49 121 32 129 15 C140 32 148 48 147 70Z" fill="url(#clay-horn)" stroke="#d28e7f" strokeWidth="2"/>
      <path d="M117 56 Q129 49 144 55 M121 43 Q128 35 140 39 M125 29 Q129 25 135 28"
        fill="none" stroke="#b96cd4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M119 60 Q150 35 174 65 C186 79 172 93 158 90 C147 79 136 73 119 84Z"
        fill="url(#clay-mane)" stroke="#d79ece" strokeWidth="1.5"/>
      <path d="M168 88 C196 106 197 134 176 144 Q158 153 167 174" stroke="#86d7e9" strokeWidth="15" fill="none" strokeLinecap="round"/>
      <path d="M180 92 C206 119 198 147 181 152" stroke="#eca6d7" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M91 123 Q100 111 114 122 M145 123 Q157 111 167 125"
        fill="none" stroke="#615579" strokeWidth="5" strokeLinecap="round"/>
      <ellipse cx="133" cy="152" rx="42" ry="26" fill="url(#clay-unicorn-muzzle)"/>
      <ellipse cx="121" cy="153" rx="3" ry="2" fill="#c5a4bb"/>
      <path d="M125 168 Q141 177 156 163" stroke="#b878a5" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="55" cy="63" r="4" fill="#f7ca72"/><circle cx="196" cy="52" r="3" fill="#e4a8e7"/>
      <circle cx="209" cy="136" r="4" fill="#f6cf89"/><circle cx="31" cy="155" r="2.8" fill="#a8e7ef"/>
    </g>
  );
}

function Gradients({ id }) {
  return (
    <defs>
      <radialGradient id="clay-body" cx=".34" cy=".26" r=".79">
        <stop offset="0" stopColor="#91d1fc"/><stop offset=".24" stopColor="#55a9ea"/>
        <stop offset=".53" stopColor="#348ad6"/><stop offset=".79" stopColor="#2464ae"/>
        <stop offset="1" stopColor="#173b75"/>
      </radialGradient>
      <radialGradient id="clay-socket" cx=".4" cy=".32" r=".7">
        <stop stopColor="#1b568d"/><stop offset="1" stopColor="#0b2f59"/>
      </radialGradient>
      <radialGradient id="clay-sclera" cx=".29" cy=".22" r=".86">
        <stop stopColor="#fffef7"/><stop offset=".55" stopColor="#eaf0f3"/><stop offset="1" stopColor="#a5b9cc"/>
      </radialGradient>
      <radialGradient id="clay-iris" cx=".33" cy=".26" r=".85">
        <stop stopColor="#65b6ec"/><stop offset=".36" stopColor="#2271b6"/><stop offset=".79" stopColor="#103c76"/><stop offset="1" stopColor="#091c38"/>
      </radialGradient>
      <linearGradient id="clay-lid" x1="0" x2=".56" y1="0" y2="1">
        <stop stopColor="#92d1f5"/><stop offset=".3" stopColor="#479ddd"/><stop offset=".72" stopColor="#2b7dc5"/><stop offset="1" stopColor="#194f91"/>
      </linearGradient>
      <radialGradient id="clay-unicorn-white" cx=".35" cy=".25" r=".8">
        <stop stopColor="#fffefb"/><stop offset=".53" stopColor="#f7f5fa"/><stop offset="1" stopColor="#c5c7e1"/>
      </radialGradient>
      <radialGradient id="clay-unicorn-muzzle" cx=".3" cy=".2" r=".8">
        <stop stopColor="#fff"/><stop offset="1" stopColor="#e6dae9"/>
      </radialGradient>
      <linearGradient id="clay-mane" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#a2e1e8"/><stop offset=".34" stopColor="#c5a8f2"/><stop offset=".66" stopColor="#f5add2"/><stop offset="1" stopColor="#8ad8e5"/>
      </linearGradient>
      <linearGradient id="clay-horn" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#f9d584"/><stop offset=".45" stopColor="#eeb4cb"/><stop offset=".7" stopColor="#9fdce6"/><stop offset="1" stopColor="#e9bdef"/>
      </linearGradient>
      <filter id={`${id}-grain`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".23" numOctaves="2" seed="12" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope=".35"/></feComponentTransfer>
      </filter>
    </defs>
  );
}

/** A single scalable character rig. No detached CSS or raster eye overlays. */
export function BlueClayFigure({ clip = "idle.webp" }) {
  const id = useId().replace(/:/g, "-");
  return (
    <svg className="clay-blue-figure" data-motion={blueMotionForClip(clip)}
      data-blue-character="true" viewBox="0 0 240 240" role="presentation" aria-hidden="true">
      <Gradients id={id} />
      <ellipse className="clay-ground-shadow" cx="120" cy="215" rx="73" ry="13" fill="#173b75" opacity=".13" />
      <BlueBody id={id} />
      <Unicorn />
    </svg>
  );
}
