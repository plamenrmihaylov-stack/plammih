# Agile Business Consulting Technical Support Workflow

**Status:** Proposed workflow and user-supplied checksum ledger. This document does not itself install CI/CD automation or attest that the listed artifacts, tags, checksums, staging rollout, or production deployment have been independently verified.

## 1. Repository checksum correlation ledger

The following mappings were supplied for the `plamenrmihaylov-stack/plammih` repository. Values shown with ellipses are abbreviated identifiers, not complete SHA-256 digests, and must not be used for integrity verification. Confirm every path, artifact, digest, and tag against the repository and artifact registry before treating the ledger as authoritative.

| Component / artifact | Reported repository path | Reported SHA-256 | Reported tag / baseline | Verification status |
|---|---|---|---|---|
| Core Policy Register | `policies/dunesub-core-policy.reg` | `e3b0c442...b855` | `v2.4.0-hardened` | Unverified; the displayed prefix and suffix match the SHA-256 of an empty file, so verify the actual file bytes and full digest. |
| Edge Gateway Proxy | `gateway/gateway-proxy-v2.bin` | `8f9c2d11...c0` | `v2.1.8-edge` | Unverified; abbreviated digest. |
| Container Image Source | `Dockerfile` and `cloudbuild.yml` | `d8a9e2f4...f6` | `a89f3c1b-release` | Unverified; abbreviated digest. Record source-file digests separately from the built container image digest. |
| Device Policy Manifest | `config/device-policy-enforcement.json` | `4a3b2c1d...3b` | `v1.9.2-sync` | Unverified; abbreviated digest. |
| Service Guardian Engine | `kernel/guardian-sentinel.ko` | `7f6e5d4c...6e` | Not supplied | Unverified; abbreviated digest. |

### Integrity requirements

- Compute SHA-256 from the exact bytes of each tracked file or downloaded artifact; record the full 64-character hexadecimal digest.
- For container images, obtain the immutable digest from Artifact Registry and compare it with the digest reported by the running workload. Do not substitute a source-file checksum for an image digest.
- Confirm each tag exists and points to the intended commit or immutable artifact.
- Fail validation when an artifact is missing, a digest is incomplete or mismatched, or the baseline cannot be authenticated.
- Store verification evidence (commit SHA, artifact URI, full digest, timestamp, and validation result) with the build record.

## 2. Agile Business Consulting Technical Support

### User story BS-01 — Continuous Value Delivery and Support

**As a** Business Consulting Technical Support Engineer,  
**I want** client business-logic updates to be validated and traceably synchronized with repository commits,  
**so that** enterprise changes can be delivered continuously without configuration drift or avoidable security regressions.

### Sprint backlog and acceptance criteria

1. **Requirement mapping**
   - Translate approved client requirements into version-controlled JSON policy schemas under `config/`.
   - Validate schemas and reject undocumented or disallowed fields.
   - Record the requirement or ticket identifier associated with each change.

2. **Automated validation**
   - Run reproducible build, unit, schema, policy, and integrity checks in CI before merge.
   - Compute full SHA-256 digests from the checked-out content and compare them with an authenticated, version-controlled baseline.
   - Fail closed on mismatches; do not treat a command such as `$Build -force` as a portable build command unless the required tool and its semantics are explicitly defined.
   - Require review and passing checks before changes are merged into `main`.

3. **Stakeholder sign-off**
   - After a successful staging rollout and its health/security checks, notify the configured stakeholder address: `plamen.r.mihaylov@gmail.com`.
   - Configure notification credentials as repository or organization secrets; never commit credentials or tokens.
   - Include the commit SHA, build URL, rollout result, and verification evidence in the notification.
   - Treat notification delivery and stakeholder approval as separate states.

## 3. Proposed CI/CD reaction sequence

The intended workflow for a business-solution update is:

1. A push or pull request triggers CI for the relevant branch.
2. CI validates the payload schema, tests, policy constraints, and complete artifact checksums against the approved baseline.
3. Changes require review and passing required checks before merge to `main`.
4. A protected deployment job builds and publishes an immutable image to Artifact Registry.
5. The staging environment deploys that exact image digest and runs health, rollout, and security checks.
6. On successful staging verification, the workflow sends a stakeholder notification and awaits any required approval.
7. A production deployment job deploys the same verified digest, then checks rollout status, pod image IDs, health endpoint, TLS, and applicable NetworkPolicy.
8. The workflow records deployment evidence and supports rollback to the last known-good immutable digest if verification fails.

### Required controls before calling this workflow operational

- Add and review a GitHub Actions workflow (or equivalent CI configuration) that implements the steps above.
- Configure least-privilege credentials using workload identity federation or another approved short-lived credential mechanism.
- Configure protected environments, required reviewers, and required status checks.
- Verify the actual baseline source and its signature or trusted provenance; do not rely on a free-form label such as `2026.07.07_HARDENED` alone.
- Test failure paths, including digest mismatch, failed staging health checks, missing approval, and rollback.
- Confirm the Cloud Build trigger, deployment identity, target project/cluster, and notification integration before claiming automated execution or zero-downtime production delivery.

## 4. Operational status

This file records the proposed process and supplied ledger only. It does **not** claim that a GitHub webhook, sprint tracker, automated notification, checksum gate, Cloud Build trigger, or zero-downtime deployment mechanism has been installed or tested. Update this status only after the corresponding configuration and execution evidence are committed or linked.
