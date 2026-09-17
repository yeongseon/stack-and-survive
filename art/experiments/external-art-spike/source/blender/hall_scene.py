# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run with Blender --background --factory-startup --python source/blender/hall_scene.py.
"""Bake an entire authored 3D room; no heroes, UI, traffic or Pillow composition."""
import hashlib
import json
import math
import os
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hall_geometry import MATERIALS, IMPORTS, beam, box, cabinet, imported, light, material, point
from hall_layouts import LAYOUTS

ROOT = Path(__file__).resolve().parents[2]
candidate = os.environ.get("HALL_CANDIDATE", "A")
layout = LAYOUTS[candidate]
full = os.environ.get("HALL_FULL") == "1"
output = ROOT / "iterations/04" if full else ROOT / "iterations/04" / os.environ.get("HALL_PREVIEW_DIR", "candidates")
output.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for name, color, roughness in [
    ("floor", (.014,.026,.036), .88), ("steel", (.04,.073,.095), .7),
    ("dark", (.018,.029,.037), .77), ("edge", (.15,.205,.23), .55),
    ("aluminum", (.32,.38,.4), .4), ("wall", (.11,.16,.185), .85),
    ("light", (.8,.73,.55), .3),
]:
    material(name, color, roughness)
floor_nodes = MATERIALS["floor"].node_tree
noise = floor_nodes.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 130
bump = floor_nodes.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = .12
bump.inputs["Distance"].default_value = .018
floor_nodes.links.new(noise.outputs["Fac"], bump.inputs["Height"])
floor_nodes.links.new(bump.outputs["Normal"], floor_nodes.nodes.get("Principled BSDF").inputs["Normal"])

box("Raised floor foundation", point(1200,675,-.12), (38,38,.2), "dark")
for x in range(-18,19,2):
    for y in range(-18,19,2):
        box("Physical raised floor panel", (x,y,-.012), (1.9995,1.9995,.06), "floor")
box("Continuous rear structural wall", point(1200,130,1.15), (25,.42,2.3), "wall", 45)
box("Rear wall floor junction", point(1200,145,.12), (25,.55,.24), "dark", 45)
box("Rear upper beam", point(1200,135,2.28), (25,.65,.18), "steel", 45)
box("Left return wall", point(40,420,.9), (.36,11,1.8), "wall",45)
for x,y in layout["columns"]:
    box("Structural column", point(x,y,1.25), (.4,.4,2.5), "wall")
    box("Column footing", point(x,y,.1), (.65,.65,.2), "steel")
for x in [420, 1170, 1980]:
    box("Recessed service bay", point(x,153,1.15), (2.3,.06,1.15), "dark",45)
    for z in [.72,.86,1,1.14,1.28,1.42,1.56]:
        box("Ventilation louvre", point(x,158,z), (2.1,.04,.045), "edge",45)
for spec in layout["racks"]:
    cabinet(spec)
for start,end in layout["trays"]:
    beam("Cable tray spine", start,end,.16,"dark")
    beam("Cable tray rim", (start[0],start[1]+8,start[2]),(end[0],end[1]+8,end[2]),.04,"edge")
    for anchor in [start,end]:
        beam("Tray structural support",(anchor[0],anchor[1],0),anchor,.065,"steel")
for x,y in layout["practicals"]:
    box("Maintenance light fixture", point(x,y,2), (.55,.2,.07), "aluminum",45)
    box("Warm diffuser", point(x,y,1.95), (.47,.17,.02), "light",45)
    light("Local maintenance light", (x,y,1.85),(x,y+80,0),65,1.5,(1,.86,.68))

for spec in [
    ("kenney-space-station","wall",2160,205,(1.1,.3,1.55),45),
    ("kenney-space-station","floor-panel",380,1050,(1.15,1.15,.06),0),
    ("kenney-modular-space","cables",2000,1080,(1.1,.35,.07),0),
    ("kenney-space-station","rail",2210,1290,(1.7,.12,.55),45),
    ("kenney-space-station","pipe",190,1170,(.14,2.5,.14),0),
    ("kenney-space-station","pipe-bend",220,1230,(.3,.3,.2),0),
    ("kenney-factory","pipe-large-valve",290,1230,(.35,.65,.35),0),
    ("kenney-factory","machine-connection-pipe",2290,1060,(.6,.6,.7),0),
]:
    imported(spec)
beam("Local sealed floor service channel",(1900,1140,.02),(2120,1170,.02),.045,"dark")
beam("Cooling bank supply",(1030,330,.25),(1350,375,.25),.09,"steel")
box("Near left cropped utility plinth",point(50,1320,.24),(1.8,1.1,.48),"dark",0)
box("Near right column edge",point(2370,1300,.65),(.65,.65,1.3),"steel",0)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 48 if full else 16
scene.cycles.use_denoising = True
scene.render.resolution_x,scene.render.resolution_y = (2400,1350) if full else (1200,675)
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.23,.32,.42,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = layout["ambient"]
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = -.65
light("Playable center soft illumination",(1100,740,7),(1200,730,0),layout["key"],9,(.73,.86,1))
light("Rear soft wash",(900,300,5),(1000,200,0),600,10,(.62,.75,1))
light("SQL side practical fill",(1920,920,4),(1800,820,0),350,4,(.85,.92,1))
bpy.ops.object.camera_add(location=(20,-20,math.sqrt(800)*math.tan(math.asin(.55))))
camera = bpy.context.object
camera.name = "Canonical orthographic room camera"
camera.rotation_euler = (-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type,camera.data.ortho_scale,camera.data.sensor_fit = "ORTHO",24,"HORIZONTAL"
scene.camera = camera
scene.render.filepath = str(output / ("environment.png" if full else f"04{candidate}.png"))
bpy.ops.render.render(write_still=True)
receipt = {"candidate":candidate,"name":layout["name"],"full":full,"blender":bpy.app.version_string,
    "resolution":[scene.render.resolution_x,scene.render.resolution_y],"samples":scene.cycles.samples,
    "projection":{"slope":.55,"orthoScale":24},"importedGeometry":IMPORTS,
    "reconstructedProps":"Original 3D rack/cooling/power equivalents based on V3 roles; not imported V3 PNGs",
    "heroBaked":False,"productionChanges":0,"outputSha256":hashlib.sha256(Path(scene.render.filepath).read_bytes()).hexdigest()}
(output / ("render.json" if full else f"04{candidate}.json")).write_text(json.dumps(receipt,indent=2)+"\n")
