import type Phaser from 'phaser';
import type { Resource } from '@stack-and-survive/schema';
import type { Point } from './editor';
import type { View } from './controller';
import { v3, v3Asset, v3Texture, v3Unit } from './art-v3';
import { playerBuildingScale, buildingLayers, resourceArtBounds } from './building-assets';
import { resourceVisualState } from './resource-visual-state';
import { tycoonPoint } from './tycoon-layout';
import { resourceActivity } from './resource-activity';

export class V3Sprites {
  private images = new Map<string, Phaser.GameObjects.Image>();
  private used = new Set<string>();
  private scenery: Phaser.GameObjects.Image[] = [];
  private activity: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    this.activity=scene.add.graphics().setDepth(buildingLayers.state+2);
    if(!v3)return;
    const protectedAreas = (['internet','edge','compute','cache','database'] as const).map(kind=>{
      const point=tycoonPoint(kind),bounds=resourceArtBounds(kind,playerBuildingScale(kind),true);
      return {x:point.x+bounds.x-30,y:point.y+bounds.y-70,width:bounds.width+60,height:bounds.height+125};
    });
    const place=(name:string,x:number,y:number,scale:number,alpha=.72)=>{
      const asset=v3Asset(`env-${name}`),b=asset.visible;
      const bounds={x:x+b.x*scale,y:y+b.y*scale,width:b.width*scale,height:b.height*scale};
      if(protectedAreas.some(p=>bounds.x<p.x+p.width&&bounds.x+bounds.width>p.x&&bounds.y<p.y+p.height&&bounds.y+bounds.height>p.y))return;
      if(!scene.textures.exists(asset.texture))return;
      this.scenery.push(scene.add.image(x,y,asset.texture).setOrigin(asset.originX,asset.originY).setDisplaySize(asset.width*scale,asset.height*scale)
        .setTint(0x809aa8).setAlpha(alpha).setDepth(5+y*.001));
    };
    for(const row of [250,415,1100,1270])for(let i=0;i<15;i++)place(i%5===4?'cooling-a':i%3===0?'rack-c':'rack-b',180+i*145,row,2.4);
    for(const x of [155,2240])for(let i=0;i<5;i++)place(i%2?'electrical-cabinet':'cooling-b',x,580+i*116,2.7);
    for(let i=0;i<12;i++)place(i===7?'service-door':'wall-section',100+i*198,90,2.5,.55);
    for(let i=0;i<11;i++) {
      place('cable-tray',260+i*175,970,2,.7);
      place('floor-vent',230+i*175,490,1.3,.65);
    }
    for(const x of [350,2030])place('maintenance-light',x,975,2.5,.85);
  }
  begin() { this.used.clear(); this.activity.clear(); }
  private image(key: string, name: string, p: Point, scale: number, depth: number, alpha = 1) {
    if (!this.scene.textures.exists(v3Texture(name))) return;
    const asset = v3Asset(name);
    let image = this.images.get(key);
    if (!image) { image = this.scene.add.image(0,0,asset.texture); this.images.set(key,image); }
    this.used.add(key);
    image.setTexture(asset.texture).setOrigin(asset.originX,asset.originY).setDisplaySize(asset.width*scale,asset.height*scale)
      .setPosition(p.x,p.y).setDepth(depth).setAlpha(alpha).setVisible(true);
  }
  update(resource: Resource, p: Point, rank: number, view: View, time: number, reduced: boolean) {
    if (!v3) return;
    const geometry=v3.geometry;
    const state=resourceVisualState(view,reduced), scale=playerBuildingScale(resource.kind);
    const base=buildingLayers.body+rank*10;
    const moving=state.canAnimate;
    const work=resourceActivity(view);
    const pulse = moving ? .74 + Math.sin(time / 150) * .22 : .86;
    const name=({internet:'intake',edge:'protected-edge',compute:'app-service',cache:'redis-cache',database:'azure-sql'})[resource.kind];
    if(resource.remaining>0&&(resource.kind==='cache'||resource.kind==='edge')){
      const duration=resource.kind==='cache'?5:4;
      const progress=1-resource.remaining/duration;
      this.image(resource.id,`${resource.kind}-${progress<.3?'foundation':progress<.7?'frame':'boot'}`,p,scale,base);
      return;
    }
    this.image(resource.id,name,p,scale,base);
    const layer=(key:string,texture:string,alpha=1)=>this.image(`${resource.id}-${key}`,texture,p,scale,base+6,alpha);
    if(resource.kind==='compute') {
      state.app.bays.forEach((bay,i)=>{
        if(bay==='active') {
          const offset=geometry.appBays[i].moduleOffset;
          this.image(`${resource.id}-module-${i}`,'app-module',{x:p.x+offset.x*v3Unit*scale,y:p.y+offset.y*v3Unit*scale},scale,base+1+i);
          if(state.app.pressure==='overcapacity'||state.app.pressure==='warning')layer(`warning-${i}`,`app-overload-${i}`,pulse);
          const working=work.some(item=>item.resource==='compute'&&item.slot===i);
          if(working){
            const center=geometry.appBays[i].center;
            const x=p.x+(center[0]-geometry.origin.x)*v3Unit*scale;
            const y=p.y+(center[1]-geometry.origin.y-74.25)*v3Unit*scale;
            const radius=17*v3Unit*scale;
            const speed=state.app.pressure==='healthy'?1:2;
            const angle=moving?time/450*speed:0;
            const g=this.activity;
            g.lineStyle(2,state.app.pressure==='overcapacity'?0xff8269:state.app.pressure==='warning'?0xffc86d:0x9cf6ff,.8);
            for(let blade=0;blade<4;blade++){
              const a=angle+blade*Math.PI/2;
              g.lineBetween(x,y,x+Math.cos(a)*radius,y+Math.sin(a)*radius*.48);
            }
          }
        } else layer(`bay-${i}`,`app-${bay}-${i}`);
      });
    }
    if(resource.kind==='database') {
      if(state.sql.readPressure==='warning'||state.sql.readPressure==='overcapacity')layer('read','sql-read-warning',pulse);
      if(state.sql.writePressure==='warning'||state.sql.writePressure==='overcapacity')layer('write','sql-write-warning',pulse);
      if(state.sql.readPressure==='overcapacity'&&state.sql.writePressure==='overcapacity')layer('critical','sql-critical',pulse);
    }
    const pressure=resource.kind==='compute'?state.app.pressure:resource.kind==='database'?state.sql.pressure:'healthy';
    if(view.selected===resource.id){
      const bounds=resourceArtBounds(resource.kind,scale,true);
      this.activity.lineStyle(3,0xd7f9f2,.9);
      this.activity.strokeEllipse(p.x,p.y+20,bounds.width*.94,60*scale);
    }
    if(pressure==='warning'||pressure==='overcapacity'){
      const bounds=resourceArtBounds(resource.kind,scale,true),g=this.activity;
      const color=pressure==='overcapacity'?0xff7355:0xffbe62;
      g.fillStyle(color,.07*pulse);g.fillEllipse(p.x,p.y-8,bounds.width*.9,90*scale);
      g.lineStyle(3,color,pulse*.7);g.strokeEllipse(p.x,p.y+12,bounds.width*.85,55*scale);
      if(pressure==='overcapacity'&&state.live)for(let i=0;i<5;i++){
        const phase=moving?(time/950+i/5)%1:.35;
        const x=p.x+(i-2)*bounds.width/6,y=p.y+bounds.y+55-phase*28;
        g.lineStyle(2,color,(1-phase)*.7);g.lineBetween(x,y,x+4,y-8);
      }
    }
    if(resource.kind==='cache'&&state.cache.showHitEffect)layer('hits','cache-activity',pulse);
    if(resource.kind==='edge'&&state.edge.showFilterEffect)layer('filter','edge-filter',pulse);
  }
  end(){ for(const [key,image] of this.images)if(!this.used.has(key))image.setVisible(false); }
  diagnostics(){return {allocated:this.images.size,visible:this.used.size,scenery:this.scenery.length,
    layers:[...this.images].filter(([key])=>this.used.has(key)).map(([key,image])=>({key,texture:image.texture.key,x:image.x,y:image.y}))};}
  destroy(){for(const image of this.images.values())image.destroy();for(const image of this.scenery)image.destroy();this.activity.destroy();this.images.clear();}
}
