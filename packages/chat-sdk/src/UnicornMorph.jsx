/** A handcrafted clay-unicorn silhouette revealed by the blue sphere's /image action. */
export function UnicornMorph() {
  return (
    <svg className="clay-blue-unicorn" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="clay-unicorn-white" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset=".6" stopColor="#f8f9ff" /><stop offset="1" stopColor="#d6ddeb" /></linearGradient>
        <linearGradient id="clay-unicorn-horn" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff91cd"/><stop offset=".25" stopColor="#ffd66c"/><stop offset=".5" stopColor="#8fda96"/><stop offset=".75" stopColor="#61b8fa"/><stop offset="1" stopColor="#bd87f6"/></linearGradient>
      </defs>
      <path d="M36 95 Q11 67 29 51 Q19 80 46 79" fill="#a9c7ef" stroke="#c9d6ed" strokeWidth="3"/>
      <path d="M47 76 C31 87 39 115 50 118 L48 144 Q56 152 66 143 L69 120 L93 121 L97 145 Q108 152 115 142 L115 105 Q126 78 99 67 Z" fill="url(#clay-unicorn-white)" stroke="#bec8d7" strokeWidth="2.5"/>
      <path d="M94 75 C92 57 105 43 119 47 Q138 49 145 64 Q154 70 143 81 L126 89 L114 90 Z" fill="url(#clay-unicorn-white)" stroke="#bec8d7" strokeWidth="2.5"/>
      <path d="M103 49 Q91 26 103 27 Q117 29 117 47" fill="#fdfcff" stroke="#b6c0d0" strokeWidth="2.5"/>
      <path d="M106 43 Q101 36 106 36 Q112 37 112 45" fill="#f6adc6"/>
      <path d="M121 49 L127 11 L137 49 Z" fill="url(#clay-unicorn-horn)" stroke="#d9b0cc" strokeWidth="2"/>
      <path d="M124 23 L132 30 M123 33 L135 40 M122 43 L137 48" fill="none" stroke="#fff6d4" strokeWidth="3" strokeLinecap="round"/>
      <path d="M108 49 Q95 50 100 63 Q88 67 95 80" fill="none" stroke="#cad5ef" strokeWidth="10" strokeLinecap="round"/>
      <circle cx="135" cy="67" r="2.8" fill="#3a536d"/>
      <path d="M140 79 q-5 5 -10 1" fill="none" stroke="#9e9bb0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
