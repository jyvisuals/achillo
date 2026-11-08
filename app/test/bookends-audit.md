# Bookends recording audit — 2026-11-08

The library contains 58 pieces. With this change, 52 have an in-card stream; the six protected audiobook entries retain their existing full-book links.

## Verification

- Re-fetched and decoded the first 30 seconds **after the configured start** for all 51 existing streams. Reviewed timestamped transcriptions against the intended poem or practice opening. This checks the actual playback position, not just whether a URL responds.
- Confirmed the short opening instruction on “Suffering and Compassion” with a separate five-second cue check. Its existing start includes “Close your eyes”; no timing change was needed.
- Checked the complete “Singularity” reading against the published poem. Julie Potiker reads it at the end of a guided meditation; starting at 733.2 seconds preserves the opening and the complete poem, followed by brief closing guidance/credits. The UI credits the reader.
- `node test/bookends.js --all-audio` passed for all 52 streams, including playback, pause, seeking to the end, and resetting to the configured start. The same run passed sorted and saved preferences, touch/mouse/keyboard swipe actions, reduced motion, and fixture seek/resume/replay checks, with no page errors or external tabs. One existing source timed out in an earlier run and passed on retry.
- `node build.js` and `node test/build-test.js` passed. No audio files, video players, or iframe embeds are added to the app.

This is a stream/position/content audit, not a claim that every minute of every long interview was manually listened to. Playback was tested in Chromium; an iOS device check remains useful. Podcast advertisements can change the timing of a source file, especially Happiness Break (2-2); the seek control remains available for adjustment.

## Singularity sources

- [Published poem — Academy of American Poets](https://poets.org/poem/singularity)
- [Episode — Balanced Mind with Julie Potiker](https://podcasts.apple.com/us/podcast/safe-orb-meditation-visiting-galaxy-with-poem/id1232945149?i=1000505751243)
- [Publisher RSS feed](https://feeds.blubrry.com/feeds/balancedmind.xml)
- [Direct stream](https://media.blubrry.com/balancedmind/content.blubrry.com/balancedmind/FinalOrb01122021.mp3): HTTPS redirects only; 200 `audio/mpeg`.

## Remaining audiobook entries

Official Apple Books previews were found for all six titles. Every preview URL returned 200 audio content. These are **samples**, not complete books, and the Beloved preview is not verified as the Clearing passage. They are documented here rather than substituted for the protected full-book entries.

| Library ID | Book / official preview page |
| --- | --- |
| 0-19 | [Inciting Joy](https://books.apple.com/us/audiobook/inciting-joy/id1631557900) |
| 1-9 | [At Blackwater Pond: Mary Oliver reads Mary Oliver (Unabridged)](https://books.apple.com/us/audiobook/at-blackwater-pond-mary-oliver-reads-mary-oliver-unabridged/id1418214619) |
| 1-10 | [The Book of Delights](https://books.apple.com/us/audiobook/the-book-of-delights/id1639627709) |
| 1-11 | [The Book of (More) Delights](https://books.apple.com/us/audiobook/the-book-of-more-delights/id1668846509) |
| 1-12 | [Beloved: Pulitzer Prize Winner (Unabridged)](https://books.apple.com/us/audiobook/beloved-pulitzer-prize-winner-unabridged/id1417808321) |
| 1-20 | [Catalog of Unabashed Gratitude](https://books.apple.com/us/audiobook/catalog-of-unabashed-gratitude/id1732287514) |

No verified full-book stream suitable for in-card playback was found in this search. The title poem “Catalog of Unabashed Gratitude” is already playable separately at 1-14; it is not the entire collection at 1-20.
