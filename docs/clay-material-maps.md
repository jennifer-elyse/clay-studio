# Clay Studio — registered clay material maps

Clay's body is recolorable using the same neutral-material conventions as Frostly,
without recoloring the eyes, mouth, tongue, or finished unicorn. The old runtime
blue-pixel threshold was removed because it excluded dark clay and left a black
"afro" ring around the recolored body.

Each generated animated WebP in `apps/studio/public/assets/animations/blue/material/`
contains **four 320 × 320 registered panels** packed into one 640 × 640 animated
frame: (1) original illustration, (2) neutral diffuse reference and body mask
in the alpha channel, (3) grayscale light map, and (4) a low-energy specular map.

The four panels share **one WebP animation clock**. The body mask is generated
offline from the dominant connected blue clay region and expanded into its
darkest shadows. This prevents the dark material boundary being left unchanged.
The mask deliberately excludes isolated blue irises and non-clay features.
The original drawing supplies non-body facial details and sparkle effects.

The diffuse map preserves local sculpted texture without preserving blue dye.
The light map preserves broad illumination with an ambient floor, to prevent
the shadowed regions becoming black in light-colored Clay presets.
Specular is an estimated highlight map capped at **8%**, not a duplicate of
the original image. These estimates derive from illustrated photographs and
are **not measured PBR texture maps**.

Original alpha is canonical; map alpha is the body material mask. All four
maps share identical dimensions, frame timing, and registration. The compositor
uses the body mask to blend the selected pigment with diffuse × light,
followed by bounded specular screen highlights. White sclera, pupils, tongue,
and the unicorn keep their original illustrated colors.

Generate maps locally after obtaining the source WebPs:

```bash
python3 -m pip install Pillow==11.3.0 numpy==2.3.5 scipy==1.16.3
python3 scripts/generate-clay-materials.py
python3 scripts/check-clay-materials.py
npm test
npm run build
```

Publishing from `main` regenerates the maps, verifies them, commits them to
the repo, and includes them in the new ZIP release. The original animation
files and existing command mappings remain intact for fallback compatibility.
