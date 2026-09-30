# Abstract character pieces with Blender MCP

Blender is an optional authoring tool, not a reading source or build dependency. New characters can share the existing pawn with distinguishable colors/labels. Prefer that until a different shape improves selection. Do not recreate or overwrite an unchanged model during a data-sync run.

## Before touching the scene

- Inspect the available Blender MCP tools and their current schemas. Start with scene/collection/object summaries (`get_objects_summary` in the current server), then inspect only relevant objects. Do not assume Blender is empty or that a previously named object is still the one you created.
- If the connection is unavailable, use the existing GLB or primitive fallback. Do not install/configure Blender, download assets, or use outside character imagery as a workaround.
- Work in a new, clearly named collection owned by this asset task. Never clear the scene, delete unrelated data, or change a user's existing objects. Record active object, selection, mode, and settings you will change; restore them, including on failure. If the user is in an incompatible edit/sculpt session, preserve it and defer asset authoring rather than forcibly resetting it.
- Inspect `scripts/create-pawn.py` as the current sample recipe. It creates an additive collection and exports selected meshes, but it is **not a batch character factory**: rerunning creates another collection, uses a fixed default name, and does not provide a try/finally restoration wrapper. Use an explicit export path, safe object-mode context, and failure restoration when adapting it. Do not rerun it on a no-op or to overwrite an existing asset unnecessarily.

## Design and export

- Use an abstract tabletop token, not an invented likeness. Names do not justify age, face, clothing, species, or equipment that the two authorized source files do not establish. Visual variation can be purely symbolic and should not look like an asserted canonical depiction.
- Follow the existing scale: base centered at the origin and touching the ground, roughly 0.9 units wide and 1.3 units high in Blender. Export glTF with its normal Y-up conversion; the runtime uses Y-up. Keep transforms/materials simple and inspect the result in the site.
- Use existing brass/wood/earth material language. Geometry should read at phone size. Distinguish characters with labels and silhouette as well as color. Avoid embedded text, source notes, external textures, linked files, cameras, lights, or authoring-only objects in the exported asset.
- Prefer purpose-built Blender tools when available. Use `execute_blender_code` only for needed procedural creation/export; consult bundled Blender API docs when signatures are uncertain. Use operators for primitives and explicit object references after creation. Select only this task's export objects immediately before exporting.
- Export a self-contained `.glb` to `public/models/<stable-public-id>.glb`. The existing model is about 76 KB; ordinary Git is suitable for similarly small assets. Inspect size, mesh count, GLB JSON extras/names/URIs, and ensure no source paths, replay references, or private notes are embedded. Large texture payloads should be justified and reviewed, not silently added to Git LFS.
- Keep an editable, portable recipe under `scripts/` if new procedural geometry is added. Recipes must not embed machine-specific export paths. Do not add private `.blend` backups or rendered evidence to Git. Preserve the connected user's session; saving its `.blend` is not needed for the website.

## Runtime acceptance

Add a character/model mapping only when the app supports selecting that character. Reuse cached geometry/materials where useful; avoid duplicate downloads and dispose owned geometry correctly. Asset completion must request one render in the on-demand renderer. Verify the correct piece, base height, shadows, rotation, touch selection, chapter retraction, and fallback when the model request fails. Inspect desktop and phone screenshots and run the release audit, which inspects GLB JSON metadata.

Record source coverage for the supported character/journal/route—not for making a decorative model. A model alone does not account for a movement.
