import type Phaser from 'phaser';
import type { Resource } from '@stack-and-survive/schema';
import type { Point } from './editor';
import type { View } from './controller';
import { v3, v3Asset, v3Texture, v3Unit } from './art-v3';
import { playerBuildingScale, buildingLayers, resourceArtBounds } from './building-assets';
import { resourceVisualState } from './resource-visual-state';
// tycoonPoint no longer needed — env scenery baked into hall-background
import { resourceActivity } from './resource-activity';
import { scalingAsset, scalingModuleAsset, replicaOffsets } from './scaling-art';
import { resourceTier } from '@stack-and-survive/cloud-domain';

export class V3Sprites {
  private images = new Map<string, Phaser.GameObjects.Image>();
  private used = new Set<string>();
  private scenery: Phaser.GameObjects.Image[] = [];
  private activity: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    this.activity=scene.add.graphics().setDepth(buildingLayers.state+2);
    // Environment scenery is now baked into the hall-background texture.
    // Individual env-* sprite placement has been removed for a cohesive painted look.
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
    const available = (name: string) => this.scene.textures.exists(v3Texture(name));
    const name=resource.kind === 'compute' || resource.kind === 'database' ? scalingAsset(resource, available)
      : ({internet:'intake',edge:'protected-edge',cache:'redis-cache'})[resource.kind];
    if(resource.remaining>0&&(resource.kind==='cache'||resource.kind==='edge')){
      const duration=resource.kind==='cache'?5:4;
      const progress=1-resource.remaining/duration;
      this.image(resource.id,`${resource.kind}-${progress<.3?'foundation':progress<.7?'frame':'boot'}`,p,scale,base);
      this.progress(p.x,p.y+30*scale,90*scale,progress);
      return;
    }
    this.image(resource.id,name,p,scale,base);
    const layer=(key:string,texture:string,alpha=1)=>this.image(`${resource.id}-${key}`,texture,p,scale,base+6,alpha);
    if(resource.kind==='compute') {
      state.app.bays.forEach((bay,i)=>{
        if(bay==='active' || bay==='draining') {
          const offset=geometry.appBays[i].moduleOffset;
          this.image(`${resource.id}-module-${i}`,scalingModuleAsset(resource, available),{x:p.x+offset.x*v3Unit*scale,y:p.y+offset.y*v3Unit*scale},scale,base+1+i, bay === 'draining' ? .45 : 1);
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
        } else {
          layer(`bay-${i}`,`app-${bay}-${i}`);
          if(bay==='construction'&&state.app.scaleRemaining!==null){
            const center=geometry.appBays[i].center;
            this.progress(p.x+(center[0]-geometry.origin.x)*v3Unit*scale,p.y+(center[1]-geometry.origin.y)*v3Unit*scale+22*scale,42*scale,1-state.app.scaleRemaining/8);
          }
        }
      });
    }
    if(resource.kind==='database') {
      if(state.sql.readPressure==='warning'||state.sql.readPressure==='overcapacity')layer('read','sql-read-warning',pulse);
      if(state.sql.writePressure==='warning'||state.sql.writePressure==='overcapacity')layer('write','sql-write-warning',pulse);
      if(state.sql.readPressure==='overcapacity'&&state.sql.writePressure==='overcapacity')layer('critical','sql-critical',pulse);
      for (let i = 0; i < state.sql.readReplicas; i++) {
        const offset = replicaOffsets[i], point = { x: p.x + offset.x * scale, y: p.y + offset.y * scale };
        const name = available('azure-sql-replica') ? 'azure-sql-replica' : 'azure-sql';
        this.activity.lineStyle(3, 0x7edce8, .85); this.activity.lineBetween(p.x, p.y + 20 * scale, point.x, point.y);
        this.image(`${resource.id}-read-replica-${i}`, name, point, scale * .42, base + 7 + i);
      }
    }
    if (resource.kind === 'compute' || resource.kind === 'database') {
      const tier = resourceTier(resource);
      const bounds = resourceArtBounds(resource.kind, scale, true);
      const badgeY = p.y + bounds.y + 20;
      this.activity.fillStyle(0x081c29, .96);
      this.activity.fillRoundedRect(p.x - 38, badgeY - 10, 76, 24, 4);
      this.activity.lineStyle(2, 0x7edce8, 1);
      this.activity.strokeRoundedRect(p.x - 38, badgeY - 10, 76, 24, 4);
      for (let i = 0; i < tier; i++) {
        this.activity.fillStyle(0x7edce8, 1);
        this.activity.fillRect(p.x - (tier * 18 - 4) / 2 + i * 18, badgeY - 4, 14, 12);
        if (tier > 1) {
          this.activity.lineStyle(3, 0x7edce8, .9);
          const y = p.y + 20 * scale + i * 8;
          this.activity.strokePoints([{x:p.x-bounds.width*.32,y},{x:p.x,y:y+26*scale},{x:p.x+bounds.width*.32,y}],false);
        }
      }
      const change = resource.kind === 'compute' ? state.app.change : state.sql.change;
      if (change) this.progress(p.x, p.y + 36 * scale, 84 * scale, (view.state.runtime.time - change.started) / (change.due - change.started));
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
      g.fillStyle(color,.065*pulse);g.fillEllipse(p.x,p.y-8,bounds.width*.9,90*scale);
      for(const side of [-1,1]){
        const x=p.x+side*bounds.width*.32,y=p.y+19;
        g.lineStyle(3,color,pulse*.8);g.lineBetween(x-side*20,y+9,x,y);g.lineBetween(x,y,x+side*20,y+9);
      }
      if(pressure==='overcapacity'&&state.live)for(let i=0;i<5;i++){
        const phase=moving?(time/950+i/5)%1:.35;
        const x=p.x+(i-2)*bounds.width/6,y=p.y+bounds.y+55-phase*28;
        g.lineStyle(2,color,(1-phase)*.7);g.lineBetween(x,y,x+4,y-8);
      }
    }
    if(resource.kind==='cache'&&state.cache.showHitEffect)layer('hits','cache-activity',pulse);
    if(resource.kind==='edge'&&state.edge.showFilterEffect)layer('filter','edge-filter',pulse);
  }
  private progress(x: number,y: number,width: number,value: number){
    const progress=Math.max(0,Math.min(1,value));
    this.activity.fillStyle(0x081c29,.95);this.activity.fillRoundedRect(x-width/2,y,width,7,2);
    this.activity.fillStyle(0xefc985,.95);this.activity.fillRoundedRect(x-width/2,y,width*progress,7,2);
  }
  end(){ for(const [key,image] of this.images)if(!this.used.has(key))image.setVisible(false); }
  diagnostics(){return {allocated:this.images.size,visible:this.used.size,scenery:this.scenery.length,
    layers:[...this.images].filter(([key])=>this.used.has(key)).map(([key,image])=>({key,texture:image.texture.key,x:image.x,y:image.y}))};}
  destroy(){for(const image of this.images.values())image.destroy();for(const image of this.scenery)image.destroy();this.activity.destroy();this.images.clear();}
}
