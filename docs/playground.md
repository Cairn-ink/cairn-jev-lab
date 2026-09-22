# Local playground

[Home](../README.md) · [Policy](policy.md) · [Published comparison](../evidence/holdout-en-v1/README.md)

Run from a clone with Node.js 22 or later. No dependencies to install.

```sh
# Browse four recorded examples, with no key and no API calls
node src/server.mjs

# Or enable live evaluation using your local .env file
node --env-file=.env src/server.mjs
```

Open **http://127.0.0.1:4175/**. The `.env` file contains `TYPESAFE_API_KEY`; start from `.env.example`. An existing environment variable or an external env-file path works too. Restart the server after changing its environment.

1. Choose a recorded case to inspect a real published response. The badge says **Recorded · no API call**.
2. Edit the source and proposed memory. Editing clears the old result so it cannot be mistaken for a new evaluation.
3. Select **Evaluate with Jev** to make one live request. The badge switches to **Live response**. Both policies use that one response.
4. Inspect the three judgments and download the result JSON if useful.

Recorded cases include a recovered useful memory, an overstated proposal, missing context, and a remaining actor-attribution failure. They were chosen to explain behavior, not to estimate overall performance.

## Data and limits

The API key stays on the local server and is never sent to the browser. Live evaluation sends the source and proposed memory to TypeSafe and may incur charges. Expected labels are not sent. The app does not persist typed inputs or live results; a downloaded result contains your input, so review it before sharing.

The server accepts one live request at a time, at most 20 attempts per process, with no automatic retries. Restarting resets this request limit; it is not a billing cap. It listens only on `127.0.0.1`, validates the request origin and session token, and is intended for local use. It is not a hosted, multi-user service.

The default playground model is `jev-1.13.0`; set `JEV_MODEL` to override it. `PORT` changes the default port, 4175. A new request may differ from a recorded response.

Neither result stores a memory. The baseline remains the library/CLI default, and the lower-threshold preview is experimental.

## Landing page and recorded-only distribution

The page starts with a compact study dashboard, then explains the three judgments and links to **Try it yourself**, the evidence and GitHub. Metrics come from `web/study.json`, generated from the [100-case coverage report](../evidence/coverage-en-v1/README.md). They describe 100 distinct synthetic cases evaluated once each; ad-hoc playground calls never change them. Latency includes network time. Labels were AI-authored and have not received independent human review. The previous 20-case, three-pass study remains separately published; its scores are not pooled with the new study.

Rebuild published display data with `node scripts/build-study.mjs` (no API use). To repeat the 100-case suite with your own key, run `node --env-file=.env scripts/coverage.mjs --live` (up to 100 calls). A separate `node --env-file=.env scripts/repeat.mjs --live` makes up to 40 additional calls for the earlier repeatability protocol. Both write new ignored reports; neither overwrites published evidence. The four playground examples remain explicitly labeled original recorded cases, not samples from the new headline study.

The contents of `web/` can also be served by a static host, including under a path prefix. That version loads `study.json` and `examples.json`, replays the recorded cases and links to local setup. It never enables live evaluation on a public hostname. No API key, provider proxy or account is bundled. Public hosting is a separate deployment step; the default local address is not a shareable public URL. A static host may require its own security headers; the Node server's headers are not automatically carried over.

## Visual reference

The design follows the supplied [Cairn brand ruler](https://github.com/wsxqaza12/cairn-wiki/blob/docs/cairn-style-ruler-20260913/docs/brand/README.md): paper `#FAF7F2`, warm surface `#F4F0E8`, ink `#1F1D1A`, muted ink `#6B6560`, moss `#5A7A4E`, EB Garamond titles and Inter controls/body. The stacked-stone mark preserves the existing `CairnStones` geometry. The lab uses an editorial notebook and compact evidence charts instead of the main site's island illustrations. On narrow screens the illustrative notebook is omitted to keep measured results near the introduction.

Fonts are self-hosted from Google Fonts, with their SIL Open Font Licenses in `web/fonts/`. The logo is Cairn's brand identity; the font licenses govern the bundled font files. Public UI stays English; the Chinese overview remains in `docs/zh-TW/`.
