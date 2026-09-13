import './title-scene.css';

const rearRacks = Array.from({ length: 15 }, (_, i) => ({ x: 164 + i * 77, y: 305 - i * 7 }));
const nearRacks = Array.from({ length: 7 }, (_, i) => ({ x: -40 + i * 97, y: 638 + i * 30 }));
const paths = [
  { id: 'customers', d: 'M145 370 350 477 578 359 843 497 1154 658', color: '#55dfff', dash: '9 29' },
  { id: 'orders', d: 'M156 390 359 496 582 381 846 518 1148 674', color: '#ffd077', dash: '9 71' },
  { id: 'cache', d: 'M735 445 895 362 1124 480', color: '#6cf5c7', dash: '9 36' },
  { id: 'bots', d: 'M145 348 336 449 290 485', color: '#ff6179', dash: '9 47' },
];

export function TitleWorld() {
  return <div className="title-world title-world-scene" aria-hidden="true" data-testid="title-world">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id="scene-floor" x2="0" y2="1"><stop stopColor="#3e526e"/><stop offset="1" stopColor="#152a43"/></linearGradient>
        <linearGradient id="scene-front" x2="1" y2=".3"><stop stopColor="#365273"/><stop offset=".5" stopColor="#172d48"/><stop offset="1" stopColor="#0c1d34"/></linearGradient>
        <linearGradient id="scene-roof" x2="1" y2="1"><stop stopColor="#b2cbdc"/><stop offset=".5" stopColor="#708dac"/><stop offset="1" stopColor="#3a597d"/></linearGradient>
        <linearGradient id="scene-core"><stop stopColor="#0e5184"/><stop offset=".32" stopColor="#46ccf5"/><stop offset=".6" stopColor="#157aab"/><stop offset="1" stopColor="#102b54"/></linearGradient>
        <radialGradient id="scene-blue"><stop stopColor="#20bfff" stopOpacity=".45"/><stop offset="1" stopColor="#00baff" stopOpacity="0"/></radialGradient>
        <radialGradient id="scene-warm"><stop stopColor="#ffc777" stopOpacity=".38"/><stop offset="1" stopColor="#ffd58f" stopOpacity="0"/></radialGradient>
        <pattern id="scene-tiles" width="100" height="52" patternUnits="userSpaceOnUse"><path d="M50 0 100 26 50 52 0 26Z" fill="none" stroke="#9ab6c4" strokeOpacity=".2"/><path d="M50 2 96 26" stroke="#deebef" strokeOpacity=".08"/></pattern>
        <pattern id="scene-vent" width="7" height="6" patternUnits="userSpaceOnUse"><rect width="5" height="3" rx="1" fill="#040f22"/><path d="M0 4H5" stroke="#718ca0" strokeWidth=".6"/></pattern>
        <pattern id="scene-hazard" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="18" height="18" fill="#15263b"/><rect width="7" height="18" fill="#d3a555"/></pattern>
        <filter id="scene-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
        <g id="scene-rack">
          <path d="m-7 24 63-32 64 33-63 34Z" fill="#061224" opacity=".65"/>
          <path d="M0-115 48-140 99-113 50-87Z" fill="url(#scene-roof)" stroke="#7897b0"/>
          <path d="M0-115 50-87V38L0 12Z" fill="url(#scene-front)" stroke="#436282"/>
          <path d="M50-87 99-113V12L50 38Z" fill="#081a30" stroke="#31516f"/>
          <path d="M7-101 42-83V24L7 6Z" fill="#09192c" stroke="#284965"/>
          {Array.from({ length: 7 }, (_, i) => <g key={i} transform={`translate(0 ${i * 14})`}><path d="m11-94 27 14v8l-27-14Z" fill="#25415e"/><path d="m14-91 16 8" stroke="#52718e"/><path d="m33-81 3 1.5" stroke="#51cfff" strokeWidth="3"/></g>)}
          <path d="m58-78 32-17V6L58 23Z" fill="url(#scene-vent)" stroke="#274461"/>
          <path d="M49-83V34" stroke="#2899d0" strokeWidth="2"/>
          <path d="m9-119 34-17 44 23-34 17Z" fill="url(#scene-vent)"/>
          <path d="m5 15 39 20" stroke="#bd984f" strokeWidth="3"/>
        </g>
        <g id="scene-module">
          <path d="m-9 5 49-25 58 30-49 25Z" fill="#06152b" opacity=".6"/>
          <path d="M0-71 39-91 81-69 42-49Z" fill="url(#scene-roof)" stroke="#bedced" strokeWidth="2"/>
          <path d="M0-71 42-49V24L0 3Z" fill="url(#scene-front)" stroke="#597ca0"/>
          <path d="M42-49 81-69V4L42 24Z" fill="#183451" stroke="#547ca0"/>
          <path d="m7-58 28 14v54L7-4Z" fill="#071d35"/>
          {[0,1,2,3].map(i => <g key={i} transform={`translate(0 ${i*12})`}><path d="m10-52 20 10" stroke="#4e7b9e" strokeWidth="3"/><path d="m28-43 4 2" stroke="#64e7ff" strokeWidth="3"/></g>)}
          <path d="m49-42 24-12v52L49 10Z" fill="url(#scene-vent)"/>
          <ellipse cx="40" cy="-70" rx="21" ry="10" fill="#123c60" stroke="#72d8fa"/>
          <path d="m25-71 29 3m-18-10 9 15" stroke="#46d7ff" strokeWidth="2"/>
          <path d="m2 6 40 21 37-19" fill="none" stroke="#56d9ff" strokeWidth="3"/>
        </g>
      </defs>

      <rect width="1440" height="900" fill="#061529"/>
      <path d="M-130 324 683-95 1580 370 748 1034Z" fill="url(#scene-floor)" stroke="#57748f" strokeWidth="4"/>
      <path d="M-130 324 683-95 1580 370 748 1034Z" fill="url(#scene-tiles)"/>
      <path d="M-55 313 657-55 657-230-55 138Z" fill="#10283f" stroke="#304b68"/>
      <path d="m657-55 850 440V205L657-230Z" fill="#132a41" stroke="#3d5871"/>
      {rearRacks.map((r, i) => <use key={i} href="#scene-rack" transform={`translate(${r.x} ${r.y}) scale(.82)`}/>)}
      {[190,440,700,975,1230].map((x, i) => <g key={x}><path d={`M${x} ${220+i*5}v-94l38-19v94Z`} fill="#2c4660" stroke="#50667d"/><path d={`m${x+5} ${134+i*5} 24-12`} stroke="#ffe0a4" strokeWidth="6"/><ellipse cx={x+25} cy={255+i*12} rx="86" ry="40" fill="url(#scene-warm)"/></g>)}
      <g stroke="#2f6a8d" fill="none"><path d="M-20 285 332 103 842 367 1320 120" strokeWidth="12"/><path d="M-20 281 332 99 842 363 1320 116" stroke="#3685ad" strokeWidth="3"/><path d="M-20 305 332 123 842 387 1320 140" stroke="#c89645" strokeWidth="4"/></g>
      {[ [340,565], [640,260], [1000,550], [875,674], [1235,390] ].map(([x,y]) => <g key={x} transform={`translate(${x} ${y})`}><path d="m0 0 67-34 66 34-67 35Z" fill="#557086" stroke="#8b9eae"/><path d="m7 0 60-29 57 29-59 29Z" fill="url(#scene-vent)"/></g>)}

      {paths.map(lane => <g key={lane.id} fill="none" strokeLinejoin="round"><path d={lane.d} stroke={lane.color} strokeWidth="30" opacity=".2" filter="url(#scene-glow)"/><path d={lane.d} stroke="#06172d" strokeWidth="35"/><path d={lane.d} stroke="#416181" strokeWidth="27"/><path d={lane.d} stroke={lane.color} strokeWidth="15" opacity=".2"/><path d={lane.d} stroke={lane.color} strokeWidth="3" opacity=".8"/><path d={lane.d} className={`title-flow title-flow-${lane.id}`} stroke={lane.color} strokeWidth="10" strokeDasharray={lane.dash}/><path d={lane.d} className={`title-flow title-flow-${lane.id}`} stroke="#f3ffff" strokeWidth="2" strokeDasharray={lane.dash}/></g>)}

      <ellipse cx="156" cy="375" rx="94" ry="43" fill="url(#scene-blue)"/>
      <g transform="translate(156 330)"><ellipse cy="40" rx="47" ry="23" fill="#102e48" stroke="#39c9ef" strokeWidth="3"/><circle r="39" fill="#0a3760" stroke="#67efff" strokeWidth="4"/><ellipse rx="18" ry="39" fill="none" stroke="#4dddff" strokeWidth="3"/><path d="M-37-12H37M-37 12H37M0-39V39" stroke="#4dddff" strokeWidth="2"/></g>

      <g transform="translate(365 461)">
        <ellipse cy="5" rx="100" ry="53" fill="url(#scene-blue)"/>
        <path d="m-66-8 57-29 94 48-57 30Z" fill="#304762" stroke="#6d94af" strokeWidth="3"/>
        <use href="#scene-module" transform="translate(-65 -25) scale(.6 1.5)"/><use href="#scene-module" transform="translate(27 20) scale(.6 1.5)"/>
        <path d="m-61-142 44-23 131 67-44 23Z" fill="url(#scene-roof)" stroke="#99bfce" strokeWidth="2"/>
        <path d="m-61-142 131 67v21l-131-67Z" fill="#24516c" stroke="#6eb6d4"/>
        <path d="m-42-126 96 50" stroke="#55e5ff" strokeWidth="6"/>
        <path d="m-13-109 55 28v83l-55-28Z" fill="#36d5ff" opacity=".15"/>
        <path d="m-10-93 48 25m-48 1 48 25m-48 1 48 25" stroke="#4ee8ff" strokeWidth="2" opacity=".7"/>
      </g>

      <g transform="translate(705 497)">
        <ellipse cy="25" rx="162" ry="82" fill="url(#scene-blue)"/>
        <path d="m-135-1 140-73 172 89-140 73Z" fill="#355777" stroke="#75a6c4" strokeWidth="3"/>
        <path d="m-135-1 172 89v16L-135 16Z" fill="#162f4d"/><path d="m37 88 140-73v17L37 104Z" fill="#0c2340"/>
        <path d="m-130 14 167 85 134-70" fill="none" stroke="#35c8ff" strokeWidth="4"/>
        <use href="#scene-rack" transform="translate(-28 -85) scale(1.12)"/>
        <use href="#scene-module" transform="translate(-104 0)"/><use href="#scene-module" transform="translate(-16 44)"/>
        <path d="m82 33 39-20 41 21-39 20Z" fill="#173b53" stroke="#6bd9df" strokeDasharray="5 4" strokeWidth="2"/>
        <path d="m104 33 34 0m-17-8v16" stroke="#70d3d7" strokeWidth="2"/>
      </g>

      <g transform="translate(989 393)">
        <ellipse cy="22" rx="108" ry="55" fill="url(#scene-blue)"/>
        <path d="m-72 0 85-44 107 55-86 44Z" fill="#326a75" stroke="#95d6cc" strokeWidth="2"/>
        {[0,1,2].map(i => <g key={i} transform={`translate(${-49+i*39} ${-5+i*20})`}><path d="M0-59 28-73 47-63 19-49Z" fill="#94bebb" stroke="#c4eee0"/><path d="M0-59 19-49V7L0-3Z" fill="#24515c"/><path d="M19-49 47-63V-7L19 7Z" fill="#163b48"/><path d="m23-43 19-10m-19 22 19-10m-19 22 19-10" stroke="#60f4c7" strokeWidth="3"/></g>)}
        <path d="m-67 6 101 52 79-41" fill="none" stroke="#6dffd0" strokeWidth="4"/>
      </g>

      <g transform="translate(1195 653)">
        <ellipse cy="10" rx="129" ry="68" fill="url(#scene-blue)"/>
        <path d="m-94-10 94-48 108 56-94 49Z" fill="url(#scene-roof)" stroke="#90b4cd" strokeWidth="3"/>
        {[0,1,2].map(i => <g key={i} transform={`translate(0 ${-i*39})`}><path d="M-62-53v41c0 39 126 39 126 0v-41Z" fill="url(#scene-core)" stroke="#5aadd0" strokeWidth="2"/><ellipse cy="-53" rx="63" ry="27" fill="#153d65" stroke="#77e4ff" strokeWidth="3"/><path d="M-57-15c12 29 103 29 116 0" fill="none" stroke="#38ccff" strokeWidth="3"/></g>)}
        <ellipse cy="-131" rx="43" ry="19" fill="#29c4ed"/><ellipse cy="-131" rx="32" ry="13" fill="#97faff"/>
        <use href="#scene-module" transform="translate(57 12) scale(.55 .9)"/>
      </g>

      <g className="scene-labels" fill="#d5f3ff" fontFamily="sans-serif" textAnchor="middle" fontSize="13" fontWeight="700">
        {[[156,410,'INTERNET'],[352,524,'PROTECTED EDGE'],[709,620,'APP SERVICE'],[1000,471,'CACHE'],[1210,722,'SQL CORE']].map(([x,y,name]) => <g key={name} transform={`translate(${x} ${y})`}><rect x="-65" y="-17" width="130" height="27" rx="5" fill="#071d34" stroke="#336782"/><text y="1">{name}</text></g>)}
      </g>
      <g opacity=".95">{nearRacks.map((r,i) => <use key={i} href="#scene-rack" transform={`translate(${r.x} ${r.y}) scale(1.18)`}/>)}</g>
      <g opacity=".8"><use href="#scene-rack" transform="translate(1325 818) scale(1.3)"/><use href="#scene-rack" transform="translate(1420 866) scale(1.3)"/></g>
      <path d="M-25 668 457 913M-25 690 435 926" stroke="#225676" strokeWidth="9"/>
      <path d="M-25 650 457 895" stroke="#d0a95c" strokeWidth="4"/>
      <path d="M90 732v-44m121 106v-44m121 106v-44" stroke="#46677e" strokeWidth="5"/>
    </svg>
  </div>;
}
