# DuneSub professional identity implementation

## Confirmed intended request path

The operator-provided architecture is:

`Browser -> Cloudflare reverse proxy -> GKE external LoadBalancer Service -> plammih Pods (TCP 3000)`

The Kubernetes Service in `k8s/deployment.yml` is `type: LoadBalancer`, exposes TCP port 80, and forwards to the named Pod port `http` (container port 3000). This is compatible with Cloudflare proxying to the external IP assigned to that GKE Service. A Kubernetes Ingress or NGINX ingress controller is not required by the manifests currently in this repository and must not be inferred.

The repository proves the intended Kubernetes Service shape, not the live Cloudflare DNS target, SSL mode, origin certificate, firewall policy, or current GKE Service external IP. Those values must be inspected in the actual Cloudflare and GKE control planes before a release. Do not change DNS, TLS, firewall, or load-balancer settings as part of this code change.

The Cloudflare Worker configured by `wrangler.toml` is a separate deployment target. Its existence does not prove it is in the request path for `dunesub.de`; the serving architecture supplied for this task places Cloudflare proxy in front of GKE.

## Public routes

- `/`: professional profile and Schema.org JSON-LD graph.
- `/robots.txt`: crawler policy and sitemap location.
- `/sitemap.xml`: canonical homepage URL.
- `/healthz`: plain-text Kubernetes health probe; GET and HEAD are supported.

The JSON-LD describes Person and Organization entities. It is descriptive metadata, not independent verification of credentials, legal registration, or search-engine recognition.

## Identity and contact data

The page uses the name, roles, technical areas, public profiles, and contact addresses supplied for this implementation. Confirm that each email address is intended for public display before merging.

The GitHub Pages URL is included as a supplied profile destination; its deployment and ownership relationship have not been independently verified.

## Application behavior and security

The Node.js server serves an explicit route allowlist, supports GET and HEAD only, returns 404 for unknown paths and 405 for unsupported methods (including on `/healthz`), and retains defensive response headers. The homepage is cacheable for five minutes; robots and sitemap for one hour; health checks are not cached. Cloudflare cache behavior is a separate edge setting and is not configured by this repository.

## Build, deploy, and release gates

- `cloudbuild.yml` builds and publishes a uniquely tagged image only; it does not mutate GKE.
- `cloudbuild-deploy.yml` is a separate, explicitly invoked deployment pipeline. It checks the configured Google Cloud project and cluster name before applying manifests.
- CI tests and builds the container on pull requests. CI never deploys.
- A production deployment requires a verified target project, cluster, current workload, Cloudflare origin target, and explicit release approval. The project/cluster defaults are configuration hints, not proof of the active production cluster.

## Operational verification checklist

Before production rollout, an operator with read access should confirm:

1. The active GCP project and cluster identity, location, namespace, and current Deployment image digest.
2. The `plammih` Service external IP and its port 80 -> Pod port 3000 mapping.
3. Cloudflare's proxied DNS record for `dunesub.de` resolves to that exact origin IP (or the documented origin load balancer).
4. Cloudflare SSL/TLS mode and origin certificate validate HTTPS from edge to origin; do not weaken certificate validation to make a rollout work.
5. The existing workload is healthy and rollback image digest is recorded.

This branch does not change Cloudflare or GKE resources and does not deploy itself.
