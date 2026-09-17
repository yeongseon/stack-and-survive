"""Shared physical geometry and calibrated projection for the authored hall study."""
import math
from pathlib import Path

import bpy
from mathutils import Vector

ART = Path(__file__).resolve().parents[4]
MATERIALS = {}
IMPORTS = []


def point(x: float, y: float, z: float = 0) -> Vector:
    u, v = (x - 1200) / 100, (y - 675) / 55
    return Vector(((u + v) / math.sqrt(2), (u - v) / math.sqrt(2), z))


def material(name: str, color: tuple, roughness: float = .65) -> None:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = .35 if name != "floor" else .12
    shader.inputs["Roughness"].default_value = roughness
    MATERIALS[name] = mat


def box(name: str, location: Vector, size: tuple, finish: str, angle: float = 0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = math.radians(angle)
    obj.data.materials.append(MATERIALS[finish])
    bevel = obj.modifiers.new("Physical edge bevel", "BEVEL")
    bevel.width, bevel.segments = min(.002 if finish == "floor" else .035, min(size) / 5), 2
    obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj


def local(base: Vector, offset: tuple, angle: float = 0) -> Vector:
    x, y, z = offset
    a = math.radians(angle)
    return base + Vector((x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a), z))


def cabinet(spec: tuple) -> None:
    before = set(bpy.data.objects)
    x, y, kind, angle = spec
    base = point(x, y)
    height = 1.65 if kind == "rack" else 1.4
    box(f"{kind} plinth", local(base, (0, 0, .06)), (.95, .8, .12), "dark", angle)
    box(f"{kind} enclosure", local(base, (0, 0, height / 2 + .12)), (.82, .7, height), "steel", angle)
    box(f"{kind} inset face", local(base, (0, -.362, height / 2 + .12), angle), (.7, .025, height - .15), "dark", angle)
    for z in ([.35, .56, .77, .98, 1.19, 1.40, 1.61] if kind == "rack" else [.33, .46, .59, .72, .85, .98, 1.11, 1.24]):
        box(f"{kind} service slot", local(base, (0, -.386, z), angle), (.64, .018, .045), "edge", angle)
    box(f"{kind} service handle", local(base, (.3, -.398, .85), angle), (.025, .03, .18), "aluminum", angle)
    if kind == "cooling":
        for dx in [-.2, .2]:
            bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.14, depth=.02, location=local(base, (dx, 0, height + .13), angle))
            bpy.context.object.data.materials.append(MATERIALS["dark"])
    else:
        box("Passive rack label", local(base, (-.23, -.405, 1.52), angle), (.1, .012, .025), "aluminum", angle)
    scale = .68 if y < 450 else .78
    for obj in set(bpy.data.objects) - before:
        obj.location = base + (obj.location - base) * scale
        obj.scale *= scale


def imported(spec: tuple) -> None:
    pack, name, x, y, size, angle = spec
    path = ART / "candidates/external" / pack / "selected" / f"{name}.glb"
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [obj for obj in set(bpy.data.objects) - before if obj.type == "MESH"]
    points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (low + high) / 2
    for obj in meshes:
        matrix = obj.matrix_world.copy()
        for vertex in obj.data.vertices:
            p = matrix @ vertex.co
            vertex.co = tuple((p[i] - (center[i] if i < 2 else low[i])) * size[i] / max(.001, high[i] - low[i]) for i in range(3))
        obj.parent = None
        obj.matrix_world.identity()
        obj.location = point(x, y, .03)
        obj.rotation_euler.z = math.radians(angle)
        obj.data.materials.clear()
        obj.data.materials.append(MATERIALS["steel"])
    IMPORTS.append({"pack": pack, "model": name, "position": [x, y], "dimensions": size, "rotation": angle})


def beam(name: str, start: tuple, end: tuple, width: float, finish: str) -> None:
    a, b = point(*start), point(*end)
    delta = b - a
    obj = box(name, (a + b) / 2, (width, width, delta.length), finish)
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()


def light(name: str, location: tuple, target: tuple, power: float, size: float, color: tuple) -> None:
    bpy.ops.object.light_add(type="AREA", location=point(*location))
    obj = bpy.context.object
    obj.name = name
    obj.data.energy, obj.data.size, obj.data.color = power, size, color
    obj.rotation_euler = (point(*target) - obj.location).to_track_quat("-Z", "Y").to_euler()
