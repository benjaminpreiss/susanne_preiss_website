# Local quality checks

Use Node >=22.12.0 and pnpm 10.8.0. Development dependencies are exact-pinned in
`package.json` and resolved in `pnpm-lock.yaml`. lint-staged 16.2.7 supports this
Node floor; version 17 requires Node >=22.22.1. Node 24.20.0 was used for verification.

## Commands

| Command             | Purpose                                                              | Writes files?                        |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `pnpm lint`         | Oxlint correctness rules, no debugger, smart equality; warnings fail | No                                   |
| `pnpm lint:fix`     | Same rules with safe automatic fixes; remaining findings fail        | Yes                                  |
| `pnpm format:check` | Oxfmt, Astro fallback and Markdoc hygiene checks                     | No                                   |
| `pnpm format`       | Same formatters, with disjoint file ownership                        | Yes                                  |
| `pnpm typecheck`    | `astro check`, `svelte-check`, then `tsc --noEmit`                   | Only framework-generated types/cache |
| `pnpm check`        | Alias for `pnpm typecheck`                                           | Same as above                        |
| `pnpm build`        | Production build and content/link/asset validation                   | `dist/`, generated types/cache       |
| `pnpm test`         | Unit, content-build, parity and isolated quality/hook tests          | Disposable `.fixture-*` directories  |

Build before running the complete tests, which inspect `dist/`. Formatting is not
linting, and Oxlint does **not** replace TypeScript diagnostics. `tsconfig.json`
explicitly includes application code, standalone scripts, tests and root configs.
`checkJs` also checks JavaScript configs and Astro inline scripts. Scratch evidence,
legacy fixtures, generated output and dependencies are not standalone typecheck inputs.

## Verified file coverage

The installed versions are **Oxfmt 0.71.0**, **Oxlint 1.86.0**, **Prettier 3.9.9**
and **prettier-plugin-astro 1.1.0**. `tests/quality.test.ts` probes these tools with
valid and invalid fixtures, including components and workflow YAML.

| Maintained files                          | Formatter owner                                     | Lint/type/content checking                                                  |
| ----------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| JS, MJS, CJS, TS, JSX, TSX                | Oxfmt                                               | Oxlint; TypeScript, including JS via `checkJs`                              |
| Astro                                     | Prettier + official Astro plugin, **only** `.astro` | Oxlint script/frontmatter extraction; `astro check`; build                  |
| Svelte                                    | Oxfmt, with `svelte: true`                          | Oxlint script extraction; `svelte-check`; build                             |
| JSON / JSONC / JSON5                      | Oxfmt                                               | Formatter parses syntax; application content schemas/build where applicable |
| CSS / SCSS / Less                         | Oxfmt                                               | Formatter parses syntax; Sass/build for application styles                  |
| Markdown                                  | Oxfmt                                               | Formatter parses supported Markdown                                         |
| YAML, including `.github/workflows/*.yml` | Oxfmt                                               | Formatter parses syntax, not GitHub Actions semantics                       |
| Markdoc `.mdoc`                           | `scripts/format-markdoc.ts`                         | Astro Markdoc parser, frontmatter and editorial schemas during build/tests  |

Oxlint coverage of Astro/Svelte means extracted JavaScript/TypeScript, **not full
framework-template linting**. Keep framework checks. Oxfmt includes its Svelte
formatter; no separate Svelte Prettier dependency/config is needed. Astro formatting
uses the plugin's `astroCompressHTML: "jsx"`, matching Astro 7's default, so it
respects the compiler's whitespace behavior.

Oxfmt does not support Astro or Markdoc. The Astro fallback is invoked with an
explicit `**/*.astro` glob; Oxfmt explicitly excludes both extensions. Do not run
`prettier --write .`, which would create competing formatter ownership.

No compatible Markdoc reformatter was verified. With owner approval, the deliberately
narrow fallback normalizes CRLF/CR to LF and adds a missing final newline only. It
preserves tags, frontmatter, fenced code, indentation, blank lines, prose wrapping
and Markdown's two-space hard breaks. It is **not** a Markdoc syntax validator;
`pnpm build` supplies that validation. Never send `.mdoc` through a generic Markdown
parser. New syntax/files need an explicit coverage decision, not silent skipping.

Formatting style: two spaces, single JS quotes, semicolons, width 100, LF, preserved
prose wrapping. Import sorting and package-key sorting are disabled to avoid
unnecessary reordering. The initial Oxfmt pass needed a second pass on three chained
expressions; the final full check passes. After dependency upgrades, check formatting
idempotence rather than assuming formatter outputs are unchanged.

### Exclusions

`.qualityignore` is shared by the native CLIs and the custom staged/Markdoc tools:

- `node_modules/`, `.pnpm-store/`, `dist/`, `.astro/`, `.husky/_/`, `.git/`;
- disposable `.fixture-*/` directories and `.scratch/` verification records;
- immutable `tests/fixtures/legacy/` snapshots and copied `public/` assets;
- package-manager-generated `pnpm-lock.yaml`;
- independently maintained agent tooling (`.agents/`, `.pi/`, `AGENTS.md`, `skills-lock.json`).

Ordinary maintained docs, content JSON, editorial content and non-legacy test fixtures
remain covered. `public/` contains copied images/SVGs/downloads and legacy icon
metadata, not maintained application source. A new maintained script/template there
must be moved into source or explicitly included in quality coverage. Lockfile
integrity is checked with pnpm's frozen installation, not a second formatter.

## Pre-commit behavior

`pnpm install` runs `prepare: husky`. In a normal clone/worktree, Husky installs
`.husky/_` shims and configures `core.hooksPath`. `.husky/pre-commit` runs:

```sh
pnpm exec lint-staged && pnpm typecheck
```

The single sequential task list in `lint-staged.config.mjs`:

1. Formats only supported staged files, with disjoint formatter ownership.
2. Runs Oxlint safe fixes on staged JS/TS/Astro/Svelte; remaining lint errors fail.
3. Only after successful staged tasks, the hook runs **full-project** type checking.

Full-project checks are outside lint-staged, so they receive no appended filenames.
Tasks never run two writers on a file concurrently. lint-staged's default backup
stash, hiding of unstaged hunks in partially staged files, and failure rollback are
left enabled. Successful fixes are automatically staged; there is no blanket `git add`.
Unstaged work is preserved, though full-project type checking deliberately sees the
restored working tree, including unstaged changes. Commit smaller coherent changes
if those changes make type checking fail.

## CI boundary

Hooks are convenience, not enforcement. Ticket 09 must run whole-project check-only
scripts plus build/tests/browser checks as required checks. CI should install all
development dependencies without installing hooks:

```sh
HUSKY=0 pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm test
# Run the CI-owned browser checks after starting its preview/browser endpoints.
```

`HUSKY=0` only opts out of hook installation/execution; it must **not** replace CI
checks. It also supports source archives and environments without writable Git
metadata. No GitHub workflow, deployment or push is introduced by this ticket.

## Troubleshooting

- **Broken worktree Git metadata:** repair the checkout externally, then run
  `pnpm prepare`. Inspect `git config --get core.hooksPath` (expected `.husky/_`).
  Husky 9 can print a Git installation error but return success, so don't infer
  installed hooks solely from `prepare`'s exit code. This worktree's `.git` points to
  unavailable metadata; hook verification was done with real commits in a disposable
  Git fixture, not claimed for this worktree.
- **lint-staged failure:** read the failing task. It normally restores the prior
  staged/unstaged state. If interrupted or unable to restore, inspect `git status`
  and `git stash list`; review the `lint-staged automatic backup` before applying it.
  Do not routinely disable the stash or partially staged hiding.
- **pnpm store mismatch in a sandbox:** this session's local store differed from the
  one recorded in `node_modules`. A frozen `CI=true HUSKY=0 pnpm install --frozen-lockfile`
  relinked dependencies to the workspace-local store. No global cache permissions
  were changed. `pnpm view` in pnpm 10 delegates to npm and is not proof that native
  pnpm installation is blocked.
- **Shell cannot find pnpm:** make the documented pnpm version available to Git's
  environment. Do not bypass checks to hide a PATH/configuration problem.

References: [Oxfmt language support](https://oxc.rs/docs/guide/usage/formatter/language-support.html),
[Oxlint](https://oxc.rs/docs/guide/usage/linter.html), the installed Astro plugin README,
and the installed lint-staged/Husky documentation.
