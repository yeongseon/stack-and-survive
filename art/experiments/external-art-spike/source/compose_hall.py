# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow==11.3.0"]
# ///
# Run: uv run source/compose_hall.py
"""Compose existing V3 environment with actual rendered external utility geometry."""
import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]
ITERATION = os.environ.get("ART_ITERATION", "03")
if ITERATION not in {"02", "03"}:
    raise RuntimeError("Hall composition supports iterations 02 and 03")
OUTPUT = ROOT / "iterations" / ITERATION
OUTPUT.mkdir(parents=True, exist_ok=True)
canvas = Image.new("RGBA", (2400, 1350), "#0c202d")
draw = ImageDraw.Draw(canvas)
for y in range(1350):
    value = max(0, 1 - abs(y - 730) / 850)
    draw.line((0, y, 2400, y), fill=(8 + int(7 * value), 23 + int(15 * value), 33 + int(20 * value)))
for x in range(-2500, 5000, 100):
    draw.line((x, 0, x + 2455, 1350), fill="#193440", width=1)
    draw.line((x, 0, x - 2455, 1350), fill="#193440", width=1)
draw.rectangle((0, 0, 2400, 145), fill="#112838")
draw.rectangle((0, 135, 2400, 151), fill="#08141e")
if ITERATION == "03":
    draw.rectangle((0, 145, 2400, 365), fill="#102634")
    draw.rectangle((0, 1060, 2400, 1230), fill="#0b1d29")
for y in [415, 1040]:
    draw.rectangle((150, y, 2250, y + 30), fill="#091924")
    draw.line((150, y, 2250, y), fill="#45606b", width=2)
    for x in range(165, 2240, 80):
        draw.line((x, y + 15, x + 24, y + 15), fill="#817956", width=3)


def sprite(name: str, point: tuple[int, int], height: int, opacity: float) -> None:
    with Image.open(REPO / "apps/web/public/assets/v3" / f"env-{name}.png") as source:
        image = source.convert("RGBA")
        image = image.crop(image.getbbox())
    image = image.resize((round(image.width * height / image.height), height), Image.Resampling.LANCZOS)
    image.putalpha(image.getchannel("A").point(lambda value: round(value * opacity)))
    canvas.alpha_composite(image, (point[0] - image.width // 2, point[1] - image.height))


if ITERATION == "02":
    for x in range(90, 2380, 210):
        sprite("wall-section", (x, 210), 150, .65)
else:
    for y in range(145):
        draw.line((0, y, 2400, y), fill=(15 + y // 14, 32 + y // 10, 44 + y // 9))
    for x in range(0, 2400, 150):
        draw.line((x, 0, x, 140), fill="#304753", width=2)
    draw.rectangle((0, 140, 2400, 158), fill="#081923")
for index, x in enumerate(range(260, 2220, 185)):
    sprite("rack-b" if index % 3 else "rack-c", (x, 310), 125, .65 if ITERATION == "02" else .46)
for index, x in enumerate(range(350, 2150, 225)):
    sprite("cooling-a" if index % 4 == 1 else "rack-c", (x, 375), 145, .82 if ITERATION == "02" else .62)
for x in [110, 2290]:
    for index, y in enumerate([620, 860, 1060]):
        sprite("cooling-b" if index % 2 else "electrical-cabinet", (x, y), 145, .65)
for index, x in enumerate(range(320, 2160, 200)):
    sprite("rack-b" if index % 4 else "cooling-a", (x, 1180), 130, .68 if ITERATION == "02" else .55)
for x in [410, 1170, 1950]:
    sprite("maintenance-light", (x, 190), 35, .75)
with Image.open(OUTPUT / "utilities.png") as utilities:
    pipes = utilities.convert("RGBA")
    if ITERATION == "03":
        pipes.putalpha(pipes.getchannel("A").point(lambda value: round(value * .5)))
    canvas.alpha_composite(pipes)
vignette = Image.new("RGBA", canvas.size)
shade = ImageDraw.Draw(vignette)
shade.rectangle((0, 0, 2400, 1350), outline=(0, 8, 16, 180), width=80)
canvas = Image.alpha_composite(canvas, vignette.filter(ImageFilter.GaussianBlur(65)))
canvas.save(OUTPUT / "environment.png")
(OUTPUT / "composition.json").write_text(json.dumps({"iteration": int(ITERATION), "canvas": [2400, 1350],
    "external": ["kenney-space-station/pipe", "kenney-factory/pipe-large-valve"],
    "existingV3": ["rack-b", "rack-c", "cooling-a", "cooling-b", "electrical-cabinet", "maintenance-light"],
    "method": "existing V3 background props and procedural floor, actual Blender utility GLBs; heroes untouched",
    "productionRuntimeChanges": 0}, indent=2) + "\n")
