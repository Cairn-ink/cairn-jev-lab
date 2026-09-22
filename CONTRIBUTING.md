# Contributing

The most useful contribution is a small, synthetic example of a memory judgment that is easy for a person to understand and difficult for the current policy.

## Share a case

Open an issue with a source passage, a proposed memory, your expected `save` / `skip` / `defer` decision, and a short explanation. Use English for the discussion; multilingual source text is welcome when language is part of the test. Never include private conversations, credentials or personal data.

## Change code or documentation

1. Fork the repo and create a branch.
2. Keep changes focused. Explain the resulting behavior and why it matters.
3. Run `node --test`, `node src/cli.mjs`, and `node src/cli.mjs --input examples/my-cases.json`.
4. Submit a pull request with relevant validation and any limitations.

No API key or dependency installation is needed for offline checks. Real API evaluations are optional and may incur charges. Never commit `.env`, personal case files or unreviewed reports.

## Preserve evidence

Do not overwrite published run data or change expected labels to improve a score. Version changes to questions and admission rules. If you add a live result, include its exact cases, questions, model version, configuration, failures, latency and usage. Explain whether the cases were used for development. Do not claim a quality improvement from software tests alone.

`evidence/pilot-2026-09-22/report.json` and `fixtures/cases.json` are the original pilot artifacts. English documentation can describe them; translating their recorded inputs would change the evidence.

## Documentation languages

English is the primary language for the root README, documentation, code comments, reports and contribution guides. Traditional Chinese translations live in `docs/zh-TW/`, with links back to the English pages. Keep translations aligned with changes to commands, policy and limitations. We currently maintain Markdown translations manually; there is no automatic translation service.

Original source passages and historical evaluation data may retain their original language. New default examples should be readable in English.
