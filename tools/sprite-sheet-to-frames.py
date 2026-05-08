#!/usr/bin/env python3
"""
Sprite-sheet → individual transparent 64×64 PNG frames.

Takes a sheet of N frames laid out horizontally, splits it into
equal-width slices, replaces the cream background with transparency,
trims to the character bbox, and downscales to 64×64 with
nearest-neighbor (preserves the pixel-art look — no edge softening).

Usage
-----
    python3 tools/sprite-sheet-to-frames.py \
        --input sprite-source/chloe/chloe-side.png \
        --frames 4 \
        --prefix side_walk \
        --out public/sprites/player

Produces public/sprites/player/side_walk_0.png … _3.png.

Repeat for each direction (front / back / side). The output PNGs
are 64×64 with alpha; drop them into the game's loader as overrides
for the procedural player textures.
"""

import argparse
from pathlib import Path

from PIL import Image


def remove_background(img: Image.Image, fuzz: int = 22) -> Image.Image:
    """Sample the corner pixel as the background color and convert
    matching pixels (within `fuzz` of each RGB channel) to alpha=0.
    Keeps the character intact assuming the bg is uniform off-white
    (which is what the LoRA outputs)."""
    img = img.convert("RGBA")
    pixels = img.load()
    bg_r, bg_g, bg_b, _ = pixels[0, 0]
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = pixels[x, y]
            if abs(r - bg_r) <= fuzz and abs(g - bg_g) <= fuzz and abs(b - bg_b) <= fuzz:
                pixels[x, y] = (r, g, b, 0)
    return img


def trim_to_bbox(img: Image.Image, padding: int = 2) -> Image.Image:
    """Crop the image to the bounding box of non-transparent pixels,
    with a small padding so feet/hair don't touch the canvas edges
    after downscaling."""
    bbox = img.getbbox()
    if bbox is None:
        return img
    x0, y0, x1, y1 = bbox
    w, h = img.size
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(w, x1 + padding)
    y1 = min(h, y1 + padding)
    return img.crop((x0, y0, x1, y1))


def fit_to_square(img: Image.Image, size: int) -> Image.Image:
    """Resize to fit inside `size`x`size` keeping aspect ratio,
    then paste centered onto a transparent square canvas. Uses
    nearest-neighbor to preserve pixel-art edges."""
    w, h = img.size
    scale = size / max(w, h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = img.resize((new_w, new_h), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - new_w) // 2
    oy = (size - new_h) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def split_sheet(img: Image.Image, frames: int) -> list[Image.Image]:
    w, h = img.size
    frame_w = w // frames
    return [img.crop((i * frame_w, 0, (i + 1) * frame_w, h)) for i in range(frames)]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", required=True, help="Path to sprite-sheet PNG/JPG")
    p.add_argument("--frames", type=int, default=4, help="Number of frames in the sheet (default 4)")
    p.add_argument("--prefix", required=True, help="Output filename prefix, e.g. side_walk")
    p.add_argument("--out", default="public/sprites/player", help="Output directory")
    p.add_argument("--size", type=int, default=64, help="Output size in px (default 64)")
    p.add_argument("--fuzz", type=int, default=22, help="Background-removal fuzz tolerance (default 22)")
    args = p.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"input not found: {input_path}")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(input_path)
    frames = split_sheet(sheet, args.frames)
    for i, frame in enumerate(frames):
        cleaned = remove_background(frame, fuzz=args.fuzz)
        trimmed = trim_to_bbox(cleaned)
        sized = fit_to_square(trimmed, args.size)
        out_path = out_dir / f"{args.prefix}_{i}.png"
        sized.save(out_path, "PNG")
        print(f"wrote {out_path}  ({trimmed.size[0]}×{trimmed.size[1]} → {args.size}×{args.size})")


if __name__ == "__main__":
    main()
