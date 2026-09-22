# Launch drafts

Drafts only; not posted. Attach `docs/media/lab-intro.mp4` for the 22-second animated explanation, or `docs/media/lab-intro.gif` for an inline preview. `docs/media/repo-cover.png` is the static share card; `docs/media/lab-icon.png` is the project icon.

## X

What should an AI remember?

We built Cairn Jev Lab to explore that question: 100 synthetic memory cases, open evidence, and Save / Skip / Defer policies.

Replay examples with no key. Run new cases locally with your own.

Experimental, with failures included.

https://lab.cairn.ink

## Facebook / longer post

A proposal should not become a decision just because an AI remembers it that way.

Cairn Jev Lab explores the step before memory storage: is a proposed memory supported by its source, useful beyond the conversation, and faithful to the original uncertainty?

We evaluated 100 synthetic English cases with Jev and compared two confidence thresholds using the same responses. The preview matched 78 of our 100 expected labels, compared with 59 for the baseline. Mean client-observed API response time was 264 ms, including network time, in this run.

These are experimental results against AI-authored labels, without independent human annotation. The preview still missed 12 of 50 intended saves, and our follow-up audit found ambiguity in the skip/defer labels. The evidence includes the mistakes; the numbers are not a reliability or speed guarantee.

Explore the dashboard and replay four recorded examples without an account or key. To evaluate your own cases, clone the repo and use your own TypeSafe key locally. The demo does not store memories or connect to production Cairn Memory writes.

Next, we plan to sharpen the skip/defer boundary with 20 prepared contrast cases, expand community-authored tests, and explore an opt-in Cairn Memory adapter starting with dry-run recommendations.

Have an example that challenges the policy? Share a synthetic case and your expected decision on GitHub.

Demo: https://lab.cairn.ink
Code and evidence: https://github.com/Cairn-ink/cairn-jev-lab
Memory project: https://github.com/Cairn-ink/cairn-memory
