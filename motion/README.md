# Lab motion assets

A 22-second, 1280 × 720 Remotion explainer, plus a 1280 × 640 repository cover and 512 × 512 Lab icon. Install dependencies in this directory with `npm ci`, then use `npm run video`, `npm run cover` and `npm run icon`. All Remotion packages are pinned to the same version. Review [Remotion's license](https://www.remotion.dev/license) for your usage.

The animation is a designed explanation, not a screen recording or live inference. Source/candidate text is imported from the published `web/examples.json` (h13 and h01); their recorded decisions and confidence values are presented on an editorial layout. Timings are presentation choices, not API latency. The last scene's 100 cases and 264 ms refer to the separate coverage study, not the two walkthrough examples.

The three-stone geometry comes from Cairn's existing mark. Stones use separate neutral grays: bottom `#2B2B2B`, middle `#555555`, top `#7B7B7B`; they do not inherit the interface's moss accent. “Jev” is a text credit for the underlying model, not a recreated TypeSafe logo or a claim of official partnership. The Lab icon is a Cairn project identifier. These assets do not replace the Cairn GitHub organization's avatar.

Outputs live in `docs/media/`. The MP4 is the primary social video; `lab-intro.gif` is the lightweight README preview. `repo-cover.png` is also suitable for a repository social preview. The original recorded screenshot GIF is retained separately as `recorded-demo.gif`.
