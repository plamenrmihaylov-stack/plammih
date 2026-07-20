# plammih
Ecosystem and Cyberspace for forced forks to the cloud

## Custom Agent: Cloud Build Enforcer

This workspace adds a custom agent for enforcing cloud build requirements:

- `cloud-build-enforcer.agent.md`: custom agent for force cloud builds and CI policy generation
- `cloudbuild_enforcer.yaml`: generated manifest for CI enforcement

## How to use

In Copilot chat, invoke the custom agent with prompts like:

- "Use the cloud-build-enforcer agent to generate a cloudbuild_enforcer.yaml."
- "Create a force-cloud-build configuration for this repo."
- "Update the Cloud Build enforcement manifest to require approved builders."

## Next customization ideas

- Add a prompt template under `.github/prompts/` for generating or validating cloud build manifests.
- Add a `copilot-instructions.md` or `AGENTS.md` entry if you want this agent to be discoverable globally.
