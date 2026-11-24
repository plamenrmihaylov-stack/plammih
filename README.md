# plammih

Ecosystem and cyberspace for forced forks to the cloud.

## Public professional identity website

The intended public request path is:

`Browser -> Cloudflare reverse proxy -> GKE external LoadBalancer Service -> plammih Pods (TCP 3000)`

The Kubernetes Service exposes port 80 and forwards to container port 3000. Cloudflare can proxy to the external IP assigned to that Service; an Ingress controller is not implied by the current manifests. The actual live Cloudflare origin target and TLS settings must be verified in the provider control planes before release.

- `/` serves the professional profile and Schema.org JSON-LD.
- `/robots.txt` publishes crawler directives and the sitemap location.
- `/sitemap.xml` publishes the canonical homepage URL.
- `/healthz` remains the Kubernetes health-check endpoint.

The Cloudflare Worker in `wrangler.toml` is a separate deployment target and is not assumed to serve the canonical website origin. See [the identity implementation notes](docs/identity-implementation.md).

## Application and HTTP headers

The HTTP server is implemented in `server.mjs`. It listens on `0.0.0.0` and uses `PORT` (default `3000`). Application responses set defensive headers including `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a restrictive `Content-Security-Policy`, and explicit cache controls. The application does not intentionally advertise a server banner; a `Server` header observed at the public edge may be added by Cloudflare or the GKE load-balancing path.

## Google Kubernetes Engine

The manifests in `k8s/` define a Deployment and a `type: LoadBalancer` Service. There is no Ingress resource in this repository. The Service external IP is the expected Cloudflare origin endpoint, subject to confirmation against the live Cloudflare DNS record.

Configuration defaults (not proof of live resource identity):
- GCP project: `driven-crawler-502217f6`
- Artifact Registry: `europe-west1/dunesub-artifact-repo`
- GKE cluster: `plammih-gke`
- GKE location: `europe-west1`

## Build and release separation

- `cloudbuild.yml` builds and pushes a uniquely tagged image. It does not deploy.
- `cloudbuild-deploy.yml` is a separate release pipeline and must be invoked explicitly with a reviewed image tag. It checks the expected project and cluster before applying the Kubernetes manifests.
- Pull-request CI runs tests and a Docker build only. It has no deployment credentials or deployment step.

Never point a deployment trigger at an unreviewed branch. Verify the actual production cluster and Cloudflare origin mapping before running the release pipeline. See [deployment and origin verification](docs/identity-implementation.md#operational-verification-checklist).

## Validation

Run the application tests with:

```bash
node --test tests/server.test.mjs
```
