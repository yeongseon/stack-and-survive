# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow==11.3.0"]
# ///
# Run: uv run source/hall_boards.py
"""Produce labelled review boards from actual renders without altering scene pixels."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
output = root / "iterations/04"
states = ["normal", "fit", "close", "construction", "cache-edge-active", "pressure"]
for width in [1440,1920,844]:
    board = Image.new("RGB",(1440,1440),"#091723")
    draw = ImageDraw.Draw(board)
    for index,state in enumerate(states):
        x,y = index%2*720,index//2*480
        with Image.open(output / f"comparison/proposed/proposal-{width}-{state}.png") as source:
            image = source.convert("RGB")
            image.thumbnail((720,450),Image.Resampling.LANCZOS)
            board.paste(image,(x,y+30))
        draw.text((x+12,y+10),f"{width}px / {state} / proposed04",fill="white")
    board.save(output / f"review-{width}.png")
board = Image.new("RGB",(2400,707),"#091723")
for index,iteration in enumerate(["03","04"]):
    with Image.open(root / f"iterations/{iteration}/environment.png") as source:
        board.paste(source.convert("RGB").resize((1200,675),Image.Resampling.LANCZOS),(index*1200,32))
ImageDraw.Draw(board).text((12,10),"ITERATION03 / PNG composition",fill="white")
ImageDraw.Draw(board).text((1212,10),"ITERATION04 / whole Blender room",fill="white")
board.save(output / "background-03-vs-04.png")
board = Image.new("RGB",(1200,2109),"#091723")
for index,candidate in enumerate("ABC"):
    with Image.open(output / f"candidates/04{candidate}.png") as source:
        board.paste(source.convert("RGB"),(0,index*703+28))
    ImageDraw.Draw(board).text((12,index*703+8),f"04{candidate} / initial composition study",fill="white")
board.save(output / "candidates-board.png")
files = [*Path(__file__).parent.joinpath("blender").glob("hall_*.py"),
         Path(__file__),Path(__file__).with_name("capture.mjs")]
manifest = {"sources":[{"path":str(path.relative_to(root)),"sha256":hashlib.sha256(path.read_bytes()).hexdigest()} for path in files],
    "inputModelHashes":json.loads((root / "source/selection.json").read_text()),
    "note":"Initial candidate renders precede refinement; final source reproduces the selected refined C. Original A/B/C images are historical comparisons, not current-source exports."}
(output / "source-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
