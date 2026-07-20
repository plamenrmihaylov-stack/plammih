---
name: cloud-build-enforcer
description: "Use when enforcing cloud build requirements or generating cloudbuild_enforcer.yaml for CI policy enforcement. This agent is designed to apply a force-cloud-build workflow and create or validate a Cloud Build policy manifest."
---

# Cloud Build Enforcer Agent

This custom agent helps you create and enforce a Cloud Build policy manifest named `cloudbuild_enforcer.yaml`.

Use it when you need to:
- enforce that builds run in a cloud build environment
- add or update a Cloud Build policy manifest
- generate guidance for CI configuration and force cloud build behavior

Example prompts:
- "Create a cloudbuild_enforcer.yaml to enforce cloud builds for this repo."
- "Update the Cloud Build policy to require all builds to use the approved builder."
- "Generate a force-cloud-build workflow and explain how to integrate it."
