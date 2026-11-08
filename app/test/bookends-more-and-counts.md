# More readings and personal play counts

This update adds 12 archive readings to Morning and Evening, bringing the library to 88 entries and 81 in-card recordings. Each addition is at least eight minutes and strictly below 40 minutes after trimming. Existing recording IDs, source URLs and playback bounds are preserved, along with the six full-book links and the external Audre Lorde reading. The 21 guided practices stay in Meditations.

## Small play counts

A 10px caption beneath a library row's play icon shows `1 play`, `2 plays`, etc. Zero counts are hidden. Counts are personal to this device, stored alongside hearts and hidden preferences in `ach:beLib`; there is no historical backfill or count for external book/video players.

A play is recorded once an attempt accumulates ten seconds of actual listening. Pausing/resuming retains the attempt, seeking contributes no listening time, and a failed load contributes no play. Finishing or choosing another recording starts a fresh attempt. Media advancement is checked against elapsed time and playback rate so buffered time and seek jumps cannot inflate the count. The caption updates in place without replacing a row, changing the library scroll position or closing swipe actions.

## Audio review

All 12 source files were fully decoded and reviewed using timestamped speech transcription. This is machine-assisted review, not a claim that every minute was manually listened to. Source catalog metadata identifies the reader and event; displayed times use the selected audio rather than the catalog's nominal duration. Introductory announcements, long opening remarks, Q&A and promotional endings are excluded where present. Brief context between poems remains, and selections end after complete readings rather than at an arbitrary duration limit. Streams remain on their archive hosts; no audio files are bundled or rehosted.

Elizabeth Alexander's selection runs from the opening quotation in *The Black Interior* through the complete closing “Neonatology” sequence; the host's book-signing announcement and audience Q&A are excluded. George Oppen's selection is the *Of Being Numerous* reading, excluding its subsequent discussion. Lawrence Ferlinghetti's source includes another reader at the start and extensive room conversation at the end; this selection retains only his *Love in the Days of Rage* prose excerpts. C. D. Wright's *One Big Self* excludes the archive's promotional outro.

Juliana Spahr reads the coauthored *An Army of Lovers* ([publisher credits](https://citylights.com/city-lights-published/army-of-lovers/)); Bernadette Mayer's Penn reading ends with “Thrift Shop Blues,” a collaboration with Philip Good. These collaborators are included in the library credits. Mentions of shopping/donations inside that poem are literary content, not inserted advertisements.

| ID | Reading | Author | Listening time | Source positions (seconds) |
| --- | --- | --- | ---: | --- |
| 0-31 | [Selected Poems — live at CUE](https://writing.upenn.edu/pennsound/x/Creeley.php) | Robert Creeley | 23.6 min | 34.8–1452 |
| 0-32 | [The Black Interior and Selected Poems](https://writing.upenn.edu/pennsound/x/Alexander-Elizabeth.php) | Elizabeth Alexander | 37.3 min | 602.2–2837.6 |
| 0-33 | [An Army of Lovers — excerpt](https://writing.upenn.edu/pennsound/x/Spahr.php) | Juliana Spahr & David Buuck, read by Spahr | 21.8 min | 0–1308.8 |
| 0-34 | [Selected Poems — live at Segue](https://writing.upenn.edu/pennsound/x/Mullen-Harryette.php) | Harryette Mullen | 31 min | 142–2001.5 |
| 0-35 | [Hello, the Roses and Other Poems](https://writing.upenn.edu/pennsound/x/Berssenbrugge.php) | Mei-mei Berssenbrugge | 21.6 min | 71.2–1365.4 |
| 0-36 | [Summer Solstice](https://writing.upenn.edu/pennsound/x/Mayer.php) | Bernadette Mayer | 11.3 min | 35.3–713.5 |
| 1-29 | [The Book of a Thousand Eyes — selections](https://writing.upenn.edu/pennsound/x/Hejinian.php) | Lyn Hejinian | 16.3 min | 13.5–991.8 |
| 1-30 | [Deepstep Come Shining — excerpt](https://writing.upenn.edu/pennsound/x/Wright.php) | C. D. Wright | 24.6 min | 112.3–1588 |
| 1-31 | [Of Being Numerous — live reading](https://writing.upenn.edu/pennsound/x/Oppen.php) | George Oppen | 24.4 min | 63.8–1526.3 |
| 1-32 | [Love in the Days of Rage — excerpts](https://writing.upenn.edu/pennsound/x/Ferlinghetti.php) | Lawrence Ferlinghetti | 13.2 min | 531.9–1323 |
| 1-33 | [One Big Self — selected readings](https://writing.upenn.edu/pennsound/x/Wright.php) | C. D. Wright | 15.1 min | 14.4–923 |
| 1-34 | [Selected Poems — live at Penn](https://writing.upenn.edu/pennsound/x/Mayer.php) | Bernadette Mayer with Philip Good | 33.8 min | 33.3–2063.8 |

## Validation

- Data checks cover every stream's reviewed boundaries and the under-40-minute cap; the new readings must retain at least eight minutes.
- Real browser audio checks cover every new source, start, pause, relative seek and end/reset.
- Real-time fixture playback checks short taps, seeking, listening across a pause, in-place count updates, replay, persistence and failed playback. The existing gesture tests cover row swipes, sheet dismissal and touch/mouse/keyboard scrubbing.
- Web build and bundle checks pass. Browser playback uses Chromium; physical iOS background playback is not tested in this environment.

The previous [longer-reading audit](bookends-longer-readings.md) and [boundary audit](bookends-boundaries.md) document the earlier additions and playback exclusions.
