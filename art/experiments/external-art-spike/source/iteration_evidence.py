# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow==11.3.0"]
# ///
# Run: uv run source/iteration_evidence.py 03
"""Verify and join iteration captures while retaining the original rejected study."""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

experiment = Path(__file__).resolve().parents[1]
iteration = sys.argv[1]
if len(iteration) != 2 or not iteration.isdecimal():
    raise RuntimeError("Iteration must be two digits")
root = experiment / "iterations" / iteration
captures = json.loads((root / "comparison/captures.json").read_text())
metrics = []
environment = root / "environment.png"
environment_hash = hashlib.sha256(environment.read_bytes()).hexdigest()
for capture in captures:
    if capture["overlaySha256"] != environment_hash:
        raise RuntimeError("Environment hash mismatch")
    for key in ["tick", "resourceStates", "playerCamera", "worldNodes", "worldTargets", "flows"]:
        if capture["before"][key] != capture["after"][key]:
            raise RuntimeError(f"State mismatch: {key}")
    paths = [root / "comparison" / capture[side] for side in ["current", "proposed"]]
    for path, key in zip(paths, ["currentSha256", "proposedSha256"], strict=True):
        if hashlib.sha256(path.read_bytes()).hexdigest() != capture[key]:
            raise RuntimeError(f"Capture hash mismatch: {path}")
    with Image.open(paths[0]) as left, Image.open(paths[1]) as right:
        size = (capture["viewport"]["width"], capture["viewport"]["height"])
        if left.size != size or right.size != size:
            raise RuntimeError("Capture dimensions mismatch")
        width, height = size
        board = Image.new("RGB", (width * 2, height + 32), "#101e28")
        board.paste(left, (0, 32))
        board.paste(right, (width, 32))
        draw = ImageDraw.Draw(board)
        draw.text((12, 9), "CURRENT V3 / identical game state", fill="white")
        draw.text((width + 12, 9), f"ITERATION {iteration} / V3 hall + real Kenney utility renders", fill="white")
        board.save(root / "comparison/side-by-side" / f"{width}-{capture['name']}.png")
        changed = sum(max(pixel) > 8 for pixel in ImageChops.difference(left.convert("RGB"), right.convert("RGB")).getdata())
        metrics.append({"viewport": capture["viewport"], "name": capture["name"],
                        "changedRatioThreshold8": changed / (width * height), "stateMatched": True})
with Image.open(environment) as image:
    if image.size != (2400, 1350):
        raise RuntimeError("Environment dimensions mismatch")
receipt = {"iteration": iteration, "environmentSha256": environment_hash,
           "environmentBytes": environment.stat().st_size, "rgba8Bytes": 2400 * 1350 * 4,
           "runtimeTexturesAdded": 0, "pairs": metrics}
(root / "comparison/metrics.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(f"Verified and joined {len(metrics)} iteration {iteration} pairs")
