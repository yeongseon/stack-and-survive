# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run with Blender --background --factory-startup --python source/blender/utility_render.py.
"""Render connected, real Kenney pipe geometry in the canonical ground projection."""
import math
import os
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT.parents[1]
ITERATION = os.environ.get("ART_ITERATION", "03")
if ITERATION not in {"02", "03"}:
    raise RuntimeError("Utility render supports iterations 02 and 03")
OUTPUT = ROOT / "iterations" / ITERATION


def ground(x: float, y: float) -> Vector:
    u, v = (x - 1200) / 100, (y - 675) / 55
    return Vector(((u + v) / math.sqrt(2), (u - v) / math.sqrt(2), 0))


def segment(start: tuple[float, float], end: tuple[float, float], model: str) -> None:
    pack = "kenney-factory" if model == "pipe-large-valve" else "kenney-space-station"
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ART / "candidates/external" / pack / "selected" / f"{model}.glb"))
    imported = set(bpy.data.objects) - before
    meshes = [obj for obj in imported if obj.type == "MESH"]
    points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (high + low) / 2
    extent = high - low
    axis = max(range(3), key=lambda i: extent[i])
    unit = Vector(tuple(1 if i == axis else 0 for i in range(3)))
    delta = ground(*end) - ground(*start)
    rotation = unit.rotation_difference(delta.normalized())
    midpoint = (ground(*start) + ground(*end)) / 2 + Vector((0, 0, .16))
    length_scale = delta.length / extent[axis]
    cross_scale = (.2 if ITERATION == "02" else .12) / max(extent[i] for i in range(3) if i != axis)
    material = bpy.data.materials.get("Shared graphite")
    for obj in meshes:
        matrix = obj.matrix_world.copy()
        for vertex in obj.data.vertices:
            point = matrix @ vertex.co - center
            point = Vector(tuple(point[i] * (length_scale if i == axis else cross_scale) for i in range(3)))
            vertex.co = rotation @ point + midpoint
        obj.parent = None
        obj.matrix_world.identity()
        obj.data.materials.clear()
        obj.data.materials.append(material)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 2400, 1350
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .35
    material = bpy.data.materials.new("Shared graphite")
    material.diffuse_color = (.13, .23, .29, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (.13, .23, .29, 1)
    shader.inputs["Metallic"].default_value = .55
    shader.inputs["Roughness"].default_value = .55
    bpy.ops.object.camera_add(location=(20, -20, math.sqrt(800) * math.tan(math.asin(.55))))
    camera = bpy.context.object
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type, camera.data.ortho_scale, camera.data.sensor_fit = "ORTHO", 24, "HORIZONTAL"
    scene.camera = camera
    for position, power in [((-8, -12, 16), 2500), ((10, 6, 12), 1000)]:
        bpy.ops.object.light_add(type="AREA", location=position)
        light = bpy.context.object
        light.data.energy, light.data.size = power, 8
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.mesh.primitive_plane_add(size=100)
    bpy.context.object.is_shadow_catcher = True
    upper_y = [375, 396] if ITERATION == "02" else [344, 358]
    upper_runs = [(180, 420), (420, 680), (680, 960), (960, 1230), (1230, 1510), (1510, 1810), (1810, 2200)] if ITERATION == "02" else [(300, 590), (590, 790), (1220, 1490), (1780, 2110)]
    lower_y = [1190, 1212] if ITERATION == "02" else [1175, 1189]
    lower_runs = [(180, 510), (510, 830), (830, 1150), (1150, 1460), (1460, 1780), (1780, 2200)] if ITERATION == "02" else [(280, 510), (510, 750), (1550, 1800), (1800, 2090)]
    for y in upper_y:
        for start, end in upper_runs:
            segment((start, y), (end, y), "pipe")
    for y in lower_y:
        for start, end in lower_runs:
            segment((start, y), (end, y), "pipe")
    if ITERATION == "02":
        for x in [180, 2200]:
            segment((x, 396), (x, 1190), "pipe")
    for x in ([480, 1690] if ITERATION == "02" else [450, 1810]):
        segment((x, lower_y[0]), (x + (44 if ITERATION == "02" else 32), lower_y[0]), "pipe-large-valve")
    scene.render.filepath = str(OUTPUT / "utilities.png")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
