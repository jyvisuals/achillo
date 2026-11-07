# Task: get more Bookends library pieces playing in-card (audio only)

## Goal
In `app/src/achilles-tracker.html`, the Bookends library (`const LIB=[[...],[...],[...]]`, tabs 0 Morning, 1 Evening, 2 Kindness) has 58 pieces. A piece plays inside the card when its id (`"<tab>-<index>"`) has a direct audio URL in `const AU={...}` (just above `function listenHTML`). 28 have one. Add as many of the remaining 30 as possible.

## Rules (from Jon)
- Audio only, streamed (no downloading, no video). Direct `.mp3` / `.m4a` (an `.m4v` with an audio track is OK; it already works on iPhone).
- HTTPS only (iOS ATS). Use `https://` even if the page shows `http://`.
- Off-app (the existing link) or video is the last resort. Don't add SoundCloud / YouTube / Acast iframe embeds.
- Quality bar: real readings by the poet or a respected reader. If a piece truly has no audio file anywhere, you may **replace the row** with a different, equally good piece by the same poet (or the same theme) that does have a direct file. Keep the tab, keep the row count about the same, and keep rows short: `[title, who, length, pageUrl]`.
- Audible rows stay as they are (1-9, 1-10, 1-11, 1-12, 0-19, 1-20).

## How to find files (what worked)
- Podcast episode pages (onbeing.org, tarabrach.com, libsyn, simplecast): look for `<audio src>` or a "Download" link.
- Megaphone `playlist.megaphone.fm/?e=ID` → `https://traffic.megaphone.fm/ID.mp3`.
- The show's RSS feed lists each episode's `<enclosure url>`.
- VOCA (voca.arizona.edu) reading pages have per-poem `.mp3`/`.m4v` tracks.
- Verify every URL: `curl -sIL <url>` returns 200 with `content-type: audio/*` (or `video/mp4` for .m4v).

## Remaining pieces (id | title | who | current link)
Already found, still needs verifying and adding:
- **1-13** song at midnight (Poetry Unbound). The onbeing.org/programs/lucille-clifton-song-at-midnight/ page has two simplecast mp3s, and it's unclear which is this episode: `https://cdn.simplecast.com/audio/49fe14cf-8aef-4a4f-83ca-a3ac86a522d8/episodes/d2ca6fd7-0ff8-4d73-aab0-a4eb1f8365bc/audio/5651edef-a0b1-4c46-bbe9-5e0ae695add5/default_tc.mp3` (probably this one) and `.../episodes/c2ab4909-b358-446a-ba3c-55d3f59f2a11/audio/e978599c-a32d-49bc-9cd7-731ba07e03b4/default_tc.mp3`. Check durations: the right one is about 12:57.

Leads:
- **1-17** The Garden We Share (Poetry Off the Shelf, Ross Gay): https://www.poetryfoundation.org/podcasts/151306/the-garden-we-share. Or use the show's RSS enclosure.
- **2-15** Jack Kornfield, Heart Wisdom Ep. 224 (33 min): RSS https://rss.art19.com/heart-wisdom-with-jack-kornfield (large; find the "Ep. 224" item's enclosure).
- **1-8** Small Kindnesses (The Slowdown #199): find the Slowdown RSS feed (APM) and the episode enclosure.
- **0-14** "Today's poem" (The Slowdown): can't be a fixed file. Replace it with one specific, strong Slowdown episode that has an enclosure.
- **1-0** Thank You (Ross Gay, Living on Earth, Aug 2013): try the loe.org show archive for the mp3.
- **0-8** The Guest House (Rumi, read by Amanda Holmes, American Scholar "Read Me a Poem", on Acast): RSS https://feeds.acast.com/public/shows/readmeapoem.
- **0-7** Ada Limón, Instructions on Not Giving Up: SoundCloud (poets-org), so it can't play in the card. Look for a poets.org mp3 or another source; otherwise swap for a Limón reading with a file (VOCA, On Being, Poetry Unbound).
- **0-0, 0-1, 0-9** Mary Oliver readings: Marginalian and Beacon pages (likely SoundCloud/embed). Look for direct mp3s (e.g. On Being's Mary Oliver episode, where she reads Wild Geese) or swap.
- **0-2** Otherwise (Jane Kenyon, Poetry Foundation audio page), **1-1** Let Evening Come (poets.org), **0-3** homage to my hips (poets.org audio-only): these sites load players with JS. Inspect the network or player JSON for the mp3.
- **0-4** won't you celebrate with me (SoundCloud): consider a Clifton reading on VOCA (https://voca.arizona.edu/reading/lucille-clifton-october-12-1983 has many tracks).
- **0-5** Blackberry Eating (Kinnell), **0-6** Eagle Poem (Harjo): Poetry Archive (JS player). Or VOCA Kinnell/Harjo readings.
- **0-10** David Whyte (YouTube), **0-12** Singularity (animated video), **1-2** blessing the boats (video), **1-4** Perhaps the World Ends Here (PBS video), **1-5** The Peace of Wild Things (animated video): find audio-only versions (On Being often has these poets reading) or swap.
- **0-13** A Brief for the Defense (Jack Gilbert): mars.gmu.edu handle page may have an mp3 bitstream.
- **0-20** Uses of the Erotic (Audre Lorde, 23 min): look for an archive.org or Pacifica (Pacifica Radio Archives) mp3.

## How to add
1. For each found file, add `"<id>": "<https url>",` inside `const AU={`.
2. If you replace a row, edit it in `LIB` (same index) and add its AU entry.
3. Fix the length label if the real duration differs.

## Test, then ship
```
cd app && node build.js && node test/build-test.js
```
Smoke tests (Playwright, chromium at `/opt/pw-browsers/...`, adjust for your env): the library opens, rows with AU show a ▶ icon, tapping one returns to the card with ⏸, and there are no page errors.

Release note: prepend one line to `app/notes.txt`, e.g. "Bookends: N more library pieces play in the card."

Branch, then a PR to `main`. Merging to `main` ships to TestFlight via Xcode Cloud. Jon has approved merging.
