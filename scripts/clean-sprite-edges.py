"""Remove the pale extraction fringe from the Forest Mode sprite sheet."""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/forest/forest-sprites.png"
OUTPUT = ROOT / "assets/forest/forest-sprites-clean.png"


image = Image.open(SOURCE).convert("RGBA")
red, green, blue, alpha = image.split()

# The source mask is binary after background removal. Pull it inward by one
# pixel to discard the light matte, then soften only that new inner edge so the
# illustrations remain smooth against the dark Forest Mode background.
inner_mask = alpha.filter(ImageFilter.MinFilter(3))
clean_alpha = inner_mask.filter(ImageFilter.GaussianBlur(0.55))

cleaned = Image.merge("RGBA", (red, green, blue, clean_alpha))
cleaned.save(OUTPUT, optimize=True)
