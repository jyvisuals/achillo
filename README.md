# Achilló — AltStore source

Static AltStore source for the Achilló rehab app (built from `~/dev/achilles-app`).

- `apps.json` — the source feed AltStore reads. Updated by `Build Achilles.command`.
- `ipa/` — unsigned builds, one per version; AltStore signs on install.
- `index.html` — one-tap "Add to AltStore" page at https://raw.githubusercontent.com/jyvisuals/achillo/main/

Don't edit `apps.json` by hand; the build script rewrites it.
