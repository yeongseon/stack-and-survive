# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run inside Blender: blender --background --factory-startup --python source/blender/render.py
"""Render real selected GLBs through one calibrated orthographic lighting rig."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Final

import bpy
from mathutils import Vector

EXPERIMENT: Final = Path(__file__).resolve().parents[2]
ART: Final = EXPERIMENT.parents[1]
LAYOUT: Final = json.loads((EXPERIMENT / "source/layouts/environment.json").read_text())
OUTPUT: Final = EXPERIMENT / "renders/environment"


def ground_point(x: float, y: float) -> Vector:
    u, v = x - 1200, y - 675
    p, slope = LAYOUT["pixelsPerUnit"], LAYOUT["groundSlope"]
    return Vector(((u + v / slope) / math.sqrt(2) / p,
                   (u - v / slope) / math.sqrt(2) / p, 0))


def import_prop(placement: list[str | float]) -> None:
    pack, name, x, y, pixel_size, rotation = placement
    source = ART / "candidates/external" / str(pack) / "selected" / f"{name}.glb"
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = set(bpy.data.objects) - before
    meshes = [item for item in imported if item.type == "MESH"]
    corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
    minimum = Vector(tuple(min(point[axis] for point in corners) for axis in range(3)))
    maximum = Vector(tuple(max(point[axis] for point in corners) for axis in range(3)))
    factor = float(pixel_size) / LAYOUT["pixelsPerUnit"] / max(maximum - minimum)
    root = bpy.data.objects.new(f"{pack}/{name}", None)
    bpy.context.collection.objects.link(root)
    for item in imported:
        if item.parent not in imported:
            item.parent = root
    center = (minimum + maximum) / 2
    root.location = ground_point(float(x), float(y)) - Vector((center.x, center.y, minimum.z)) * factor
    root.scale = (factor, factor, factor)
    root.rotation_euler.z = math.radians(float(rotation))
    for item in meshes:
        for slot in item.material_slots:
            material = slot.material
            if not material or not material.use_nodes:
                continue
            shader = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
            shader.inputs["Roughness"].default_value = .8
            shader.inputs["Metallic"].default_value = .25
            shader.inputs["Emission Strength"].default_value = 0
            color = shader.inputs["Base Color"]
            if color.links:
                link = color.links[0]
                hue = material.node_tree.nodes.new("ShaderNodeHueSaturation")
                hue.inputs["Saturation"].default_value = .12
                hue.inputs["Value"].default_value = .42
                material.node_tree.links.new(link.from_socket, hue.inputs["Color"])
                material.node_tree.links.new(hue.outputs["Color"], color)
            else:
                color.default_value = (.12, .16, .19, 1)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = LAYOUT["canvas"]
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.18, .23, .3, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .5
    elevation = math.asin(LAYOUT["groundSlope"])
    bpy.ops.object.camera_add(location=(20, -20, math.sqrt(800) * math.tan(elevation)))
    camera = bpy.context.object
    camera.name = "Shared orthographic camera"
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 24
    camera.data.sensor_fit = "HORIZONTAL"
    scene.camera = camera
    for name, position, power, color in [
        ("Key", (-8, -12, 16), 2200, (1, .89, .73)),
        ("Fill", (10, 6, 12), 1200, (.6, .78, 1)),
    ]:
        bpy.ops.object.light_add(type="AREA", location=position)
        light = bpy.context.object
        light.name = name
        light.data.energy, light.data.color, light.data.size = power, color, 9
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.mesh.primitive_plane_add(size=100)
    bpy.context.object.name = "Contact shadow catcher"
    bpy.context.object.is_shadow_catcher = True
    for placement in LAYOUT["placements"]:
        import_prop(placement)
    scene.render.filepath = str(OUTPUT / "external-overlay.png")
    bpy.ops.render.render(write_still=True)
    metadata = {"blender": bpy.app.version_string, "engine": "Cycles CPU", "samples": 16,
        "orthographicScale": 24, "elevationDegrees": math.degrees(elevation),
        "groundSlope": LAYOUT["groundSlope"], "pixelsPerUnit": LAYOUT["pixelsPerUnit"],
        "canvas": LAYOUT["canvas"], "instances": len(LAYOUT["placements"]),
        "transparent": True, "note": "Real GLB geometry; desaturated palette, no AI image generation"}
    (OUTPUT / "render.json").write_text(json.dumps(metadata, indent=2) + "\n")


if __name__ == "__main__":
    main()
