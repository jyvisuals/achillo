# Bookends playback boundaries

All 54 in-card sources were fetched and fully decoded for this audit. Timestamped speech transcripts were inspected at the configured openings and endings and searched for promotions inside the retained content. Ambiguous boundaries received a second transcription pass. This is machine-assisted content review, not a claim that every minute was manually listened to.

The player uses source-file timestamps without downloading or editing media into the app. It clamps the progress bar to the retained content, protects the opening on replay and native seeks, and pauses/resets at the ending. Media-time checks and a boundary timer handle playback-rate changes and buffering. Interior exclusions use the same timeline, so seeking and displayed progress omit those sections too.

## Source and editorial decisions

- Replaced the dynamically advertised Happiness Break recording with Kristin Neff's official **Compassionate Friend** practice. The old source inserted a 76-second commercial and shifted the content relative to the previously verified cue. The replacement is the full 18-minute practice, hosted by the author: https://self-compassion.org/practices/compassionate-friend-2/.
- Removed host introductions, promotional outros, membership/newsletter requests, credits and prolonged closing music where present. Tara Brach's **Saying Yes** now starts at the practice after its opening story.
- **Before You Know Kindness** skips source seconds 1375–1417, covering the mid-program break and repeated show introduction, then resumes with the question about the poem. The preceding poem ends at 1372.7 and the next question begins at 1418.1.
- Kept complete poems, essays, substantive author discussions and the Mary Oliver event's audience questions. Poetry Unbound episodes retain their poem discussion and repeat reading; their production credits are excluded. The two Clifton entries intentionally share that episode with different opening cues.
- Kept intentional quiet practice intervals and clean natural endings. Short breathing space after the last words is preserved where the next material permits it. **Singularity** includes the final “Everything. Home.” and brief author attribution, ending before the unrelated instructions and promotion.
- The six protected audiobook links and the full Audre Lorde external link are unchanged. Playback and advertisements in external apps are outside this player's control. No unverified timestamp was added to the YouTube link.

Remote publishers can replace audio or change ad insertion. These bounds describe the files reviewed during this change; they cannot guarantee that a future version of an external stream has identical timing. The Omega streams currently add promotions after the selected ending. The dynamically shifting pre-roll source was replaced rather than relying on another offset.

## Validation

The deterministic browser fixture covers a trimmed opening, an interior exclusion, a trimmed ending, replay, direct media seeks, playback-rate changes, touch scrubbing, pointer cancellation, mouse and keyboard input. Source assertions require every stream to have valid, ordered content bounds. Live checks exercise playback, pause, seeking and reset for every stream. Tests run in Chromium; physical iOS background playback was not exercised in this cloud environment.

## Reviewed source positions

Positions below are in the remote file, not the elapsed time shown by the player. An ending is clamped to the browser's reported duration if the file finishes slightly earlier.

| ID | Recording | Start (s) | End (s) |
| --- | --- | ---: | ---: |
| 0-0 | Wild Geese | 9.2 | 69.5 |
| 0-1 | I Happened to Be Standing | 12.7 | 93.3 |
| 0-2 | Otherwise | 4.6 | 62.5 |
| 0-3 | homage to my hips | 65 | 104.5 |
| 0-4 | won’t you celebrate with me | 75.8 | 640 |
| 0-5 | Oatmeal | 95 | 352 |
| 0-6 | Eagle Poem | 0 | 77 |
| 0-7 | Dead Stars | 14.9 | 135 |
| 0-8 | The Guest House | 35 | 96 |
| 0-9 | The Fourth Sign of the Zodiac | 24 | 179 |
| 0-10 | Everything Is Waiting for You | 14 | 98.5 |
| 0-11 | Kindness | 12.4 | 114.5 |
| 0-12 | Singularity | 733.2 | 829 |
| 0-13 | Failing and Flying | 47.5 | 130.8 |
| 0-14 | Someday | 237 | 339 |
| 0-15 | Ode to Buttoning and Unbuttoning My Shirt | 47 | 462 |
| 0-16 | Mindful Body Scan | 69.5 | 605.7 |
| 0-17 | Saying Yes to Our Life | 244.5 | 690 |
| 0-18 | Relaxed and Awake | 40.5 | 1018.7 |
| 0-20 | A Litany of Survival | 68.5 | 188.5 |
| 0-22 | An Evening of Poetry | 128 | 4148 |
| 1-0 | Thank You | 46.8 | 92.5 |
| 1-1 | Twilight: After Haying | 72.7 | 132.5 |
| 1-2 | New Bones | 44.5 | 77 |
| 1-3 | Saint Francis and the Sow | 31.6 | 117 |
| 1-4 | Praise the Rain | 39.5 | 357 |
| 1-5 | The Peace of Wild Things | 57.4 | 105 |
| 1-6 | To the Mulberry Tree | 51.8 | 260.1 |
| 1-7 | To the Fig Tree on 9th and Christian | 9.5 | 202.8 |
| 1-8 | Small Kindnesses | 210 | 290 |
| 1-13 | song at midnight | 44.8 | 640 |
| 1-14 | Catalog of Unabashed Gratitude | 100.4 | 896.5 |
| 1-15 | Breath by Breath | 41 | 1116.3 |
| 1-16 | Coming Home with the Breath | 41.8 | 1066.9 |
| 1-17 | The Garden We Share | 88.5 | 1629 |
| 1-18 | Tending Joy and Practicing Delight | 162.5 | 3393 |
| 1-19 | Before You Know Kindness | 149.1 | 2940 |
| 1-21 | The Book of Delights — live reading | 753 | 2840 |
| 2-0 | Self-Compassion Break | 0 | 313.3 |
| 2-1 | Loving-Kindness and Compassion | 33.5 | 200.1 |
| 2-2 | Compassionate Friend | 2.8 | 1070 |
| 2-3 | 8-Minute Lovingkindness | 60.3 | 555 |
| 2-4 | Suffering and Compassion | 41.4 | 487.2 |
| 2-5 | Loving Kindness | 0 | 571.1 |
| 2-6 | Loving Kindness for Health | 10 | 677.9 |
| 2-7 | Blessings of Love | 43.5 | 686.3 |
| 2-8 | Lovingkindness | 117.2 | 665 |
| 2-9 | Loving-Kindness (Even When It’s Hard) | 91.4 | 692 |
| 2-10 | Metta | 0 | 708.3 |
| 2-11 | Loving Kindness for a Loved One | 11 | 757.3 |
| 2-12 | Embodied Metta | 51.5 | 1176.4 |
| 2-13 | Loving-Kindness Meditation | 0 | 1203.9 |
| 2-14 | Compassionate Body Scan | 0 | 1361.5 |
| 2-15 | Loving Kindness Guided Meditation | 393.8 | 1977.9 |
