# plammih

Ecosystem and cyberspace for forced forks to the cloud.

## Application

The HTTP server is implemented in `server.mjs`. It listens on `0.0.0.0` and uses the `PORT` environment variable (default `3000`) so it can run in a container.

## Google Kubernetes Engine deployment

The repository includes a Docker image build and GKE deployment pipeline in `cloudbuild.yml`, plus Kubernetes resources in `k8s/`.

### Defaults

- Google Cloud project: `driven-crawler-502217f6`
- Artifact Registry region: `europe-west1`
- Artifact Registry repository: `plammih-images`
- GKE cluster: `plammih-gke`
- GKE location: `europe-west1`

These are configuration defaults, not confirmation that the resources already exist. Change the Cloud Build substitutions and the image placeholder in `k8s/deployment.yaml` together if using a different registry location or repository.

### One-time Google Cloud setup

Run these commands from an authenticated Google Cloud CLI session with permission to enable APIs, create Artifact Registry repositories and GKE clusters, and grant IAM roles. Confirm billing is enabled first.

```bash
gcloud config set project driven-crawler-502217f6

gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  container.googleapis.com

gcloud artifacts repositories create plammih-images \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Container images for plammih"

# Create a regional Autopilot cluster if one does not already exist.
gcloud container clusters create-auto plammih-gke \
  --region=europe-west1 \
  --project=driven-crawler-502217f6
```

If a cluster already exists, inspect it instead of creating another:
```bash
gcloud container clusters list --project=driven-crawler-502217f6
gcloud artifacts repositories list --project=driven-crawler-502217f6 --location=europe-west1
```

### Cloud Build permissions

The Cloud Build service account needs permission to write images to Artifact Registry and deploy workloads to the selected GKE cluster. Grant least-privilege roles to the actual service account used by the build (the account can vary by project configuration):

- Artifact Registry Writer (`roles/artifactregistry.writer`) on `plammih-images`
- Kubernetes Engine Developer (`roles/container.developer`) on the project/cluster
- Service Account User (`roles/iam.serviceAccountUser`) on the GKE node/workload service account if required by your cluster's IAM configuration

Check the active Cloud Build service account in Google Cloud Console before applying IAM bindings. Do not commit service-account keys or credentials to this repository.

### Build and deploy

After creating the repository and cluster, configure a Cloud Build trigger for this GitHub repository on branch `main`, using `cloudbuild.yml`. The defaults above can be overridden in the trigger's substitution variables (`_AR_LOCATION`, `_AR_REPOSITORY`, `_GKE_LOCATION`, and `_GKE_CLUSTER`).

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

Before production use, configure HTTPS/TLS, monitoring, and an appropriate security policy. The sample server currently returns a simple plain-text response.
