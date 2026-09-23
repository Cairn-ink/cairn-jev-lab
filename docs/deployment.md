# Public deployment

- Public URL: https://lab.cairn.ink/
- Cloudflare Pages project: `cairn-jev-lab`
- Preview hostname: https://cairn-jev-lab.pages.dev/
- Method: Direct Upload of the contents of `web/`.
- DNS: `lab` CNAME to `cairn-jev-lab.pages.dev`, managed through Pages custom domains.

The deployment contains static HTML, CSS, JavaScript, recorded JSON results, self-hosted fonts, their licenses and `_headers`. It contains no server, function, API key, environment file or user inputs. Public visitors can replay four recorded cases. New evaluations require running the repository locally with their own TypeSafe key. This release makes no new Jev calls.

## Updating the site

GitHub pushes do **not** automatically deploy this Direct Upload project. After checking changes, package the contents of `web/` with `index.html` at the archive root. In Cloudflare Pages, choose `cairn-jev-lab` → Create deployment → Production, upload the archive and deploy. Alternatively, after `npx wrangler@4 login`, run `npx wrangler@4 pages deploy web --project-name cairn-jev-lab --branch main` from the repository root; `main` is the production branch. Never upload the repository root or `.env` files. Verify the headline metrics, recorded examples and disabled live evaluation on the public hostname.

Cloudflare Web Analytics is enabled for the hostname and injects its beacon at the edge. `web/_headers` therefore allows scripts from `https://static.cloudflareinsights.com` and beacon reports to `https://cloudflareinsights.com`; remove both if analytics is turned off.

The main `cairn.ink` site continues to use its existing Railway destination. This deployment only adds the `lab` subdomain.

## Release checks

- 20 automated checks passed locally.
- Public Pages preview loaded all study metrics and recorded examples.
- Custom HTTPS hostname opened successfully in the browser.
- Replay included a recovered save, an unsupported proposal and an attribution failure.
- The [next-phase plan](../README.md#what-comes-next) covers boundary validation, community cases and a prospective Cairn Memory adapter. Original evidence and scores are unchanged.

## Walkthrough

`docs/media/recorded-demo.gif` is a 14-second loop of three real browser captures from the public replay interface. It includes an attribution failure as well as successful judgments. Frames are held for readability, so the animation does not represent inference latency.
