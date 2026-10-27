# Media: generated imagery and motion

Every generated file is labelled. Stills carry the IPTC `trainedAlgorithmicMedia` digital-source type in embedded XMP,
plus a `.json` sidecar with the model, prompt, seed and request id. Videos carry the label in their metadata. On the
site they are marked `data-ai="generated"`, and their alt text describes only what they show. None of them depicts a
Star Buds store, staff member, customer, product or brand. Real photos come from Star Buds' own sites (see
[LOCATIONS.md](LOCATIONS.md) and the `source` fields in `src/content/site.json`).

## Stills: fal.ai

| File | Use | Model |
|---|---|---|
| `cut-bud.png`, `cut-preroll.png`, `cut-jar.png`, `cut-gummies.png`, `cut-vape.png`, `cut-tincture.png`, `cut-leaf.png`, `cut-concentrate.png` | product cut-outs, the front plane that breaks out of glass cards and section seams | flux-pro v1.1 ultra on a plain studio backdrop, then the birefnet v2 background remover (transparent PNG) |
| `pop-star.png`, `pop-bud.png` | pop-art stickers (comic-book linework, Ben-Day dots) | flux-pro v1.1 ultra, then birefnet v2 |
| `g-hero.jpg` | home hero backdrop and the source of the hero loop | flux-pro v1.1 ultra |
| `g-glass.jpg`, `g-glass-dark.jpg` | backdrops behind glass panels (light and dark); the dark one is the source of the glass loop | flux-pro v1.1 ultra |

The prompts are in each file's sidecar and in `src/content/image-plan.json`. Every prompt asked for no text, labels,
logos or brand marks. All 13 were looked at by eye at reduced size, and the vape was also checked at full size for
invented lettering: none was found.

## Motion: Higgsfield

| File | Source still | Model | Loop |
|---|---|---|---|
| `assets/media/hero-pop.webm` / `.mp4`, `hero-pop-poster.webp`, `hero-pop-phone.mp4` (9:16 crop) | `g-hero.jpg` | Kling v3.0 turbo image-to-video, 10 s, 1080p: a slow push-in while the leaves and glass discs drift | ping-pong (forward then reversed), 20 s |
| `assets/media/glass-dark.webm` / `.mp4`, `glass-dark-poster.webp` | `g-glass-dark.jpg` | Kling v3.0 turbo image-to-video, 5 s, 1080p: a slow orbit around the glass spheres | ping-pong, 10 s |

Calmness, measured with ffmpeg `signalstats` YDIF (mean absolute luma change between frames, 0-255):

| Loop | Mean | Max | Frames over 20 | Seam (last frame to first) |
|---|---|---|---|---|
| Hero | 1.55 | 2.63 | 0 | 1.83 |
| Glass | 1.60 | 1.96 | 0 | 1.96 |

There is no flashing, and each seam is no larger than an ordinary frame-to-frame step. With
`prefers-reduced-motion: reduce`, the poster frames show instead of the video.

## Revision 1 (2026-10-27): "Iron Star" media

The first design's bright pop-art read as childish. Revision 1 moves to an Old English biker pop-art look, and these
are its new files:

| File | Use | Model |
|---|---|---|
| `patch-wings.png`, `patch-leaf.png`, `patch-star.png` | embroidered biker-style patches with no lettering (a winged star, a shield with a leaf, a round star with a leaf) | flux-pro v1.1 ultra, then birefnet v2 |
| `chrome-star.png` | a chrome star badge | flux-pro v1.1 ultra, then birefnet v2 |
| `flash-leaf.png`, `flash-bud.png` | tattoo-flash illustrations (the ribbon is left blank on purpose) | flux-pro v1.1 ultra, then birefnet v2 |
| `g-leather.jpg`, `g-smoke.jpg` | backdrops behind the smoked glass | flux-pro v1.1 ultra |
| `g-hero-jacket.jpg` | the hero still: a leather jacket with an embroidered star-and-leaf back patch | flux-pro v1.1 ultra |
| `assets/media/hero-iron.webm` / `.mp4`, `hero-iron-poster.webp`, `hero-iron-phone.mp4` | the hero loop: a slow push-in on the jacket while smoke drifts through the light (ping-pong, 20 s) | Higgsfield Kling v3.0 turbo image-to-video, 10 s, 1080p |
| `assets/media/smoke-ember.webm` / `.mp4`, `smoke-ember-poster.webp` | the dark-band loop: smoke and golden embers (ping-pong, 10 s) | Higgsfield Kling v3.0 turbo image-to-video, 5 s, 1080p |

Calmness (YDIF): the hero loop has a mean of 1.91 and a max of 3.20, the smoke loop a mean of 0.60 and a max of 1.05.
Neither has a frame over 20, and the seams measure 1.41 and 1.05. Every image was looked at before use. The jacket's
patch stays intact through the whole clip.

The imagery deliberately has no motorcycles: many states' cannabis advertising rules bar imagery tied to driving or
riding. The biker character comes from the patches, the lettering, the leather and the chrome.

The revision retires the first design's pop-art files: `pop-star.png`, `pop-bud.png`, `g-hero.jpg`, `g-glass.jpg`,
`g-glass-dark.jpg`, `hero-pop.*` and `glass-dark.*`. They are no longer in the repository; the product cut-outs stay.

## Revision 3 (2026-10-27): "Starlight"

The site moved to a simple, clean ethereal glassmorphism look that plays on the name Star Buds. It uses no new
generated media: the night sky, star fields and aurora glows are drawn in CSS. The product cut-outs (`cut-*.png`)
stay, floating like stars, and so do all real photos. The Iron Star patches, chrome star, tattoo flash, leather and
jacket stills and the `hero-iron` loop are no longer used on any page.

## The leaves pattern

`assets/brand/pattern-buds.webp` is Star Buds' engraved botanical wallpaper (leaves, roses and cannabis leaves), taken
from www.starbuds.us. The redesign uses it as a duotone layer behind the glass. The shop's own pattern could not be
seen, because shop.starbuds.us refused this network (see [STRUCTURE.md](STRUCTURE.md)).
