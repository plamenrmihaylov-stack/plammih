# DuneSub professional identity implementation

## Confirmed intended request path

The operator-provided architecture is:

`Browser -> Cloudflare reverse proxy -> GKE external LoadBalancer Service -> plammih Pods (TCP 3000)`

The Kubernetes Service in `k8s/deployment.yml` is `type: LoadBalancer`, exposes TCP port 80, and forwards to the named Pod port `http` (container port 3000). This is compatible with Cloudflare proxying to the external IP assigned to that GKE Service. A Kubernetes Ingress or NGINX ingress controller is not required by the manifests currently in this repository and must not be inferred.

The repository proves the intended Kubernetes Service shape, not the live Cloudflare DNS target, SSL mode, origin certificate, firewall policy, or current GKE Service external IP. Those values must be inspected in the actual Cloudflare and GKE control planes before a release. Do not change DNS, TLS, firewall, or load-balancer settings as part of this code change.

The Cloudflare Worker configured by `wrangler.toml` is a separate deployment target. Its existence does not prove it is in the request path for `dunesub.de`; the serving architecture supplied for this task places Cloudflare proxy in front of GKE.

## GKE deployment topology

The two target roles are distinct and must not be conflated:

| Role | GCP project | GKE location | Cluster |
|---|---|---|---|
| Primary production | `dune-sub-core-prod` | `europe-west3` | `dune-sub-vpc-cluster` |
| Active organizational replica | `driven-crawler-502217f6` | `europe-west1` | `plammih-gke` |

The build pipeline publishes the reviewed image to the organizational project's Artifact Registry:
`europe-west1-docker.pkg.dev/driven-crawler-502217f6/dunesub-artifact-repo/plammih:<commit-sha>`.

Use `cloudbuild-deploy-production.yml` for the primary production cluster. It runs from the image project, checks the production cluster in `dune-sub-core-prod/europe-west3`, and deploys the immutable reviewed image across projects. The production GKE node/workload identity needs Artifact Registry Reader access to the source repository; the Cloud Build identity needs the minimum cross-project GKE deployment permissions. Verify both before execution.

Use `cloudbuild-deploy.yml` for the active organizational replica only. It checks `driven-crawler-502217f6/europe-west1/plammih-gke`. Never use the replica pipeline as a substitute for primary production.

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
- The two manual deployment pipelines are role-specific and require an explicit reviewed image tag.
- CI tests and builds the container on pull requests. CI never deploys.
- Deploy primary production first, validate health and Cloudflare origin routing, then deploy the same image tag to the organizational replica.
- A release requires verified IAM access, current workload health, Cloudflare origin target, and a recorded rollback image digest.

## Operational verification checklist

Before either rollout, an operator with read access should confirm:

1. The active GCP project and exact cluster identity/location for the selected role.
2. The `plammih` Service external IP and its port 80 -> Pod port 3000 mapping.
3. Cloudflare's proxied DNS record for `dunesub.de` resolves to the production origin IP (or documented origin load balancer).
4. Cloudflare SSL/TLS mode and origin certificate validate HTTPS from edge to origin; do not weaken certificate validation to make a rollout work.
5. The existing production workload is healthy and rollback image digest is recorded.
6. The production GKE node/workload identity can pull the cross-project image and the Cloud Build identity can deploy to the production cluster.

The repository changes do not modify Cloudflare DNS/TLS settings or perform a GKE deployment.
