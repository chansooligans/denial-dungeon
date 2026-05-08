# Chloe sprite-sheet source

Drop the four LoRA-generated walk-cycle sheets here, named exactly:

| File | Contents |
|---|---|
| `chloe-side-a.png` | Side profile, 4 walk frames (painterly variant) |
| `chloe-side-b.png` | Side profile, 4 walk frames (chunkier pixel variant) |
| `chloe-back.png`   | Back view, 4 walk frames |
| `chloe-front.png`  | Front view, 4 walk frames |

Each sheet should have **4 frames laid out horizontally**, on a
uniform off-white / cream background.

Once the four files are in place, run:

```sh
./tools/process-chloe-sheets.sh
```

That splits each sheet, removes the background, trims to the
character bbox, and writes 16 transparent 64×64 PNGs to
`public/sprites/player/`. Pick which side variant you want at
the bottom of `process-chloe-sheets.sh` (defaults to variant A).

Source images here are not committed — they're generation
outputs and we keep the repo lean. The 64×64 outputs in
`public/sprites/player/` are committed.
