# DuneSub professional identity implementation

## Serving architecture

The intended public request path is Cloudflare proxy -> GKE Service -> plammih Node.js container. This change implements the public identity page at the GKE application layer. It does not change Cloudflare DNS, proxy rules, TLS, cache rules, or GKE resources.

The Cloudflare Worker entry point is retained as a separate application target and is not treated as the canonical website origin in this implementation.

## Public routes

- `/`: accessible professional profile and Schema.org JSON-LD graph.
- `/robots.txt`: crawler policy and sitemap location.
- `/sitemap.xml`: canonical homepage URL.
- `/healthz`: existing plain-text health probe.

The JSON-LD describes the Person and Organization entities and their relationship. It is descriptive structured data, not independent verification of credentials, corporate registration, or search-engine recognition.

## Identity and contact data

The page uses the name, roles, technical areas, public profiles, and contact addresses supplied for this implementation. Confirm that each email address is intended for public display before merging.

The GitHub Pages URL is included as a supplied profile destination; its deployment and ownership relationship have not been independently verified.

## Security and caching

The Node.js server serves only an explicit route allowlist, supports GET and HEAD, returns 404 for unknown paths and 405 for unsupported methods, and retains defensive response headers. The homepage is cacheable for five minutes; robots and sitemap for one hour; health checks are not cached.

## Release boundary

This branch is for review only. Do not merge or deploy as part of this change. A production release requires explicit review of the pull request, successful CI, verification of the live Cloudflare-to-GKE routing, and a separately approved deployment operation.
