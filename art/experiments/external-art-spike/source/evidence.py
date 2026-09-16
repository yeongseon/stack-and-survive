# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow==11.3.0"]
# ///
# Run: uv run source/evidence.py
"""Join actual captures and upstream previews without fabricating gameplay pixels."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[1]
art = root.parents[1]
captures = json.loads((root / "comparison/captures.json").read_text())
metrics = []
for capture in captures:
    current = root / "comparison" / capture["current"]
    proposed = root / "comparison" / capture["proposed"]
    assert hashlib.sha256(current.read_bytes()).hexdigest() == capture["currentSha256"]
    assert hashlib.sha256(proposed.read_bytes()).hexdigest() == capture["proposedSha256"]
    with Image.open(current) as left, Image.open(proposed) as right:
        assert left.size == right.size == (capture["viewport"]["width"], capture["viewport"]["height"])
        width, height = left.size
        sheet = Image.new("RGB", (width * 2, height + 32), "#101e28")
        sheet.paste(left, (0, 32))
        sheet.paste(right, (width, 32))
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 9), "CURRENT V3 / QA capture", fill="white")
        draw.text((width + 12, 9), "PROPOSAL / real Blender assets added in browser memory", fill="white")
        sheet.save(root / "comparison/side-by-side" / f"{width}-{capture['name']}.png")
        difference = ImageChops.difference(left.convert("RGB"), right.convert("RGB"))
        changed = sum(1 for pixel in difference.getdata() if max(pixel) > 8)
        metrics.append({"name": capture["name"], "width": width, "height": height,
                        "changedPixelRatioThreshold8": changed / (width * height),
                        "tick": capture["before"]["tick"], "sameState": capture["before"]["resourceStates"] == capture["after"]["resourceStates"]})
packs = json.loads((root / "source/packs.json").read_text())
board = Image.new("RGB", (1200, 1000), "#182a37")
draw = ImageDraw.Draw(board)
index = 0
for pack in packs:
    for name, role in (pack["selected"] | pack["rejected"]).items():
        x, y = index % 5 * 240, index // 5 * 250
        with Image.open(art / "candidates/external" / pack["id"] / "previews" / f"{name}.png") as source:
            image = source.convert("RGBA")
            image.thumbnail((190, 185))
            board.paste(image, (x + 25, y + 15), image)
        draw.text((x + 8, y + 205), name, fill="white")
        draw.text((x + 8, y + 224), "SELECTED" if name in pack["selected"] else "REJECTED", fill="#b9d3df")
        index += 1
(root / "renders/props").mkdir(parents=True, exist_ok=True)
board.save(root / "renders/props/upstream-evaluation-sheet.png")
files = list((art / "candidates/external").rglob("*"))
stats = {"pairs": metrics, "candidateBytes": sum(path.stat().st_size for path in files if path.is_file()),
         "selectedModelBytes": sum(path.stat().st_size for path in files if path.suffix == ".glb"),
         "overlayBytes": (root / "renders/environment/external-overlay.png").stat().st_size,
         "overlayRGBA8Bytes": 2400 * 1350 * 4, "productionRuntimeNewTextures": 0}
(root / "comparison/metrics.json").write_text(json.dumps(stats, indent=2) + "\n")
print(json.dumps({key: value for key, value in stats.items() if key != "pairs"}))
