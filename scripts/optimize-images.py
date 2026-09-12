"""Generate web assets without modifying source PNGs. Requires Pillow 12.x."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sources = sorted((ROOT / "assets/coloring-pages").glob("*.png"))
sources += sorted((ROOT / "assets/mythical").glob("background-*.png"))
sources += [ROOT / "assets/forest/enchanted-background-landscape.png"]
manifest = []
for source in sources:
    thumbnail = source.parent.name == "coloring-pages"
    destination = ROOT / "assets/optimized" / ("thumbnails" if thumbnail else "backgrounds") / (source.stem + ".webp")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        output = original.convert("RGB")
        if thumbnail:
            output.thumbnail((240, 320), Image.Resampling.LANCZOS)
        output.save(destination, "WEBP", quality=90, method=6)
        manifest.append({"source": str(source.relative_to(ROOT)), "output": str(destination.relative_to(ROOT)),
                         "sourceBytes": source.stat().st_size, "outputBytes": destination.stat().st_size,
                         "width": output.width, "height": output.height,
                         "sha256": hashlib.sha256(destination.read_bytes()).hexdigest()})
(ROOT / "assets/optimized/manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Generated {len(manifest)} images: {sum(x['sourceBytes'] for x in manifest):,} source bytes → {sum(x['outputBytes'] for x in manifest):,} output bytes")
