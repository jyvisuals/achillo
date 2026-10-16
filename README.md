# Achilló

Jon's Achilles rehab app for iPhone, and the AltStore source that delivers it.

- `app/` — the app: `src/achilles-tracker.html` (the page, same as the web version), `src/native.js` (notifications, haptics, Share log), the Capacitor iOS project.
- `.github/workflows/build.yml` — every push to `app/` builds an unsigned IPA on GitHub's Mac runners and publishes it below.
- `apps.json` + `ipa/` — the AltStore feed. Subscribe once in AltStore → Sources → + with
  `https://raw.githubusercontent.com/jyvisuals/achillo/main/apps.json`; new builds appear as **Update**.

Release note for the next build goes in `app/notes.txt`. Versions are `1.1.<run number>`.
`app/make-ipa.sh` still builds and publishes from a Mac if GitHub ever can't.
