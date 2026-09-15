const palette = { top: '#7b929e', left: '#354f60', right: '#1b3448', dark: '#101f2d', light: '#b9cdd2', cyan: '#6be4eb', amber: '#efbb69', green: '#81efc6' };
const project = (x, y, z = 0) => [320 + (x - y) * 1.35, 398 + (x + y) * .65 - z];
const bevelMaterials = (art, prefix) => {
  const colors=[...new Set([...art.matchAll(/data-material="(#[a-f0-9]{6})"/g)].map(match=>match[1]))];
  const materials=colors.map(color=>`<linearGradient id="${prefix}material-${color.slice(1)}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${shade(color,23)}"/><stop offset=".18" stop-color="${shade(color,7)}"/><stop offset=".65" stop-color="${color}"/><stop offset="1" stop-color="${shade(color,-21)}"/></linearGradient>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs>${materials}</defs><g>${art.replaceAll('url(#material-',`url(#${prefix}material-`)}</g></svg>`;
};
const shade = (color, amount) => `#${[1,3,5].map(offset=>Math.max(0,Math.min(255,parseInt(color.slice(offset,offset+2),16)+amount)).toString(16).padStart(2,'0')).join('')}`;
const polygon = (points, fill, stroke = '#172d3d', width = 1) => {
  const id = `material-${fill.slice(1)}`;
  return `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="url(#${id})" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" data-material="${fill}"/>`;
};
const plane = (x,y,z,w,d,color,stroke) => polygon([project(x,y,z),project(x+w,y,z),project(x+w,y+d,z),project(x,y+d,z)],color,stroke);
const box = (x,y,z,w,d,h,top=palette.top,left=palette.left,right=palette.right) =>
  polygon([project(x,y+d,z),project(x+w,y+d,z),project(x+w,y+d,z+h),project(x,y+d,z+h)],left)
  + polygon([project(x+w,y,z),project(x+w,y+d,z),project(x+w,y+d,z+h),project(x+w,y,z+h)],right)
  + plane(x,y,z+h,w,d,top)
  + line([x,y+d,z+h],[x+w,y+d,z+h],shade(top,25),1.2)
  + line([x+w,y+d,z+h],[x+w,y,z+h],shade(top,5),1)
  + line([x+w,y+d,z+h],[x+w,y+d,z],shade(left,15),1);
const line = (a,b,color,width=2) => { const p=project(...a),q=project(...b); return `<path d="M${p}L${q}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`; };
const vent = (x,y,z,w,d,n=9) => Array.from({length:n},(_,i)=>line([x+i*w/n,y,z],[x+i*w/n,y+d,z],'#263e50',2)).join('');
const trim = (x,y,z,w,d,color) => `<g opacity=".14">${line([x,y+d,z],[x+w,y+d,z],color,10)}${line([x+w,y+d,z],[x+w,y,z],color,8)}</g>`+line([x,y+d,z],[x+w,y+d,z],color,2)+line([x+w,y+d,z],[x+w,y,z],color,1.5);
const pedestal = () => plane(-109,-109,-6,220,220,'#071823') + box(-100,-100,0,200,200,13,'#3a5363','#182d40','#102335') + box(-94,-94,13,188,188,6,'#526a78','#2d4657','#233b4c');
const cabinet = (x,y,z,w=38,d=36,h=90,color=palette.cyan) => {
  let art = box(x,y,z,w,d,h) + box(x+3,y+3,z+h,w-6,d-6,4,'#8c9da5');
  art += line([x+w,y+4,z+7],[x+w,y+4,z+h-8],'#162b3c',2)
    + line([x+w,y+d-4,z+7],[x+w,y+d-4,z+h-8],'#708996',1);
  for(let i=0;i<8;i++) art+=line([x+w+.2,y+7,z+12+i*5],[x+w+.2,y+d-7,z+12+i*5],'#112736',1.5);
  art += polygon([project(x+4,y+d+.2,z+8),project(x+w-4,y+d+.2,z+8),project(x+w-4,y+d+.2,z+h-8),project(x+4,y+d+.2,z+h-8)],palette.dark);
  for(let i=0;i<7;i++) {
    const level=z+14+i*(h-28)/7;
    art += line([x+7,y+d+.5,level],[x+w-7,y+d+.5,level],'#5b7380',1.5);
    art += line([x+w-10,y+d+1,level+3],[x+w-6,y+d+1,level+3],color,2.5);
    art += line([x+8,y+d+1,level+2],[x+w-15,y+d+1,level+2],'#81929b',.7);
  }
  for(const dx of [3,w-3]) for(const dz of [5,h-5]) {
    const p=project(x+dx,y+d+.5,z+dz); art+=`<circle cx="${p[0]}" cy="${p[1]}" r="1.2" fill="#b4c2c5"/>`;
  }
  return art + vent(x+6,y+6,z+h+4,w-12,d-12,6);
};
const fan = (x,y,z,r) => {
  const p=project(x,y,z);
  return `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${r*1.35}" ry="${r*.65}" fill="#142c3b" stroke="#8ba0a9" stroke-width="3"/><ellipse cx="${p[0]}" cy="${p[1]}" rx="${r*.85}" ry="${r*.41}" fill="none" stroke="#526c7e" stroke-width="3"/>`+line([x-r*.65,y,z],[x+r*.65,y,z],'#849da5',2)+line([x,y-r*.65,z],[x,y+r*.65,z],'#849da5',2);
};
export const bayOrigins = [[-70,-70], [6,-70], [-70,6], [6,6]];
export const coreGeometry = {
  canvas: { width: 640, height: 640 },
  origin: { x: 320, y: 398 },
  footprint: [[-100,-100],[100,-100],[100,100],[-100,100]].map(([x,y])=>project(x,y,19)),
  appBays: bayOrigins.map(([x,y],index)=>({
    index,
    center: project(x+32.5,y+32.5,24),
    footprint: [[x,y],[x+65,y],[x+65,y+65],[x,y+65]].map(([bx,by])=>project(bx,by,24)),
    moduleOffset: { x: ((x+29)-(y+28))*1.35, y: ((x+29)+(y+28))*.65 },
  })),
};
const module = (x,y) => `<g data-active-module="true">${cabinet(x+4,y+5,24,49,47,98) + box(x+10,y+11,126,36,34,6,'#9cb0b7') + fan(x+28,y+28,134,12)}</g>`;
function appBase() {
  let art=pedestal()+box(-94,-92,19,16,184,23,'#8b9ba1')+box(-78,-92,19,169,13,23,'#8297a1');
  for (const [x,y] of bayOrigins) {
    art+=box(x,y,19,65,65,4,'#142a3a')+plane(x+6,y+6,23.5,53,53,'#223e50','#7794a0');
    for (const dx of [3,59]) art+=box(x+dx,y+5,24,3,55,3,'#8b9d9f');
    for(let i=0;i<5;i++) art+=box(x+20+i*5,y+52,24,3,4,2,'#bf995f');
  }
  art+=vent(-91,-75,42,9,132,4);
  for(let i=0;i<7;i++) art+=box(-62+i*20,-90,42,12,8,2,'#334f60');
  return art + trim(-94,-94,23,188,188,'#6eb4c4');
}
function intake() {
  let art=pedestal();
  for (let i=0;i<3;i++) art+=box(-132,-55+i*42,20,92,23,22,'#617f8d')+trim(-132,-55+i*42,39,92,23,palette.cyan);
  art+=box(-52,-70,19,105,135,58)+box(-60,-76,77,122,145,9,'#a3b8bf');
  art+=box(-35,-55,86,68,105,34,'#55788b')+vent(-29,-49,120,56,93,12);
  art+=box(42,-18,28,52,46,48,'#bed0cf')+plane(47,-13,77,42,36,'#193e56');
  art+=trim(-60,-76,88,122,145,palette.cyan);
  for(let i=0;i<4;i++) art+=line([-40+i*22,65,30],[-40+i*22,65,66],'#7595a7',2);
  art+=cabinet(-79,62,19,28,23,43,palette.cyan);
  return art+box(72,-8,35,55,27,17,'#466e84')+trim(72,-8,52,55,27,palette.cyan);
}
function edge() {
  let art=pedestal();
  for(const y of [-76,42]) art+=cabinet(-49,y,19,86,32,125,palette.amber);
  art+=box(-58,-80,145,105,160,24,'#c4bdaa','#7b7669','#45494a');
  art+=box(-48,-71,169,85,142,6,'#8e9a9c')+vent(-35,-55,176,58,112,10);
  for(const y of [-72,59]) art+=box(13,y,175,22,10,8,'#91a3a9')+trim(13,y,183,22,10,palette.amber);
  art+=trim(-58,-80,151,105,160,palette.amber);
  for(const y of [-43,37]) art+=line([-43,y,30],[-43,y,142],palette.amber,4);
  for(let x=-70;x<=60;x+=26) art+=plane(x,-10,20,12,20,'#b9a570');
  return art;
}
function cache() {
  let art=pedestal()+box(-67,-65,19,128,128,31,'#376d73','#224953','#123740');
  for(let i=0;i<5;i++) {
    const y=-58+i*24;
    art+=box(-61,y,50,116,12,45,'#a6d4cf','#38646b','#21515b');
    art+=trim(-61,y,93,116,12,palette.green);
    for(let j=0;j<6;j++) art+=box(-53+j*17,y+3,95,11,6,4,'#294852');
  }
  art+=cabinet(65,-55,19,20,111,52,palette.green);
  for(let i=0;i<7;i++) art+=line([-53+i*17,63,26],[-53+i*17,63,43],'#437780',2);
  return art+trim(-86,-86,22,172,172,palette.green);
}
function sql() {
  let art=pedestal()+box(-60,-63,19,117,120,153,'#9eafb6','#4c6476','#2f465c');
  for(const z of [30,65,100,135]) {
    art+=box(-68,-69,z,133,133,10,'#718b9d','#405b6d','#233e56');
    art+=trim(-67,-68,z+9,131,131,'#74b7d1');
    for(let i=0;i<9;i++) art+=line([-51+i*12,57,z+14],[-51+i*12,57,z+27],'#1b3245',2);
  }
  art+=box(-66,-67,172,129,128,10,'#b2c4c8')+box(-46,-46,182,89,87,13,'#647f92');
  art+=fan(-19,-13,197,16)+fan(20,22,197,16);
  art+=cabinet(-92,22,19,26,69,99,palette.cyan)+cabinet(65,-45,19,26,91,111,palette.amber);
  for(const y of [-35,0,35]) art+=line([59,y,48],[59,y,163],'#adc0c6',3);
  return art;
}
export const facilityNames = ['intake','protected-edge','app-service','app-module','redis-cache','azure-sql'];
export function facilitySvg(name, instances=0) {
  if(!facilityNames.includes(name)) throw new Error(`Unknown facility ${name}`);
  if(!Number.isInteger(instances)||instances<0||instances>4) throw new Error('Instances must be 0–4');
  const art = name==='intake'?intake():name==='protected-edge'?edge():name==='redis-cache'?cache():name==='azure-sql'?sql():name==='app-module'?module(-29,-28):appBase()+bayOrigins.slice(0,instances).map(([x,y])=>module(x,y)).join('');
  return bevelMaterials(art,`${name}-${instances}-`);
}

export const overlayNames = ['app-available','app-locked','app-queued','app-construction','app-overload','sql-read-warning','sql-write-warning','sql-critical','edge-filter','cache-activity'];
const warning = (x,y,z,color) => {
  const [px,py]=project(x,y,z);
  return `<path d="M${px} ${py-13}l12 22h-24Z" fill="#182731" stroke="${color}" stroke-width="2"/><path d="M${px} ${py-5}v7m0 4v1" stroke="${color}" stroke-width="3"/>`;
};
export function overlaySvg(name, bayIndex=0) {
  if(!overlayNames.includes(name)) throw new Error(`Unknown overlay ${name}`);
  if(!Number.isInteger(bayIndex)||bayIndex<0||bayIndex>3) throw new Error('Overlay bay must be 0–3');
  const [x,y]=bayOrigins[bayIndex];
  let art='';
  if(name==='app-available') art=plane(x+6,y+6,25,53,53,'#244956',palette.cyan)+line([x+23,y+31,26],[x+43,y+31,26],palette.cyan,3)+line([x+33,y+21,26],[x+33,y+41,26],palette.cyan,3);
  if(name==='app-locked') {
    art=plane(x+6,y+6,25,53,53,'#192e3a','#465b65');
    art+=line([x+25,y+23,27],[x+42,y+40,27],'#627780',2)+line([x+25,y+40,27],[x+42,y+23,27],'#627780',2);
  }
  if(name==='app-queued') {
    art=plane(x+6,y+6,25,53,53,'#33362f',palette.amber);
    for(const offset of [20,30,40]) art+=line([x+offset,y+24,27],[x+offset,y+38,27],palette.amber,3);
  }
  if(name==='app-construction') {
    art=plane(x+6,y+6,25,53,53,'#302f2a',palette.amber);
    for(const [dx,dy] of [[7,7],[57,7],[7,57],[57,57]]) art+=line([x+dx,y+dy,26],[x+dx,y+dy,123],palette.amber,3);
    for(const z of [60,122]) art+=line([x+7,y+7,z],[x+57,y+7,z],palette.amber,2)+line([x+57,y+7,z],[x+57,y+57,z],palette.amber,2)+line([x+57,y+57,z],[x+7,y+57,z],palette.amber,2);
    art+=line([x+7,y+57,28],[x+57,y+57,122],'#847356',2);
  }
  if(name==='app-overload') art=trim(x+4,y+5,24,49,47,'#f39e73')+warning(x+27,y+30,161,'#f39e73');
  if(name==='sql-read-warning'||name==='sql-critical') art+=trim(-92,22,118,26,69,palette.amber)+warning(-78,55,145,palette.amber);
  if(name==='sql-write-warning'||name==='sql-critical') art+=trim(65,-45,130,26,91,'#ff8d72')+warning(78,0,157,'#ff8d72');
  if(name==='sql-critical') art+=trim(-68,-69,180,133,133,'#ff8d72');
  if(name==='edge-filter') {
    for(const y of [-43,37]) art+=line([-43,y,32],[-43,y,142],palette.amber,5);
    art+=line([-43,-40,80],[-43,37,80],palette.amber,3);
  }
  if(name==='cache-activity') for(let i=0;i<5;i++) art+=trim(-61,-58+i*24,96,116,12,palette.green);
  return bevelMaterials(art,`${name}-${bayIndex}-`);
}

export const deploymentNames = ['cache-foundation','cache-frame','cache-boot','edge-foundation','edge-frame','edge-boot'];
export function deploymentSvg(name) {
  if(!deploymentNames.includes(name)) throw new Error(`Unknown deployment study ${name}`);
  const edgeSite=name.startsWith('edge-');
  const stage=name.split('-')[1];
  const color=palette.amber;
  let art=pedestal();
  if(stage==='foundation') {
    art+=plane(-65,-64,21,128,128,'#293943',color);
    for(let i=0;i<5;i++) art+=line([-55+i*24,-53,22],[-55+i*24,52,22],'#61747b',1);
  } else {
    const height=edgeSite?153:88;
    for(const [x,y] of [[-62,-66],[60,-66],[-62,64],[60,64]]) art+=box(x,y,19,4,4,height,'#aa9574','#635c4c','#45473f');
    art+=line([-62,-66,height+21],[64,-66,height+21],color,3)+line([64,-66,height+21],[64,68,height+21],color,3)+line([64,68,height+21],[-62,68,height+21],color,3);
    art+=line([-62,68,22],[64,68,height+21],'#7a7464',2);
    if(stage==='boot') {
      if(edgeSite) for(const y of [-62,42]) art+=cabinet(-49,y,19,86,24,119,'#8c856a');
      else for(let i=0;i<4;i++) art+=box(-54,-50+i*28,21,108,13,54,'#697f83','#314a53','#203943');
      for(let i=0;i<4;i++) art+=box(-45+i*25,72,21,12,5,3,i<3?color:'#44565d');
    }
  }
  return bevelMaterials(art,`${name}-`);
}

export const artPrimitives = Object.freeze({ box, plane, line, vent, fan, cabinet, trim, svg: bevelMaterials });
