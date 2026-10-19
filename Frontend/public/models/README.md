# Snitch hero garment handoff

No garment model is bundled. The hero currently shows an explicitly labeled AI-generated **concept preview**, not a 3D garment or a real catalog product. All three carousel studies deliberately reuse the same temporary olive still. These are layout placeholders, not three distinct products. No color swatches, prices, or fabric specifications are invented for them.

The redesigned studio uses oversized split typography, a centered garment, and two secondary previews. It cycles every nine seconds. With real models configured, the meshes enter from below with a short turn, rotate continuously, and travel along an elliptical carousel path as selection changes. Autoplay stops during dragging, keyboard focus within the hero, reduced motion, hidden tabs, and offscreen visibility. Previous/next and pause controls remain outside the canvas. The temporary stills slide and scale; they do not pretend to provide real 3D rotation.

## Required final asset

Supply an original or properly licensed, self-contained GLB of a heavyweight boxy oversized T-shirt with dropped shoulders, a ribbed collar, realistic thickness, seams, UVs, and sculpted folds. Remove any mannequin, hanger, floor, or lights. Face the front along +Z, with +Y up; the viewer centers and normalizes its longest dimension automatically. Use baked fabric detail and glTF PBR base-color, roughness and normal maps. Keep the initial olive material; the integration deliberately preserves authored materials.

Target <= 3 MB, <= 50,000 triangles and <= 2K textures for mobile. These are asset delivery budgets, not measurements of a model already tested here. Prefer standard glTF textures or Draco-compressed geometry (Drei's loader supports Draco); KTX2 needs additional decoder configuration. Use local textures embedded in the GLB to avoid cross-origin requests. Avoid live cloth physics. Optional baked fabric animation can be supplied, but animation playback is not implemented in this viewer and must be evaluated separately for reduced-motion behavior and mobile cost.

Keep the source, creator, license text, proof of purchase where applicable, and required attribution beside the final asset. Verify the license allows delivery of the model to visitors' browsers; a generic render-only license may not allow downloadable source geometry.

## Enable

1. Add three verified garment GLBs under `public/models/`, with distinct IDs, descriptive names, and matching poster images.
2. Set each entry's `modelUrl` in the `garments` array in `src/features/products/components/hero/garment.js` to its actual local URL, for example `` `${import.meta.env.BASE_URL}models/snitch-oversized-tee.glb` `` after that file exists. All three URLs are intentionally `null` now; the app does not request invented asset URLs. The viewer is enabled only when every slot has a model. Keep exactly three slots for the current three-position preview layout.
3. Check fit and lighting with the actual mesh; adjust the camera or asset orientation as needed.
4. Verify desktop, mobile, pointer drag, vertical touch scrolling, keyboard previous/next/reset, pause, reduced motion, lost/unsupported WebGL, corrupt/missing GLB, slow loading, and offscreen/tab visibility. The canvas reserves space, is lazy-loaded, caps DPR at 1.5, uses demand rendering when paused, and stops its animation loop offscreen. Target <= 9 MB total across all three models and verify memory on actual mobile hardware.

The existing still stays visible during loading and failures. The model replaces it only when the GLB mounts. Failed initialization/context loss is contained by the viewer error boundary. A persistent loading state remains a still rather than blocking shopping. Refresh to retry a failed viewer.

## Reference research

- Inspiration: https://www.draw-your-polo.lacoste.com/en/ — reachable via web, but interactive browser inspection was unavailable in this environment. No reference assets were copied.
- Search identified https://www.artstation.com/marketplace/p/0kljg/mens-oversized-t-shirt with a GLB and a listed commercial license. It requires purchase, the listed GLB is 30 MB, and browser redistribution rights and suitability have **not** been verified. It is not included or recommended as an already cleared production asset.

## Temporary still provenance

`public/images/hero-garment.png` was generated with the built-in imagegen tool, visually inspected, and copied into the project. It is an illustrative concept, not product photography.

Prompt:

> Use case: product-mockup. Asset type: temporary editorial homepage garment still for Snitch. Create one photorealistic heavyweight boxy oversized dark olive green cotton T-shirt, dropped shoulders, substantial ribbed crewneck, believable seams and irregular sculptural fabric folds, floating upright with invisible wearer, front three-quarter view turned slightly, sleeves naturally open. Entire shirt visible, centered in square composition with generous breathing room, no hanger, no person, no props, no text or logos. Soft warm studio key and rim lighting, tactile matte cotton fabric. Transparent background, no cast shadow (added by website). Premium understated fashion product photography.
