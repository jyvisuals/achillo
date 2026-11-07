# Achilló

Jon's Achilles rehab app for iPhone and Apple Watch, delivered through TestFlight.

- `app/` — the app: `src/achilles-tracker.html` (the page), `src/native.js` (notifications, haptics, Share log), the Capacitor iOS project, and the watch app in `app/ios/App/AchilloWatch`.
- **Releases:** every push to `main` is built by Xcode Cloud (`app/ios/App/ci_scripts/ci_post_clone.sh`) and sent to TestFlight. Versions are `1.2.<Xcode Cloud build number>`.
- `.github/workflows/build.yml` — a compile check only (phone + watch, unsigned). It publishes nothing.

Release note for the next build goes in `app/notes.txt`; it becomes TestFlight's "What to Test".
