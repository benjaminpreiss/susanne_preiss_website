# Issue tracker: Local Markdown

- Features live under `.scratch/<feature>/`.
- Specs live at `.scratch/<feature>/spec.md`.
- Each ticket has its own `issues/NN-<slug>.md`, numbered from 01.
- The existing migration spec remains at
  `.scratch/astro-svelte-migration-spec.md`; migration tickets live
  under `.scratch/astro-svelte-migration/issues/`.

## Ticket tracking

- `Status:` contains a triage label, `claimed`, or `resolved`.
- `Blocked by:` lists ticket numbers; use `none` when unblocked.
- A ticket is available when marked `ready-for-agent` and all
  dependencies are resolved.
- Claim by setting `Status: claimed` before starting.
- Resolve by recording the outcome and verification under
  `## Answer`, then setting `Status: resolved`.
- Append discussion under `## Comments`.

## Skill operations

- Publish: create or update local Markdown files.
- Fetch: read the referenced ticket file.
- Close: resolve locally; no GitHub issue or PR is required.
- For wayfinder, keep `.scratch/<feature>/map.md` with Notes,
  Decisions-so-far, and Fog sections. Record ticket types using
  `Type: research|prototype|grilling|task`; append resolved
  findings and ticket links to Decisions-so-far.
