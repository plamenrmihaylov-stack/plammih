# plammih

Ecosystem and cyberspace for forced forks to the cloud.

## Application and HTTP headers

The HTTP server is implemented directly in `server.mjs`. It listens on `0.0.0.0` and uses the `PORT` environment variable (default `3000`) so it can run in a container. The repository's Kubernetes Service exposes port 80 and forwards traffic to the named container port.

Application responses set defensive headers including `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a restrictive `Content-Security-Policy`, and `Cache-Control: no-store`. The Node application does not intentionally advertise a server banner. A `Server` header observed in production may be added by an upstream proxy/load balancer or by a different image; verify the deployed image digest and inspect the response at each hop before attributing it to this application.

## Google Kubernetes Engine deployment

The repository includes a Docker image build and GKE deployment pipeline in `cloudbuild.yml`, plus Kubernetes resources in `k8s/`. The manifest currently defines a direct `LoadBalancer` Service; this repository does not include an Ingress or ingress-controller configuration. Therefore, do not assume that an NGINX ingress or sidecar is configured by these files.

### Defaults

- Google Cloud project: `driven-crawler-502217f6`
- Artifact Registry region: `europe-west1`
- Artifact Registry repository: `dunesub-artifact-repo`
- GKE cluster: `plammih-gke`
- GKE location: `europe-west1`

These are configuration defaults, not confirmation that the resources already exist. The Cloud Build substitution `_AR_REPOSITORY` and the image placeholder in `k8s/deployment.yaml` use the canonical repository name `dunesub-artifact-repo`. If changing the registry location or repository, update both the substitution and image placeholder together.

### One-time Google Cloud setup

Run these commands from an authenticated Google Cloud CLI session with permission to enable APIs, create Artifact Registry repositories and GKE clusters, and grant IAM roles. Confirm billing is enabled first.

```bash
gcloud config set project driven-crawler-502217f6

gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  container.googleapis.com

gcloud artifacts repositories create dunesub-artifact-repo \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Container images for plammih"

# Create a regional Autopilot cluster if one does not already exist.
gcloud container clusters create-auto plammih-gke \
  --region=europe-west1 \
  --project=driven-crawler-502217f6
```

If a cluster or repository already exists, inspect it instead of creating another:
```bash
gcloud container clusters list --project=driven-crawler-502217f6
gcloud artifacts repositories list --project=driven-crawler-502217f6 --location=europe-west1
```

### Cloud Build permissions

The Cloud Build service account needs permission to write images to Artifact Registry and deploy workloads to the selected GKE cluster. Grant least-privilege roles to the actual service account used by the build (the account can vary by project configuration):

- Artifact Registry Writer (`roles/artifactregistry.writer`) scoped to repository `dunesub-artifact-repo`
- Kubernetes Engine Developer (`roles/container.developer`) on the project/cluster
- Service Account User (`roles/iam.serviceAccountUser`) on the GKE node/workload service account if required by your cluster's IAM configuration

Check the active Cloud Build service account in Google Cloud Console before applying IAM bindings. Do not commit service-account keys or credentials to this repository.

### Build and deploy

Configure a Cloud Build trigger for this GitHub repository on branch `main`, using `cloudbuild.yml`. The defaults above can be overridden in the trigger's substitution variables (`_AR_LOCATION`, `_AR_REPOSITORY`, `_GKE_LOCATION`, and `_GKE_CLUSTER`). The canonical default for `_AR_REPOSITORY` is `dunesub-artifact-repo`.

To run a build manually from a local checkout with Google Cloud CLI authenticated:
```bash
gcloud builds submit . \
  --project=driven-crawler-502217f6 \
  --region=europe-west1 \
  --config=cloudbuild.yml
```

The Kubernetes Service is `type: LoadBalancer`, which provisions an external load balancer and may incur charges. After deployment, get its external IP with:
```bash
kubectl get service plammih
```

For production, terminate TLS at a deliberately configured HTTPS-capable edge, enforce an appropriate security policy there, and verify which hop adds response headers. This repository currently defines a direct HTTP LoadBalancer and does not configure TLS, an Ingress, or a proxy sidecar. Do not add HSTS until HTTPS is correctly enforced for the public endpoint.
