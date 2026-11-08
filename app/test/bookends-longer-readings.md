# Longer readings, all under 40 minutes

The library adds 15 longer readings and now has 76 entries, including 69 in-card streams. Each addition retains at least eight minutes after its introductory and closing material is excluded. Every in-card recording is now shorter than 40 minutes. Existing short poems remain available.

## The three overlong entries

- **Mary Oliver, An Evening of Poetry (0-22):** the first selection now runs from “Messenger” through “Praying,” about 30 minutes (source 128–1951 seconds). The new second selection begins with “Iraq” from *Red Bird* and ends after “White Heron Rises Over Blackwater,” about 17 minutes (1991.2–3011). The audience Q&A is outside these poetry selections. Both stop after complete poems.
- **Ross Gay, Tending Joy and Practicing Delight (1-18):** begins with his reading of “Loitering,” retaining the subsequent readings and conversation through the closing essay, about 30 minutes (1612.3–3393).
- **Naomi Shihab Nye, Before You Know Kindness (1-19):** begins with the poem “Kindness,” retaining the subsequent readings and conversation through “Cross That Line,” about 22 minutes (1568.8–2940). Source seconds 2812–2854.5 are skipped to exclude the host's biography and website promotion before the closing reading.

The existing recording IDs are retained so saved hearts and hidden preferences still apply. New entries are appended to Morning and Evening. The 21 guided practices remain in Meditations. The six protected full-book links and Audre Lorde's external YouTube link are unchanged; the playback limits apply to the app's in-card recordings, not external book players.

## Sources and verification

Fourteen new archive MP3s (about 5.1 hours of source audio) were fetched, fully decoded and reviewed with timestamped speech transcription. Opening and ending cues were checked against the actual words, with a second transcription pass where a boundary was ambiguous. This is machine-assisted review, not a claim that every minute was manually listened to. The Mary Oliver source was fully decoded and reviewed in the preceding audit; the two new selection boundaries were checked against that transcript.

The university catalog identifies each author and recording. Displayed durations use the retained audio, rather than nominal catalog lengths: for example, Akilah Oliver's 2009 complete file is about 27 minutes despite the catalog's 20:45 label. Longer host introductions, applause tails and announcements are excluded. Formal titles, dedications and brief author context may remain as part of a reading. Two candidates were rejected because trimming their introductions left less than eight minutes of poetry.

June Jordan's source ends during a later poem. Her selection ends after the complete “April 29, 1999” poem, before she introduces that incomplete final recording. Adrienne Rich's *An Evening* includes author-read prose and poetry; the two pre-existing On Being selections are explicitly labeled as readings and conversation.

Streams remain hosted by their publishers; no media is bundled or rehosted. Remote sources can change. The prior [boundary audit](bookends-boundaries.md) documents the rest of the existing recordings and the player’s trimming behavior.

## New selections

| ID | Reading | Author | Listening time | Source positions (seconds) |
| --- | --- | --- | ---: | --- |
| 0-23 | [Red Bird and Other Poems — live reading](https://podcasts.apple.com/us/podcast/mary-oliver-rebroadcast/id968204382?i=1000381969294) | Mary Oliver | 17 min | 1991.2–3011 |
| 1-22 | [An Evening with Adrienne Rich](https://writing.upenn.edu/pennsound/x/Rich.php) | Adrienne Rich | 38.4 min | 0–2304 |
| 0-24 | [Sources](https://writing.upenn.edu/pennsound/x/Rich.php) | Adrienne Rich | 22.8 min | 0–1369 |
| 1-23 | [Contradictions: Tracking Poems](https://writing.upenn.edu/pennsound/x/Rich.php) | Adrienne Rich | 10.2 min | 1.5–615.5 |
| 0-25 | [Selected Poems — live at Penn](https://writing.upenn.edu/pennsound/x/Jordan.php) | June Jordan | 31.8 min | 1121.2–3031.5 |
| 1-24 | [The Lyrics — selected poems](https://writing.upenn.edu/pennsound/x/Howe-Fanny.php) | Fanny Howe | 15.1 min | 120–1024 |
| 0-26 | [Agoniya](https://writing.upenn.edu/pennsound/x/Howe-Fanny.php) | Fanny Howe | 11.5 min | 40.8–732 |
| 1-25 | [Waterlily Fire](https://writing.upenn.edu/pennsound/x/Rukeyser.php) | Muriel Rukeyser | 16.4 min | 83.1–1065.3 |
| 0-27 | [Ajanta](https://writing.upenn.edu/pennsound/x/Rukeyser.php) | Muriel Rukeyser | 11.2 min | 238–912.5 |
| 1-26 | [The Outer Banks](https://writing.upenn.edu/pennsound/x/Rukeyser.php) | Muriel Rukeyser | 10.2 min | 199.2–811.8 |
| 0-28 | [Live at the Bowery Poetry Club](https://writing.upenn.edu/pennsound/x/Oliver.php) | Akilah Oliver | 22.2 min | 230.2–1560 |
| 1-27 | [The She Said Dialogues and Lover Too](https://writing.upenn.edu/pennsound/x/Oliver.php) | Akilah Oliver | 11.2 min | 28–701.5 |
| 0-29 | [Howl — Parts I, II and III](https://writing.upenn.edu/pennsound/x/Ginsberg.php) | Allen Ginsberg | 22.2 min | 0–1335 |
| 1-28 | [Melpomene](https://writing.upenn.edu/pennsound/x/Waldman.php) | Anne Waldman | 17.1 min | 0–1026 |
| 0-30 | [Manhattan Luck](https://writing.upenn.edu/pennsound/x/Notley.php) | Alice Notley | 24.7 min | 28.4–1509.5 |

## Validation

- The data checks require a valid reviewed end for every playable source, every listening duration below 40 minutes, and every addition at least eight minutes long.
- Browser checks exercise all additions and the three shortened entries: playback, pause, relative seeking, end/reset, and the remaining interior skip. The deterministic fixture covers replay, touch/mouse/keyboard seeking and exclusions. UI checks cover all library rows and saved preferences.
- Web build and build tests pass. Playback checks use Chromium; physical iOS background playback is not tested in this environment.
