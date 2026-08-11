---
name: Imported app setup
description: A Replit environment quirk affecting imported artifact projects and first-run workflow setup.
---

Imported projects can include `.replit-artifact/artifact.toml` files without those artifacts being present in the live artifact registry. In that case, managed workflow restart/presentation calls cannot resolve the imported artifact even though the source is valid.

**Why:** The imported project can still run normally, but relying only on managed artifact workflow names leaves the user with no started service.

**How to apply:** Check the live artifact/workflow registry after import. If the registry is empty, configure the smallest set of explicit workflows using the artifact commands, ports, and required environment variables from the project files, then verify with HTTP health checks.