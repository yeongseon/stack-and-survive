const palette = { top: '#7b929e', left: '#354f60', right: '#1b3448', dark: '#101f2d', light: '#b9cdd2', cyan: '#6be4eb', amber: '#efbb69', green: '#81efc6' };
const project = (x, y, z = 0) => [320 + (x - y) * 1.35, 398 + (x + y) * .65 - z];
const polygon = (points, fill, stroke = '#172d3d', width = 1) => `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const plane = (x,y,z,w,d,color,stroke) => polygon([project(x,y,z),project(x+w,y,z),project(x+w,y+d,z),project(x,y+d,z)],color,stroke);
const box = (x,y,z,w,d,h,top=palette.top,left=palette.left,right=palette.right) =>
  polygon([project(x,y+d,z),project(x+w,y+d,z),project(x+w,y+d,z+h),project(x,y+d,z+h)],left)
  + polygon([project(x+w,y,z),project(x+w,y+d,z),project(x+w,y+d,z+h),project(x+w,y,z+h)],right)
  + plane(x,y,z+h,w,d,top);
const line = (a,b,color,width=2) => { const p=project(...a),q=project(...b); return `<path d="M${p}L${q}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`; };
const vent = (x,y,z,w,d,n=9) => Array.from({length:n},(_,i)=>line([x+i*w/n,y,z],[x+i*w/n,y+d,z],'#263e50',2)).join('');
const trim = (x,y,z,w,d,color) => line([x,y+d,z],[x+w,y+d,z],color,3)+line([x+w,y+d,z],[x+w,y,z],color,2);
const pedestal = () => plane(-109,-109,-6,220,220,'#071823') + box(-100,-100,0,200,200,13,'#3a5363','#182d40','#102335') + box(-94,-94,13,188,188,6,'#526a78','#2d4657','#233b4c');
const cabinet = (x,y,z,w=38,d=36,h=90,color=palette.cyan) => {
  let art = box(x,y,z,w,d,h) + box(x+3,y+3,z+h,w-6,d-6,4,'#8c9da5');
  art += polygon([project(x+4,y+d+.2,z+8),project(x+w-4,y+d+.2,z+8),project(x+w-4,y+d+.2,z+h-8),project(x+4,y+d+.2,z+h-8)],palette.dark);
  for(let i=0;i<7;i++) {
    const level=z+14+i*(h-28)/7;
    art += line([x+7,y+d+.5,level],[x+w-7,y+d+.5,level],'#5b7380',1.5);
    art += line([x+w-10,y+d+1,level+3],[x+w-6,y+d+1,level+3],color,2.5);
  }
  return art + vent(x+6,y+6,z+h+4,w-12,d-12,6);
};
const fan = (x,y,z,r) => {
  const p=project(x,y,z);
  return `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${r*1.35}" ry="${r*.65}" fill="#142c3b" stroke="#8ba0a9" stroke-width="3"/><ellipse cx="${p[0]}" cy="${p[1]}" rx="${r*.85}" ry="${r*.41}" fill="none" stroke="#526c7e" stroke-width="3"/>`+line([x-r*.65,y,z],[x+r*.65,y,z],'#849da5',2)+line([x,y-r*.65,z],[x,y+r*.65,z],'#849da5',2);
};
export const bayOrigins = [[-70,-70], [6,-70], [-70,6], [6,6]];
const module = (x,y) => cabinet(x+4,y+5,24,49,47,98) + box(x+10,y+11,126,36,34,6,'#9cb0b7') + fan(x+28,y+28,134,12);
function appBase() {
  let art=pedestal()+box(-94,-92,19,16,184,23,'#8b9ba1')+box(-78,-92,19,169,13,23,'#8297a1');
  for (const [x,y] of bayOrigins) {
    art+=box(x,y,19,65,65,4,'#142a3a')+plane(x+6,y+6,23.5,53,53,'#223e50','#7794a0');
    for (const dx of [3,59]) art+=box(x+dx,y+5,24,3,55,3,'#8b9d9f');
    for(let i=0;i<5;i++) art+=box(x+20+i*5,y+52,24,3,4,2,'#bf995f');
  }
  return art + trim(-94,-94,23,188,188,'#6eb4c4');
}
function intake() {
  let art=pedestal();
  for (let i=0;i<3;i++) art+=box(-132,-55+i*42,20,92,23,22,'#617f8d')+trim(-132,-55+i*42,39,92,23,palette.cyan);
  art+=box(-52,-70,19,105,135,58)+box(-60,-76,77,122,145,9,'#a3b8bf');
  art+=box(-35,-55,86,68,105,34,'#55788b')+vent(-29,-49,120,56,93,12);
  art+=box(42,-18,28,52,46,48,'#bed0cf')+plane(47,-13,77,42,36,'#193e56');
  art+=trim(-60,-76,88,122,145,palette.cyan);
  return art+box(72,-8,35,55,27,17,'#466e84')+trim(72,-8,52,55,27,palette.cyan);
}
function edge() {
  let art=pedestal();
  for(const y of [-76,42]) art+=cabinet(-49,y,19,86,32,125,palette.amber);
  art+=box(-58,-80,145,105,160,24,'#c4bdaa','#7b7669','#45494a');
  art+=box(-48,-71,169,85,142,6,'#8e9a9c')+vent(-35,-55,176,58,112,10);
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
  return art+trim(-86,-86,22,172,172,palette.green);
}
function sql() {
  let art=pedestal()+box(-60,-63,19,117,120,153,'#9eafb6','#4c6476','#2f465c');
  for(const z of [30,65,100,135]) {
    art+=box(-68,-69,z,133,133,10,'#718b9d','#405b6d','#233e56');
    art+=trim(-67,-68,z+9,131,131,'#74b7d1');
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><g>${art}</g></svg>`;
}
