# BranchLab Overview Video

This HyperFrames composition produces the README overview film for BranchLab.

## Intent

- Explain the problem BranchLab solves in roughly 90 seconds.
- Show the product as a local-first reliability lab, not a SaaS dashboard.
- Use the actual verified UI screenshots as evidence inside the video.
- Keep the visual language aligned with `DESIGN.md`.

## Render

```bash
npm run check
npx hyperframes render --output ../../assets/videos/branchlab-overview.mp4 --quality high --fps 30
```

After rendering, refresh the poster frame:

```bash
ffmpeg -y -ss 00:00:03 -i ../../assets/videos/branchlab-overview.mp4 -frames:v 1 -update 1 ../../assets/videos/branchlab-overview-poster.png
```

## Verification

`npm run check` validates lint, console health, WCAG contrast, and sampled layout geometry for the composition.
