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
