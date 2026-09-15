import { artPrimitives as art } from './core-facilities.mjs';

export const environmentNames = ['rack-a','rack-b','rack-c','cooling-a','cooling-b','pdu','electrical-cabinet','wall-section','service-door','raised-tile','grated-tile','floor-vent','cable-tray','conduit-cyan','conduit-amber','rail','warning-decal','maintenance-light','pipe-straight','pipe-elbow'];
const base = (w,d) => art.box(-w/2,-d/2,0,w,d,9,'#455763','#21323e','#152732');
const neutral = '#647e87';
const cable = (color) => base(150,32)+art.box(-72,-12,9,144,24,8,'#374f5d')+art.trim(-72,-12,17,144,24,color);

export function environmentSvg(name) {
  if(!environmentNames.includes(name)) throw new Error(`Unknown environment asset ${name}`);
  let shape='';
  if(name.startsWith('rack-')) {
    const count=name==='rack-a'?1:name==='rack-b'?2:3;
    const width=count*38;
    shape=base(width+14,60);
    for(let i=0;i<count;i++)shape+=art.cabinet(-width/2+i*38,-23,9,34,46,118,neutral);
    shape+=art.line([-width/2,24,131],[width/2,24,131],'#8a9ca3',1);
  } else if(name==='cooling-a') {
    shape=base(68,58)+art.box(-29,-24,9,58,48,134,'#899b9f','#4d6572','#314956');
    shape+=art.box(-24,-19,143,48,38,5,'#6d858c')+art.fan(0,0,149,17);
    for(let i=0;i<16;i++)shape+=art.line([-23,24.5,24+i*6],[23,24.5,24+i*6],'#243a47',2);
  } else if(name==='cooling-b') {
    shape=base(118,74)+art.box(-53,-31,9,106,62,68,'#849b9f','#4a6472','#2d4656');
    shape+=art.fan(-25,0,79,19)+art.fan(26,0,79,19);
    for(let i=0;i<9;i++)shape+=art.line([-47,31.5,19+i*6],[47,31.5,19+i*6],'#233b48',2);
  } else if(name==='pdu') {
    shape=base(44,48)+art.box(-18,-19,9,36,38,142,'#929d9e','#4b5c64','#2a3b47');
    for(let i=0;i<8;i++)shape+=art.box(-12,19,26+i*13,24,3,7,'#56676d','#172c39','#162937');
    shape+=art.line([-11,22,139],[11,22,139],'#c4ae76',3);
  } else if(name==='electrical-cabinet') {
    shape=base(92,50)+art.box(-40,-19,9,80,38,118,'#889598','#4f626e','#2b414f');
    for(const x of [-36,3])shape+=art.box(x,19,18,33,2,99,'#83949a','#394f5c','#223948');
    shape+=art.line([-5,22,64],[-5,22,81],'#c4ced0',2)+art.line([7,22,64],[7,22,81],'#c4ced0',2);
    shape+=art.vent(-34,-13,128,64,25,10);
  } else if(name==='wall-section'||name==='service-door') {
    shape=base(166,28)+art.box(-78,-9,9,156,18,166,'#6f8791','#3a5364','#243d50');
    if(name==='wall-section')for(let i=0;i<4;i++)shape+=art.box(-71+i*38,9,23,31,3,140,'#768c97','#435d6e','#2b465b');
    else {
      shape+=art.box(-47,9,9,94,6,154,'#8b9da6','#162c3a','#152735');
      shape+=art.box(-41,15,10,82,2,145,'#7f939b','#4a6370','#2d4654');
      shape+=art.line([0,17,12],[0,17,151],'#1b3546',2)+art.line([12,18,72],[12,18,89],'#c1cdcd',3);
      shape+=art.box(-22,10,165,44,6,6,'#76a394');
    }
    shape+=art.box(-81,12,9,162,7,12,'#5d737e');
  } else if(['raised-tile','grated-tile','floor-vent','warning-decal'].includes(name)) {
    shape=base(120,120)+art.plane(-57,-57,9.2,114,114,'#344d5d','#567280');
    if(name==='grated-tile'||name==='floor-vent') {
      const side=name==='floor-vent'?78:104;
      shape+=art.plane(-side/2,-side/2,10,side,side,'#142c3b');
      shape+=art.vent(-side/2+4,-side/2+3,11,side-8,side-6,name==='floor-vent'?12:18);
      if(name==='grated-tile')for(let i=0;i<8;i++)shape+=art.line([-48,-45+i*13,12],[48,-45+i*13,12],'#4e6876',1);
    }
    if(name==='warning-decal')for(let i=0;i<6;i++)shape+=art.plane(-51+i*18,-42,10,8,84,i%2?'#354c57':'#aa955f');
    if(name==='raised-tile')for(const [x,y] of [[-50,-50],[50,-50],[-50,50],[50,50]])shape+=art.line([x-2,y,10],[x+2,y,10],'#84969b',1);
  } else if(name==='cable-tray') {
    shape=base(168,38);
    for(const y of [-17,12])shape+=art.box(-82,y,9,164,5,11,'#81919a');
    for(let i=0;i<12;i++)shape+=art.box(-75+i*13,-12,9,5,24,3,'#586e7b');
    for(const y of [-6,0,6])shape+=art.line([-79,y,14],[79,y,14],y===0?'#527b86':'#2b3e4b',3);
  } else if(name==='conduit-cyan'||name==='conduit-amber') shape=cable(name==='conduit-cyan'?'#668e98':'#ae935f');
  else if(name==='rail') {
    for(const x of [-66,0,66])shape+=art.box(x-4,-4,0,8,8,60,'#7b919a','#354f5f','#263d4d');
    shape+=art.box(-73,-5,54,146,10,8,'#a7b4b8','#677d87','#354e5d');
    shape+=art.box(-70,-3,25,140,6,5,'#536f7b');
  } else if(name==='maintenance-light') {
    shape=base(35,30)+art.box(-4,-4,9,8,8,96,'#7c929d')+art.box(-23,-12,105,46,24,9,'#a3b2b6','#506a78','#304b5b');
    shape+=art.plane(-19,-8,105.2,38,16,'#c8dcd6')+art.trim(-23,-12,107,46,24,'#a2c8be');
  } else {
    for(const y of [-12,6]) {
      shape+=art.box(-83,y,14,128,name==='pipe-elbow'?11:8,9,'#617d8b','#3c5666','#253e50');
      for(const x of [-58,-10,36])shape+=art.box(x,y-2,12,5,name==='pipe-elbow'?15:12,13,'#89979b');
      if(name==='pipe-elbow')shape+=art.box(37,y,14,11,67-y,9,'#617d8b','#3c5666','#253e50');
    }
  }
  return art.svg(shape,`env-${name}-`);
}
