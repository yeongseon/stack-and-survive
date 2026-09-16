# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: uv run source/acquire.py /tmp/opencode (from experiment directory).
"""Extract a hash-pinned, bounded selection; retain unmodified license evidence."""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Final, TypedDict
from zipfile import ZipFile


class Pack(TypedDict):
    id: str
    name: str
    version: str
    source: str
    url: str
    archive: str
    sha256: str
    selected: dict[str, str]
    rejected: dict[str, str]


ROOT: Final = Path(__file__).resolve().parents[3]
EXPERIMENT: Final = Path(__file__).resolve().parents[1]


def main() -> None:
    packs: list[Pack] = json.loads(Path(__file__).with_name("packs.json").read_text())
    records = []
    textures = []
    verified_at = datetime.now(timezone.utc).isoformat()
    for pack in packs:
        archive = Path(sys.argv[1]) / pack["archive"]
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        if digest != pack["sha256"]:
            raise RuntimeError(f"Archive mismatch: {archive}")
        target = ROOT / "candidates" / "external" / pack["id"]
        for folder in ("selected", "originals", "previews"):
            (target / folder).mkdir(parents=True, exist_ok=True)
        with ZipFile(archive) as source:
            license_bytes = source.read("License.txt")
            (target / "LICENSE.txt").write_bytes(license_bytes)
            for name, role in pack["selected"].items():
                member = f"Models/GLB format/{name}.glb"
                content = source.read(member)
                (target / "selected" / f"{name}.glb").write_bytes(content)
                records.append({"pack": pack["id"], "name": name, "role": role,
                    "archiveMember": member, "sha256": hashlib.sha256(content).hexdigest(),
                    "bytes": len(content), "review": "candidate", "runtime": None})
            texture = "Models/GLB format/Textures/colormap.png"
            (target / "selected" / "Textures").mkdir(exist_ok=True)
            texture_bytes = source.read(texture)
            (target / "selected" / "Textures" / "colormap.png").write_bytes(texture_bytes)
            textures.append({"pack": pack["id"], "path": "Textures/colormap.png",
                "archiveMember": texture, "sha256": hashlib.sha256(texture_bytes).hexdigest(),
                "bytes": len(texture_bytes)})
            for name in pack["selected"] | pack["rejected"]:
                (target / "previews" / f"{name}.png").write_bytes(source.read(f"Previews/{name}.png"))
        (target / "SOURCE.md").write_text(
            f"# {pack['name']} — source record\n\nAuthor: Kenney. Pack version: {pack['version']}.\n\n"
            f"Original source: {pack['source']}\n\nDownload: {pack['url']}\n\n"
            f"Local archive SHA-256 verified at: {verified_at}. This run does not recheck the website.\n\n"
            f"Archive SHA-256: `{digest}`. Bytes: {archive.stat().st_size}.\n\n"
            "License: **CC0-1.0**, CC0 1.0 Universal; bundled LICENSE.txt retained byte-for-byte.\n"
            "License reference: https://creativecommons.org/publicdomain/zero/1.0/\n\n"
            "CC0 permits copying, redistribution and modification, including commercial use; attribution is not required. "
            "No trademark/privacy/patent warranty or project/employer rights clearance is inferred. "
            "Kenney branding is not selected. This is factual sourcing evidence, not legal advice or approval.\n\n"
            "Selected source files are unchanged GLBs and their colormap. Pack previews are unchanged evaluation evidence. "
            "Rendering/material transformations live in the experiment's source/blender script. "
            "No production inventory or rights-approval fields were changed.\n\n"
            "## Files selected\n\n" + "\n".join(f"- `Models/GLB format/{n}.glb`: {r}" for n, r in pack["selected"].items()) + "\n")
        (target / "README.md").write_text(f"# Kenney {pack['name']} candidate\n\nSee [SOURCE.md](SOURCE.md) and [LICENSE.txt](LICENSE.txt). "
            "`selected/` contains unchanged selected models and their texture. `previews/` is upstream evaluation evidence, not project renders. "
            "These files are **not runtime assets** and are not covered by the Pages demo exception.\n")
        (target / "originals" / "README.md").write_text("# Original archive\n\nArchive intentionally not stored in Git. "
            "The exact URL, SHA-256 and size are in ../SOURCE.md. Download outside the checkout and run the experiment's source/acquire.py.\n")
    (EXPERIMENT / "source" / "selection.json").write_text(json.dumps(records, indent=2) + "\n")
    (EXPERIMENT / "source" / "textures.json").write_text(json.dumps(textures, indent=2) + "\n")
    receipt = {"verifiedAt": verified_at, "verification": "local-archive-sha256",
        "archives": [{"pack": pack["id"], "sha256": pack["sha256"]} for pack in packs]}
    (EXPERIMENT / "source" / "acquisition.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(f"Extracted {len(records)} selected models; runtime untouched")


if __name__ == "__main__":
    main()
