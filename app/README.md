# Achilles — the rehab log as an iPhone app

Same page as the web version, wrapped as a native app so that:

- **audio keeps playing** with the screen locked or another app open (it's registered as an audio app),
- **reminders come from the app**: hourly quick ones between rounds, the evening round at 4 and 6:30, imagery at 8:25, hinge-day mornings, the Oct 30 visit. Tapping one opens the right session,
- **haptics** tick when an exercise finishes,
- data lives on the phone; **Share log** (under the day strip) sends the JSON to Claude, Messages, Mail, Files.

Free route, no $99 developer account. Two parts: build it once on a Mac, install and keep it alive with SideStore on the phone.

---

## Part 1 — build the app file (Mac, once, ~20 min mostly waiting)

1. Install **Xcode** from the Mac App Store (big download). Open it once and let it finish "installing components". Say yes if it asks to install iOS platform support.
2. Unzip this folder somewhere (Desktop is fine).
3. Open **Terminal**, drag the folder onto the window after typing `cd ` so it reads `cd /Users/you/Desktop/achilles-app`, press return.
4. Run:

       bash make-ipa.sh

   First run downloads Capacitor's Swift package (about a minute), then builds. It ends with `✓ …/Achilles.ipa`.

   If it complains about licenses: `sudo xcodebuild -license accept`, then run it again.

5. **AirDrop `Achilles.ipa` to your phone** (right-click → Share → AirDrop). Choose "Save to Files" on the phone.

That's the only time the Mac is needed. Updates from Claude arrive as a new zip → same `bash make-ipa.sh` → AirDrop → open in SideStore.

### Alternative without SideStore (quickest test, expires weekly)
Open `ios/App/App.xcodeproj` in Xcode, plug the phone in, pick it as the destination at the top, go to the **App** target → **Signing & Capabilities**, tick *Automatically manage signing*, choose your Apple ID as Team (Xcode → Settings → Accounts to add it), then press ▶. The app installs and runs for 7 days; press ▶ again to renew. Fine for trying it today, but Part 2 is what makes it permanent.

---

## Part 2 — install with SideStore (phone, once, ~15 min)

SideStore signs apps with your free Apple ID and renews them in the background, so the 7-day limit never bites.

1. On the phone, open **sidestore.io** in Safari and follow its install guide. In short: install the **SideStore** app (it walks you through a one-time pairing with a computer the first time), install its **StosVPN** helper, sign in with your Apple ID when it asks (that's what creates the free signing certificate).
2. In SideStore: **My Apps → + → pick `Achilles.ipa`** from Files. It signs and installs; the icon appears on the home screen.
3. First launch: allow **Notifications** when asked. That's the whole reminder system.
4. Leave SideStore installed. It refreshes Achilles in the background (keep "Background Refresh" on for SideStore in iOS Settings). If you ever see "app no longer available", open SideStore and tap Refresh All.

Free Apple IDs allow 3 sideloaded apps at a time; you'll be using 2 (SideStore itself and Achilles).

---

## Everyday

- Open Achilles → one-tap morning check → Barefoot PT. Same flow as the web version.
- Notifications adjust themselves whenever you log something: finish the morning round and the hourly quick ones start; log the evening round and its reminders go quiet.
- Reminders in Apple Reminders for the morning check / midday / evening imagery are now redundant; the hinge-day and aspirin ones can stay.
- Before the Oct 30 visit (or whenever you want a report): **Share log** → send to Claude.

## What's where

- `src/achilles-tracker.html` — the page, identical to the web artifact.
- `src/native.js` — the bridge: notifications, haptics, Share log. Talks to the page through window events only.
- `build.js` — wraps the page into `www/index.html` and bundles the bridge. `node build.js && npx cap sync ios` (needs Node) — only if you edit the page yourself; otherwise Claude does this and sends a fresh zip.
- `ios/App` — the Xcode project. `Info.plist` has `UIBackgroundModes: audio`; `AppDelegate.swift` sets the audio session to playback + mix-with-others so cues ride on top of music.
- `make-ipa.sh` — builds the unsigned IPA for SideStore.
