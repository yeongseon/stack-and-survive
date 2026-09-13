export function TitleWorld() {
  return <div className="title-world" aria-hidden="true" data-testid="title-world">
    <svg viewBox="0 0 760 260" focusable="false">
      <defs>
        <pattern id="title-floor" width="48" height="28" patternUnits="userSpaceOnUse"><path d="M24 0 48 14 24 28 0 14Z" fill="none" stroke="#7eaaaa" strokeOpacity=".15" /></pattern>
        <linearGradient id="title-wall" x2="0" y2="1"><stop stopColor="#395764"/><stop offset="1" stopColor="#152f3f"/></linearGradient>
      </defs>
      <path d="M30 40H730V215L650 250H90L30 215Z" fill="#203d49" stroke="#739598"/>
      <path d="M30 40H730V215L650 250H90L30 215Z" fill="url(#title-floor)"/>
      <path d="M30 40H730V90H30Z" fill="url(#title-wall)"/>
      {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`translate(${50+i*56} 45)`}><path d="M0 0H32V46H0Z" fill="#112d3b" stroke="#4f727c"/><path d="M5 8H25M5 17H25M5 26H25M5 35H25" stroke="#799fa8"/>{[8,17,26].map(y => <rect key={y} x="26" y={y} width="3" height="2" fill="#87d3bc" />)}</g>)}
      <path d="M90 176H265L380 165H660M380 165 520 130 660 176" fill="none" stroke="#102631" strokeWidth="16"/>
      <path d="M90 176H265L380 165H660M380 165 520 130 660 176" fill="none" stroke="#7acddd" strokeWidth="3" opacity=".6"/>
      <path className="title-flow" d="M90 176H265L380 165H660" fill="none" stroke="#8de5ec" strokeWidth="6" strokeDasharray="6 38"/>
      <path className="title-flow title-flow-orders" d="M110 184H265L380 174H660" fill="none" stroke="#f2cc79" strokeWidth="5" strokeDasharray="5 82"/>
      <image href="/assets/buildings/protected-edge.png" x="165" y="76" width="154" height="154"/>
      <image href="/assets/buildings/app-service.png" x="305" y="68" width="165" height="165"/>
      <image href="/assets/buildings/app-module.png" x="340" y="161" width="44" height="44"/>
      <image href="/assets/buildings/redis.png" x="463" y="60" width="130" height="130"/>
      <image href="/assets/buildings/azure-sql.png" x="573" y="56" width="178" height="178"/>
      <g fill="#c1e8f0"><circle cx="85" cy="140" r="20"/><circle cx="64" cy="148" r="14"/><circle cx="104" cy="148" r="15"/><rect x="61" y="144" width="48" height="18" rx="8"/></g>
      <path d="M84 158V175M78 169 84 175 90 169" fill="none" stroke="#8bdce2" strokeWidth="3"/>
      <path d="M50 220H710" stroke="#c2b282" strokeWidth="2" strokeDasharray="14 7"/>
    </svg>
  </div>;
}
