import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { formatMarkdoc } from '../scripts/format-markdoc';
import stagedTasks from '../lint-staged.config.mjs';

const root = process.cwd();
const executable = (name: string) => resolve(root, 'node_modules/.bin', name);

function fixture() {
  const cwd = mkdtempSync(resolve(root, '.fixture-quality-'));
  const put = (path: string, content: string) => {
    mkdirSync(dirname(resolve(cwd, path)), { recursive: true });
    writeFileSync(resolve(cwd, path), content);
  };
  for (const path of [
    '.qualityignore',
    '.oxlintrc.json',
    '.oxfmtrc.json',
    '.prettierrc.json',
    'lint-staged.config.mjs',
    'scripts/quality-files.mjs',
    'scripts/format-markdoc.ts',
    '.husky/pre-commit',
  ]) {
    mkdirSync(dirname(resolve(cwd, path)), { recursive: true });
    copyFileSync(resolve(root, path), resolve(cwd, path));
  }
  symlinkSync(resolve(root, 'node_modules'), resolve(cwd, 'node_modules'), 'dir');
  put('.gitignore', 'node_modules/\n.husky/_/\n');
  put(
    'package.json',
    JSON.stringify({
      type: 'module',
      packageManager: 'pnpm@10.8.0',
      scripts: {
        // Exercise the real hook while controlling the expensive whole-project check's result.
        typecheck: 'node typecheck-probe.mjs',
      },
    }),
  );
  put(
    'typecheck-probe.mjs',
    "import { appendFileSync } from 'node:fs'; appendFileSync('typecheck-ran', JSON.stringify(process.argv.slice(2)) + '\\n'); process.exit(Number(process.env.PROBE_EXIT ?? 0));\n",
  );
  const run = (command: string, args: string[], extra: Record<string, string> = {}) => {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      env: {
        ...process.env,
        PATH: `${resolve(root, 'node_modules/.bin')}:${process.env.PATH}`,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Quality fixture',
        GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
        GIT_COMMITTER_NAME: 'Quality fixture',
        GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
        ASTRO_TELEMETRY_DISABLED: '1',
        HUSKY: '1',
        ...extra,
      },
    });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  };
  const ok = (command: string, args: string[], extra?: Record<string, string>) => {
    const result = run(command, args, extra);
    assert.equal(result.status, 0, result.output);
    return result.output;
  };
  return {
    cwd,
    put,
    run,
    ok,
    read: (path: string) => readFileSync(resolve(cwd, path), 'utf8'),
    cleanup: () => rmSync(cwd, { recursive: true, force: true }),
  };
}

test('Markdoc hygiene preserves tags, indentation, fenced code and hard breaks', () => {
  const source =
    '{% prose key="intro" %}\r\nTwo spaces  \r\nnext line\r\n\r\n```js\r\n  x()\r\n```\r\n{% /prose %}';
  const formatted = formatMarkdoc(source);
  assert.equal(formatted, source.replaceAll('\r\n', '\n') + '\n');
  assert.equal(formatMarkdoc(formatted), formatted);
});

test('staged dispatch excludes evidence and assigns each formatter a disjoint set', () => {
  const tasks = stagedTasks(
    [
      'src/a.ts',
      'src/a.svelte',
      'src/a.astro',
      'content/a.mdoc',
      'src/a.scss',
      '.github/workflows/ci.yml',
      '.scratch/probe.ts',
      '.fixture-probe/x.ts',
      'tests/fixtures/legacy/probe.html',
      'node_modules/probe.ts',
      'dist/probe.ts',
      '.astro/probe.ts',
      '.pnpm-store/probe.ts',
      '.pi/probe.ts',
    ].map((path) => resolve(root, path)),
  );
  assert.equal(tasks.length, 4);
  assert.match(tasks[0]!, /oxfmt.*a\.svelte.*a\.scss.*ci\.yml/);
  assert.doesNotMatch(tasks[0]!, /\.astro|\.mdoc/);
  assert.match(tasks[1]!, /prettier.*a\.astro/);
  assert.match(tasks[2]!, /format-markdoc.*a\.mdoc/);
  assert.match(tasks[3]!, /oxlint.*a\.ts.*a\.svelte.*a\.astro/);
  assert.doesNotMatch(tasks.join('\n'), /probe|typecheck|tsc/);
});

test('installed formatters cover code, components, data, styles, Markdown, Markdoc and workflow YAML', () => {
  const f = fixture();
  try {
    const cases: Record<string, string> = {
      'probe.ts': 'export const value={a:1}',
      'probe.js': 'export const value={a:1}',
      'probe.svelte':
        '<script lang="ts">let value=$state(1)</script><button onclick={()=>value++}>{value}</button>',
      'probe.json': '{"value":1}',
      'probe.css': '.a{color:red}',
      'probe.scss': '$color:red;.a{color:$color;&:hover{color:blue}}',
      'probe.md': '# Hello\n\n-   text',
      '.github/workflows/probe.yml':
        'name: Check\non: [push]\njobs: {check: {runs-on: ubuntu-latest, steps: [{run: "pnpm lint"}]}}',
    };
    for (const [path, source] of Object.entries(cases)) {
      f.put(path, source);
      assert.equal(f.run(executable('oxfmt'), ['--check', path]).status, 1, path);
      f.ok(executable('oxfmt'), ['--write', path]);
      f.ok(executable('oxfmt'), ['--check', path]);
      assert.notEqual(f.read(path), source);
    }
    f.put('probe.astro', '---\nconst value={a:1}\n---\n<p>{value.a}</p>');
    assert.equal(f.run(executable('prettier'), ['--check', 'probe.astro']).status, 1);
    f.ok(executable('prettier'), ['--write', 'probe.astro']);
    f.ok(executable('prettier'), ['--check', 'probe.astro']);
    f.put('probe.mdoc', '{% prose key="intro" %}\r\nKeep this  \r\n{% /prose %}');
    assert.equal(
      f.run(executable('tsx'), ['scripts/format-markdoc.ts', '--check', 'probe.mdoc']).status,
      1,
    );
    f.ok(executable('tsx'), ['scripts/format-markdoc.ts', '--write', 'probe.mdoc']);
    f.ok(executable('tsx'), ['scripts/format-markdoc.ts', '--check', 'probe.mdoc']);
    assert.equal(f.read('probe.mdoc'), '{% prose key="intro" %}\nKeep this  \n{% /prose %}\n');
    f.put('invalid.ts', 'export const = ;');
    assert.notEqual(f.run(executable('oxfmt'), ['--check', 'invalid.ts']).status, 0);
    f.put('.scratch/untouched.ts', 'export const = ;');
    f.ok(executable('oxfmt'), [
      '--check',
      '--ignore-path',
      '.qualityignore',
      '--no-error-on-unmatched-pattern',
      '.scratch/untouched.ts',
    ]);
  } finally {
    f.cleanup();
  }
});

test('Oxlint rejects real code errors, including Astro/Svelte scripts, and accepts template-used values', () => {
  const f = fixture();
  try {
    for (const [path, source] of Object.entries({
      'probe.ts': 'debugger;',
      'probe.astro': '---\ndebugger;\n---\n<p>Hello</p>',
      'probe.svelte': '<script lang="ts">debugger;</script><p>Hello</p>',
    })) {
      f.put(path, source);
      const bad = f.run(executable('oxlint'), ['--deny-warnings', path]);
      assert.equal(bad.status, 1, bad.output);
      assert.match(bad.output, /no-debugger/);
    }
    f.put('probe.astro', '---\nconst message = "Hello";\n---\n<p>{message}</p>');
    f.put(
      'probe.svelte',
      '<script lang="ts">let count = $state(0);</script><button onclick={() => count++}>{count}</button>',
    );
    f.ok(executable('oxlint'), ['--deny-warnings', 'probe.astro', 'probe.svelte']);
    f.put('invalid.ts', 'const value = ;');
    assert.notEqual(f.run(executable('oxlint'), ['invalid.ts']).status, 0);
  } finally {
    f.cleanup();
  }
});

test('tsc covers standalone scripts, tests and root configs, excluding scratch evidence', () => {
  const f = fixture();
  try {
    f.put('tsconfig.json', readFileSync(resolve(root, 'tsconfig.json'), 'utf8'));
    f.put('.scratch/invalid.ts', 'const broken: number = "scratch must not be checked";');
    f.ok(executable('tsc'), ['--noEmit']);
    for (const path of [
      'scripts/probe.ts',
      'tests/probe.ts',
      'probe.config.ts',
      'probe.config.mjs',
    ]) {
      f.put(
        path,
        '/** @type {number} */\nconst value = "wrong";\nexport const typed: number = value;\n',
      );
      if (path.endsWith('.mjs'))
        f.put(path, '/** @type {number} */\nexport const value = "wrong";\n');
      const bad = f.run(executable('tsc'), ['--noEmit']);
      assert.notEqual(bad.status, 0, path);
      assert.match(bad.output, /not assignable to type 'number'/);
      rmSync(resolve(f.cwd, path));
    }
  } finally {
    f.cleanup();
  }
});

test('framework checks reject invalid Astro and Svelte component types', () => {
  const f = fixture();
  try {
    f.put('tsconfig.json', readFileSync(resolve(root, 'tsconfig.json'), 'utf8'));
    f.put('src/pages/index.astro', '---\nconst count: number = 1;\n---\n<p>{count}</p>');
    f.put('src/Probe.svelte', '<script lang="ts">const count: number = 1;</script><p>{count}</p>');
    f.ok(executable('astro'), ['check']);
    f.ok(executable('svelte-check'), ['--tsconfig', './tsconfig.json']);
    f.put('src/pages/index.astro', '---\nconst count: number = "wrong";\n---\n<p>{count}</p>');
    const astro = f.run(executable('astro'), ['check']);
    assert.notEqual(astro.status, 0, astro.output);
    assert.match(astro.output, /not assignable to type 'number'/);
    f.put(
      'src/Probe.svelte',
      '<script lang="ts">const count: number = "wrong";</script><p>{count}</p>',
    );
    const svelte = f.run(executable('svelte-check'), ['--tsconfig', './tsconfig.json']);
    assert.notEqual(svelte.status, 0, svelte.output);
    assert.match(svelte.output, /not assignable to type 'number'/);
  } finally {
    f.cleanup();
  }
});

test('real Husky hook formats only staged content, preserves unstaged work, and propagates failures', () => {
  const f = fixture();
  try {
    f.ok('git', ['init', '-q']);
    f.put(
      'probe.ts',
      "export const staged = 'base';\n\n// Keep the two hunks separated.\n// 1\n// 2\n// 3\n// 4\n// 5\n\nexport const unstaged = 'base';\n",
    );
    f.ok('git', ['add', '.']);
    f.ok('git', ['commit', '-qm', 'Isolated fixture baseline'], { HUSKY: '0' });
    f.ok(executable('husky'), []);
    assert.equal(f.ok('git', ['config', 'core.hooksPath']).trim(), '.husky/_');
    const base = f.read('probe.ts');
    f.put('probe.ts', base.replace("staged = 'base'", 'staged={value:1}'));
    f.put('file with spaces.ts', 'export const spaced={value:1}');
    f.ok('git', ['add', 'probe.ts', 'file with spaces.ts']);
    f.put('probe.ts', f.read('probe.ts').replace("unstaged = 'base'", "unstaged = 'local only'"));
    f.put('untracked.ts', 'export const untouched={value:1}');
    f.ok('git', ['commit', '-qm', 'Exercise actual pre-commit']);
    const committed = f.ok('git', ['show', 'HEAD:probe.ts']);
    assert.match(committed, /staged = \{ value: 1 \}/);
    assert.equal(
      f.ok('git', ['show', 'HEAD:file with spaces.ts']),
      'export const spaced = { value: 1 };\n',
    );
    assert.match(committed, /unstaged = 'base'/);
    assert.match(f.read('probe.ts'), /unstaged = 'local only'/);
    assert.equal(f.read('untracked.ts'), 'export const untouched={value:1}');
    assert.equal(f.read('typecheck-ran'), '[]\n', 'typecheck gets no appended paths');
    const head = f.ok('git', ['rev-parse', 'HEAD']);
    f.put('bad.ts', "export const invalid=typeof 1==='strnig';\n");
    f.ok('git', ['add', 'bad.ts']);
    const lintFailure = f.run('git', ['commit', '-qm', 'Must fail formatting/lint']);
    assert.notEqual(lintFailure.status, 0, lintFailure.output);
    assert.match(lintFailure.output, /valid-typeof/);
    assert.equal(
      f.read('bad.ts'),
      "export const invalid=typeof 1==='strnig';\n",
      'failed lint restores pre-format staged work',
    );
    assert.equal(f.ok('git', ['rev-parse', 'HEAD']), head);
    assert.equal(f.read('typecheck-ran'), '[]\n', 'failed staged task stops before typecheck');
    assert.match(f.read('probe.ts'), /unstaged = 'local only'/);
    f.put('bad.ts', 'export const valid = 1;\n');
    f.ok('git', ['add', 'bad.ts']);
    const typeFailure = f.run('git', ['commit', '-qm', 'Must fail typecheck'], { PROBE_EXIT: '7' });
    assert.notEqual(typeFailure.status, 0, typeFailure.output);
    assert.match(typeFailure.output, /code 7|exit code 7/);
    assert.equal(f.ok('git', ['rev-parse', 'HEAD']), head);
    assert.equal(f.read('typecheck-ran'), '[]\n[]\n');
    assert.match(f.read('probe.ts'), /unstaged = 'local only'/);
  } finally {
    f.cleanup();
  }
});
