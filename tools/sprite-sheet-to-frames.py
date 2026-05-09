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


def chroma_key_global_erase(img: Image.Image, ref: tuple[int, int, int], min_excess: int = 15) -> Image.Image:
    """For chroma-key backgrounds (saturated neon), erase ANY pixel
    that exhibits the *same channel-dominance pattern* as the chroma
    color, regardless of brightness. Catches anti-aliased edge halos
    (dark-green between green chroma and dark hair outline) that
    absolute-distance fuzz misses because their brightness has fallen
    but the green-tint is preserved.

    Algorithm:
      - Identify which channels of `ref` are dominant (each
        dominant channel exceeds the average of the others by >50).
      - For each pixel, compute the same per-channel excess.
      - If pixel's excess matches ref's dominance pattern with at
        least `min_excess` magnitude, the pixel is chroma-tinted.
        Erase it.

    Safe only when the character palette is far from the chroma
    direction (no pure greens / pure magentas in the character),
    which is the whole point of using chroma keys."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    bg_r, bg_g, bg_b = ref

    # Which channels dominate the ref?
    ref_r_excess = bg_r - (bg_g + bg_b) / 2
    ref_g_excess = bg_g - (bg_r + bg_b) / 2
    ref_b_excess = bg_b - (bg_r + bg_g) / 2
    r_dom = ref_r_excess > 50
    g_dom = ref_g_excess > 50
    b_dom = ref_b_excess > 50

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            r_excess = r - (g + b) / 2
            g_excess = g - (r + b) / 2
            b_excess = b - (r + g) / 2
            # Pixel matches the ref's dominance pattern if every
            # ref-dominant channel also dominates in the pixel by
            # at least `min_excess`.
            tinted = True
            if r_dom and r_excess < min_excess: tinted = False
            if g_dom and g_excess < min_excess: tinted = False
            if b_dom and b_excess < min_excess: tinted = False
            # If ref has no dominant channel (shouldn't happen for
            # is_chroma_key=True, but defensive) skip.
            if not (r_dom or g_dom or b_dom):
                tinted = False
            if tinted:
                pixels[x, y] = (r, g, b, 0)
    return img


def is_chroma_key(ref: tuple[int, int, int], threshold: int = 150) -> bool:
    """Detect a chroma-key background (saturated neon — green screen,
    magenta screen, etc.) by checking how far the corner color is
    from gray. A highly-saturated bg (e.g. (20, 240, 20) green or
    (240, 12, 240) magenta) has channel range > 150. Cream/gray
    backgrounds have very small channel range and fail this check."""
    r, g, b = ref
    return max(r, g, b) - min(r, g, b) > threshold


def is_warm_chroma(ref: tuple[int, int, int]) -> bool:
    """A warm chroma key (orange / red / yellow) is one where red
    dominates over both green and blue. The channel-dominance pattern
    of warm chromas overlaps with skin tones (skin: r > g > b too),
    so the aggressive `chroma_key_global_erase` and the wide halo-
    eroder fuzz that work for cool chromas (green/magenta/cyan) eat
    skin and warm clothing.

    For warm-chroma backgrounds, the cleanup uses gentler tolerances
    and skips `chroma_key_global_erase` entirely; flood-fill from the
    corners is enough because warm-chroma sheets in this codebase
    have very uniform backgrounds (channel variance ~10 across the
    entire image)."""
    r, g, b = ref
    return r > g + 30 and r > b + 30


def already_has_alpha(img: Image.Image) -> bool:
    """True if the input PNG already has real transparency at its
    corners — meaning some upstream tool (rembg / Photoshop /
    Photoroom) already produced an alpha channel. In that case we
    skip the cream-bg-chasing flood-fill + halo eroder entirely;
    the input is good as-is."""
    if img.mode != "RGBA":
        return False
    p = img.load()
    w, h = img.size
    return all(p[c][3] == 0 for c in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])


def remove_background(img: Image.Image, fuzz: int = 35) -> tuple[Image.Image, tuple[int, int, int]]:
    """Flood-fill from the four corners through any pixel within
    `fuzz` RGB distance of the corner color, marking those pixels
    alpha=0. Reaches the halo of near-cream pixels around character
    outlines that a global fuzz-match would either miss (too tight)
    or eat into the character (too loose). Pixels only become
    transparent if they're reachable from outside via similarly-
    colored neighbors — interior cream-ish pixels (skin highlights,
    eye whites) stay opaque.

    Auto-detects chroma-key backgrounds (saturated neon green /
    magenta etc.) and bumps fuzz to 90. The character's palette is
    so far from these bgs that the wider tolerance is safe and
    catches anti-aliased edges cleanly.
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Auto-bump fuzz for chroma-key bgs based on the corner sample.
    # Cool chromas (green/magenta/cyan) get the aggressive bump because
    # the gap between bg and character palette is large. Warm chromas
    # (orange/red/yellow) overlap with skin-tone dominance — only a
    # gentle bump is safe before flood-fill starts bleeding into faces
    # and warm clothing.
    sr0, sg0, sb0, _ = pixels[0, 0]
    if is_chroma_key((sr0, sg0, sb0)):
        if is_warm_chroma((sr0, sg0, sb0)):
            fuzz = max(fuzz, 60)
        else:
            fuzz = max(fuzz, 90)

    def matches_bg(x: int, y: int, ref: tuple[int, int, int]) -> bool:
        r, g, b, _ = pixels[x, y]
        return abs(r - ref[0]) <= fuzz and abs(g - ref[1]) <= fuzz and abs(b - ref[2]) <= fuzz

    visited: set[tuple[int, int]] = set()
    # Seed from the four corners only. With a uniform bg this is
    # enough to cover the whole bg via flood propagation, and it
    # doesn't risk bleeding into the character through near-bg-color
    # interior pixels (white coats, skin highlights) the way dense
    # edge seeding would.
    seeds: list[tuple[int, int]] = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for sx, sy in seeds:
        if (sx, sy) in visited:
            continue
        sr, sg, sb, _ = pixels[sx, sy]
        ref = (sr, sg, sb)
        stack = [(sx, sy)]
        while stack:
            x, y = stack.pop()
            if (x, y) in visited:
                continue
            if x < 0 or x >= w or y < 0 or y >= h:
                continue
            if not matches_bg(x, y, ref):
                continue
            visited.add((x, y))
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, 0)
            stack.append((x + 1, y))
            stack.append((x - 1, y))
            stack.append((x, y + 1))
            stack.append((x, y - 1))
    # Use the first corner sample as the canonical bg for downstream
    # passes (erode_halo needs to know what color to chase).
    sr, sg, sb, _ = pixels[0, 0]
    return img, (sr, sg, sb)


def keep_largest_blob(img: Image.Image, dilate_radius: int = 3) -> Image.Image:
    """Connected-component prune that's tolerant of small gaps inside
    a character. Procedure:

      1. Build a dilated alpha mask — each opaque pixel "extends"
         dilate_radius pixels into transparent neighbors. This lets
         a slightly-disconnected arm or strand merge with the torso
         component without bridging to a different character that's
         dozens of pixels away in a neighbor cell.
      2. Find connected components on the dilated mask.
      3. Keep only pixels of the original image whose position is in
         the largest dilated component.

    Required because anti-aliased outlines can have 1-2px transparent
    gaps that split a character into "torso" + "arm" + "hair" — naive
    largest-blob throws away everything but torso, dropping arms.
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Step 1: dilated mask. dilated[x][y] = True iff any pixel within
    # Chebyshev distance dilate_radius of (x,y) is opaque.
    opaque = [[pixels[x, y][3] > 0 for y in range(h)] for x in range(w)]
    if dilate_radius > 0:
        dilated = [[False] * h for _ in range(w)]
        r = dilate_radius
        for x in range(w):
            for y in range(h):
                if not opaque[x][y]:
                    continue
                x0, x1 = max(0, x - r), min(w - 1, x + r)
                y0, y1 = max(0, y - r), min(h - 1, y + r)
                for dx in range(x0, x1 + 1):
                    row = dilated[dx]
                    for dy in range(y0, y1 + 1):
                        row[dy] = True
    else:
        dilated = opaque

    # Step 2: connected components on the dilated mask.
    component_id = [[0] * h for _ in range(w)]
    component_sizes: list[int] = [0]
    next_id = 1
    for sy in range(h):
        for sx in range(w):
            if not dilated[sx][sy] or component_id[sx][sy] != 0:
                continue
            stack = [(sx, sy)]
            size = 0
            while stack:
                x, y = stack.pop()
                if x < 0 or x >= w or y < 0 or y >= h:
                    continue
                if not dilated[x][y] or component_id[x][y] != 0:
                    continue
                component_id[x][y] = next_id
                size += 1
                stack.append((x + 1, y))
                stack.append((x - 1, y))
                stack.append((x, y + 1))
                stack.append((x, y - 1))
            component_sizes.append(size)
            next_id += 1

    if next_id <= 2:
        return img

    largest = max(range(1, next_id), key=lambda i: component_sizes[i])
    # Step 3: erase original-image pixels NOT in the largest dilated
    # component. Pixels in the gap-bridged region but originally
    # transparent stay transparent (we only clear opaque pixels that
    # were assigned to a smaller component).
    for y in range(h):
        for x in range(w):
            if not opaque[x][y]:
                continue
            if component_id[x][y] != largest:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return img


def erode_halo(img: Image.Image, ref: tuple[int, int, int], halo_fuzz: int = 60, passes: int = 3) -> Image.Image:
    """Remove the cream halo of anti-aliased pixels that flood-fill
    leaves around the character outline. Strategy: iteratively erase
    any opaque edge pixel (4-neighbor of a transparent pixel) whose
    color is within `halo_fuzz` of the background color. Multiple
    passes catch the second/third layer of anti-aliasing rings.

    Position-aware: interior cream-adjacent pixels (skin highlights,
    light fabric folds) stay opaque because they don't touch the
    transparent boundary. Only the halo on the *outside* of the
    character gets eaten.

    Auto-bumps halo_fuzz for chroma-key bgs (saturated neon) — the
    anti-aliased ring is wider there but the gap to character colors
    is also much wider, so wider tolerance is safe."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    bg_r, bg_g, bg_b = ref
    # Cool chromas: bump halo_fuzz wide. Warm chromas: gentler — the
    # halo eroder works *inside-out from transparent edges*, so a wide
    # halo_fuzz against an orange ref will eat warm clothing edges.
    if is_chroma_key(ref):
        if is_warm_chroma(ref):
            halo_fuzz = max(halo_fuzz, 50)
        else:
            halo_fuzz = max(halo_fuzz, 130)

    for _ in range(passes):
        # Snapshot the current alpha mask so all edits this pass see
        # the same boundary; otherwise erosion runs away in raster
        # order and eats further than 1 pixel per pass.
        alpha = [[pixels[x, y][3] for y in range(h)] for x in range(w)]
        changed = False
        for y in range(h):
            for x in range(w):
                if alpha[x][y] == 0:
                    continue
                # Edge pixel? At least one 4-neighbor is transparent
                # (or out of bounds — treat OOB as transparent).
                edge = (
                    x == 0 or alpha[x - 1][y] == 0 or
                    x == w - 1 or alpha[x + 1][y] == 0 or
                    y == 0 or alpha[x][y - 1] == 0 or
                    y == h - 1 or alpha[x][y + 1] == 0
                )
                if not edge:
                    continue
                r, g, b, _ = pixels[x, y]
                if abs(r - bg_r) <= halo_fuzz and abs(g - bg_g) <= halo_fuzz and abs(b - bg_b) <= halo_fuzz:
                    pixels[x, y] = (r, g, b, 0)
                    changed = True
        if not changed:
            break
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


def split_grid(img: Image.Image, rows: int, cols: int) -> list[list[Image.Image]]:
    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows
    return [
        [img.crop((c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)) for c in range(cols)]
        for r in range(rows)
    ]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", required=True, help="Path to sprite-sheet PNG/JPG")
    p.add_argument("--frames", type=int, default=4, help="Number of frames per row (default 4)")
    p.add_argument("--rows", type=int, default=1, help="Number of rows; >1 enables grid mode where each row = a separate character (default 1)")
    p.add_argument("--prefix", required=True, help="Output filename prefix. In grid mode, output is <prefix>_<row>_<col>.png")
    p.add_argument("--out", default="public/sprites/player", help="Output directory")
    p.add_argument("--size", type=int, default=64, help="Output size in px (default 64)")
    p.add_argument("--fuzz", type=int, default=35, help="Flood-fill bg-removal fuzz tolerance (default 35)")
    p.add_argument("--halo-fuzz", type=int, default=60, help="Edge-halo eroder fuzz tolerance (default 60)")
    p.add_argument("--halo-passes", type=int, default=3, help="Halo eroder iterations; each pass eats 1 px ring (default 3)")
    p.add_argument("--dilate", type=int, default=3, help="Connected-component dilation radius for blob filter; bigger = more tolerant of intra-character gaps but more risk of merging neighbor characters (default 3)")
    args = p.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"input not found: {input_path}")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(input_path)
    if args.rows > 1:
        grid = split_grid(sheet, rows=args.rows, cols=args.frames)
        for r, row in enumerate(grid):
            for c, cell in enumerate(row):
                if already_has_alpha(cell):
                    cleaned = cell.convert("RGBA")
                else:
                    cleaned, ref = remove_background(cell, fuzz=args.fuzz)
                    cleaned = erode_halo(cleaned, ref, halo_fuzz=args.halo_fuzz, passes=args.halo_passes)
                    if is_chroma_key(ref) and not is_warm_chroma(ref):
                        # Catch any chroma-tinted pixels enclosed inside
                        # the silhouette (curls of hair, etc.) that
                        # flood-fill couldn't reach. Skipped for warm
                        # chromas (orange / red / yellow) because the
                        # global erase relies on a channel-dominance
                        # heuristic that overlaps skin tones — running
                        # it on warm bgs eats faces and hands.
                        cleaned = chroma_key_global_erase(cleaned, ref)
                cleaned = keep_largest_blob(cleaned, dilate_radius=args.dilate)
                trimmed = trim_to_bbox(cleaned)
                sized = fit_to_square(trimmed, args.size)
                out_path = out_dir / f"{args.prefix}_{r}_{c}.png"
                sized.save(out_path, "PNG")
                print(f"wrote {out_path}  ({trimmed.size[0]}×{trimmed.size[1]} → {args.size}×{args.size})")
    else:
        frames = split_sheet(sheet, args.frames)
        for i, frame in enumerate(frames):
            if already_has_alpha(frame):
                cleaned = frame.convert("RGBA")
            else:
                cleaned, ref = remove_background(frame, fuzz=args.fuzz)
                cleaned = erode_halo(cleaned, ref, halo_fuzz=args.halo_fuzz, passes=args.halo_passes)
                # See grid-mode branch — global erase is unsafe on
                # warm chromas because skin tones share its dominance
                # signature.
                if is_chroma_key(ref) and not is_warm_chroma(ref):
                    cleaned = chroma_key_global_erase(cleaned, ref)
            cleaned = keep_largest_blob(cleaned, dilate_radius=args.dilate)
            trimmed = trim_to_bbox(cleaned)
            sized = fit_to_square(trimmed, args.size)
            out_path = out_dir / f"{args.prefix}_{i}.png"
            sized.save(out_path, "PNG")
            print(f"wrote {out_path}  ({trimmed.size[0]}×{trimmed.size[1]} → {args.size}×{args.size})")


if __name__ == "__main__":
    main()
