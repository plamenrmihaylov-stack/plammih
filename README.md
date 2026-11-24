# plammih

Ecosystem and cyberspace for forced forks to the cloud.

## Public professional identity website

The GKE-hosted Node.js application serves the DuneSub professional identity website through the intended Cloudflare proxy -> GKE Service -> application path.

- `/` serves the professional profile and Schema.org JSON-LD.
- `/robots.txt` publishes crawler directives and the sitemap location.
- `/sitemap.xml` publishes the canonical homepage URL.
- `/healthz` remains the Kubernetes health-check endpoint.

The Cloudflare Worker entry point is a separate target and is not assumed to serve the canonical website origin. See [the identity implementation notes](docs/identity-implementation.md).

## Application and HTTP headers

The HTTP server is implemented directly in `server.mjs`. It listens on `0.0.0.0` and uses the `PORT` environment variable (default `3000`) so it can run in a container. The Kubernetes Service exposes port 80 and forwards traffic to the named container port.

Application responses set defensive headers including `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a restrictive `Content-Security-Policy`, and explicit cache controls. The Node application does not intentionally advertise a server banner. A `Server` header observed in production may be added by an upstream proxy/load balancer or by a different image; verify the deployed image digest and inspect the response at each hop before attributing it to this application.

## Google Kubernetes Engine deployment

The repository includes a Docker image build and GKE deployment pipeline in `cloudbuild.yml`, plus Kubernetes resources in `k8s/`. The deployment manifest currently defines a direct `LoadBalancer` Service; this repository does not include an Ingress or ingress-controller configuration. Do not assume an NGINX ingress or sidecar is configured by these files.

### Defaults

- Google Cloud project: `driven-crawler-502217f6`
- Artifact Registry region: `europe-west1`
- Artifact Registry repository: `dunesub-artifact-repo`
- GKE cluster: `plammih-gke`
- GKE location: `europe-west1`

These are configuration defaults, not confirmation that the resources already exist.

### Build and deploy

Configure a Cloud Build trigger for the intended deployment branch only after review and approval. The build pipeline includes a GKE deployment step; do not trigger it for this review branch.

The Kubernetes Service is `type: LoadBalancer`, which provisions an external load balancer and may incur charges. For production, terminate TLS at a deliberately configured HTTPS-capable edge and verify which hop adds response headers.

## Validation

Run the local application tests with:

```bash
node --test tests/server.test.mjs
```

The identity website CI workflow runs this validation on relevant pull requests and pushes to `main`. This branch does not change production infrastructure or deploy the application.
