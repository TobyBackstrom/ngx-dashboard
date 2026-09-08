#!/usr/bin/env node
// smoke-dev-server.mjs
//
// Boots `ng serve` and asserts the demo actually bootstraps in a browser.
//
// Why this exists: the AOT build path (`ng build`, `ng test`, `ng lint`) does
// not go through Vite, so a broken dev server is invisible to every other check
// in CI. That happened -- a stale `overrides.vite` pinned Vite below the version
// `@angular/build` requires, Angular's linker plugin never ran over the
// prebundled deps, and @angular/cdk reached the browser with partial
// compilation intact. Everything else stayed green while the app rendered
// nothing.
//
// Drives Chrome over the DevTools protocol rather than adding Playwright or
// Puppeteer: Chrome is already present for karma, and Node has fetch and
// WebSocket built in.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PORT = Number(process.env.SMOKE_PORT ?? 4321);
const CDP_PORT = Number(process.env.SMOKE_CDP_PORT ?? 9333);
const SERVE_TIMEOUT_MS = 180_000;
const SETTLE_MS = Number(process.env.SMOKE_SETTLE_MS ?? 15_000);
/** Rendered characters below which we treat the app as not having booted. */
const MIN_RENDERED_CHARS = 50;

const children = [];
let shuttingDown = false;

function log(msg) {
  console.log(`[smoke] ${msg}`);
}

function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
}
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    cleanup();
    process.exit(1);
  });
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

/** Resolves once the dev server prints its local URL, or rejects on timeout. */
function startDevServer() {
  return new Promise((resolve, reject) => {
    log(`starting ng serve on :${PORT}`);
    const child = spawn(
      'npx',
      ['ng', 'serve', 'demo', '--port', String(PORT)],
      { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
    );
    children.push(child);

    let output = '';
    const timer = setTimeout(() => {
      reject(new Error(`dev server did not start within ${SERVE_TIMEOUT_MS}ms\n${output}`));
    }, SERVE_TIMEOUT_MS);

    const onData = (buf) => {
      const text = buf.toString();
      output += text;
      // Surface build failures immediately rather than waiting for the timeout.
      if (/ERROR|Application bundle generation failed/.test(text)) {
        clearTimeout(timer);
        reject(new Error(`dev server build failed:\n${output}`));
      }
      if (new RegExp(`localhost:${PORT}`).test(text)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`dev server exited early with code ${code}\n${output}`));
    });
  });
}

async function startChrome(chromePath) {
  log(`starting ${chromePath} with CDP on :${CDP_PORT}`);
  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${CDP_PORT}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  children.push(child);

  // Poll for the DevTools endpoint rather than sleeping a fixed interval.
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${CDP_PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chrome DevTools endpoint never became available');
}

/** Loads the app, returning collected errors and the rendered character count. */
function inspectPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const errors = [];
    let rendered = null;
    let id = 0;
    const RENDER_PROBE_ID = 9999;

    const send = (method, params = {}, overrideId) =>
      ws.send(JSON.stringify({ id: overrideId ?? ++id, method, params }));

    // A failed font or analytics request from a third-party CDN must not fail
    // the build; only problems served from our own origin count.
    const isOurs = (text = '') =>
      !/https?:\/\/(?!localhost)/.test(text) || text.includes(`localhost:${PORT}`);

    ws.onerror = (err) => reject(new Error(`CDP socket error: ${err?.message ?? err}`));

    ws.onopen = () => {
      send('Runtime.enable');
      send('Log.enable');
      send('Page.enable');
      send('Page.navigate', { url: `http://localhost:${PORT}/` });
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        errors.push(`EXCEPTION: ${d?.exception?.description ?? d?.text ?? 'unknown'}`);
      }
      if (msg.method === 'Log.entryAdded') {
        const entry = msg.params.entry;
        if (entry.level === 'error' && isOurs(entry.url ?? entry.text)) {
          errors.push(`LOG: ${entry.text}`);
        }
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args
          .map((a) => a.description ?? a.value ?? '')
          .join(' ');
        if (isOurs(text)) errors.push(`CONSOLE: ${text}`);
      }
      if (msg.id === RENDER_PROBE_ID) {
        rendered = msg.result?.result?.value ?? 0;
        ws.close();
        resolve({ errors, rendered });
      }
    };

    setTimeout(() => {
      send(
        'Runtime.evaluate',
        {
          expression:
            'document.querySelector("app-root")?.innerText?.trim().length ?? 0',
        },
        RENDER_PROBE_ID,
      );
    }, SETTLE_MS);
  });
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error(
      '[smoke] no Chrome binary found. Set CHROME_BIN, or install google-chrome/chromium.',
    );
    process.exit(1);
  }

  await startDevServer();
  log('dev server up');
  const wsUrl = await startChrome(chromePath);
  log(`loading http://localhost:${PORT}/ and settling for ${SETTLE_MS}ms`);
  const { errors, rendered } = await inspectPage(wsUrl);

  let failed = false;

  if (errors.length) {
    failed = true;
    console.error(`\n[smoke] ${errors.length} console error(s):\n`);
    for (const e of errors) console.error(`  ${e}\n`);
  }

  if (rendered < MIN_RENDERED_CHARS) {
    failed = true;
    console.error(
      `\n[smoke] app-root rendered ${rendered} characters (expected at least ${MIN_RENDERED_CHARS}) -- the app did not bootstrap.\n`,
    );
  }

  cleanup();

  if (failed) {
    console.error('[smoke] FAILED');
    process.exit(1);
  }
  log(`OK -- app bootstrapped, ${rendered} characters rendered, no console errors`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[smoke] ${err.message}`);
  cleanup();
  process.exit(1);
});
