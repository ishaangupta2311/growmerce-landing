/**
 * Smoke test for the /try preview pipeline.
 *
 *   npx tsx scripts/preview-smoke.ts allbirds.com gymshark.com
 *   npx tsx scripts/preview-smoke.ts --ssrf
 *
 * The first form runs the real job against real shops and writes each capture to
 * /tmp/growmerce-preview/<host>.jpg so the result can be looked at rather than
 * trusted — a screenshot of a cookie wall passes every assertion you could write
 * about it. The second form asserts that the SSRF guard still refuses the hosts
 * it must refuse; run it after touching anything in store-url.ts.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildPreview } from "../src/lib/preview";
import {
  assertPublicHost,
  isSyntacticallyPublicHost,
  normaliseStoreInput,
} from "../src/lib/preview/store-url";

const OUTPUT_DIR = join(tmpdir(), "growmerce-preview");

type Row = {
  host: string;
  platform: string;
  themeSource: string;
  accent: string;
  background: string;
  text: string;
  products: number;
  shotKb: string;
  ms: number;
};

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}

function printTable(rows: Row[]): void {
  const columns: Array<[keyof Row, number]> = [
    ["host", 22],
    ["platform", 12],
    ["themeSource", 12],
    ["accent", 9],
    ["background", 11],
    ["text", 9],
    ["products", 8],
    ["shotKb", 8],
    ["ms", 7],
  ];
  const header = columns.map(([key, width]) => pad(String(key), width)).join(" ");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const row of rows) {
    console.log(columns.map(([key, width]) => pad(String(row[key]), width)).join(" "));
  }
}

async function runHosts(inputs: string[]): Promise<number> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const rows: Row[] = [];
  let failures = 0;

  for (const input of inputs) {
    const host = normaliseStoreInput(input);
    if (!host) {
      console.error(`FAIL  ${input} — rejected by normaliseStoreInput`);
      failures += 1;
      continue;
    }

    /* Drop the cache entry first: a smoke run that measures a cache hit tells
       us nothing about the pipeline. */
    await rm(join(OUTPUT_DIR, `${host}.json`), { force: true });

    const startedAt = Date.now();
    try {
      const result = await buildPreview(host);
      const elapsed = Date.now() - startedAt;

      let shotKb = "—";
      if (result.screenshot) {
        const bytes = Buffer.from(result.screenshot.split(",")[1] ?? "", "base64");
        shotKb = `${Math.round(bytes.byteLength / 1024)}k`;
        await writeFile(join(OUTPUT_DIR, `${host}.jpg`), bytes);
      }

      rows.push({
        host,
        platform: result.platform,
        themeSource: result.themeSource,
        accent: result.theme.accent,
        background: result.theme.background,
        text: result.theme.text,
        products: result.products.length,
        shotKb,
        ms: elapsed,
      });
    } catch (err) {
      failures += 1;
      console.error(`FAIL  ${host} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (rows.length > 0) {
    console.log("");
    printTable(rows);
    console.log(`\nscreenshots: ${OUTPUT_DIR}/<host>.jpg`);
  }
  return failures;
}

type SsrfCase = {
  input: string;
  /**
   * `normalise` — the visitor's input, rejected on syntax alone.
   * `syntactic` — the browser stage's per-request check, which sees raw hosts
   *   pulled out of the store's own markup rather than anything a visitor typed.
   * `resolve` — needs DNS.
   */
  kind: "normalise" | "syntactic" | "resolve";
  note: string;
};

const SSRF_CASES: SsrfCase[] = [
  { input: "localhost", kind: "normalise", note: "loopback name" },
  { input: "127.0.0.1", kind: "normalise", note: "bare loopback IP" },
  { input: "169.254.169.254", kind: "normalise", note: "cloud metadata IP" },
  { input: "10.0.0.1", kind: "normalise", note: "RFC 1918 IP" },
  { input: "[::1]", kind: "normalise", note: "IPv6 loopback literal" },
  { input: "foo.internal", kind: "normalise", note: "private suffix" },
  { input: "http://127.0.0.1:8080/admin", kind: "normalise", note: "loopback with port" },
  { input: "http://evil.com:22/", kind: "normalise", note: "non-web port" },
  { input: "169.254.169.254", kind: "syntactic", note: "metadata IP in page markup" },
  { input: "10.0.0.5", kind: "syntactic", note: "private IP in page markup" },
  { input: "localhost", kind: "syntactic", note: "loopback name in page markup" },
  { input: "vault.internal", kind: "syntactic", note: "private suffix in page markup" },
  { input: "localtest.me", kind: "resolve", note: "public name resolving to 127.0.0.1" },
];

const ACCEPT_CASES: Array<[string, string]> = [
  ["allbirds.com", "allbirds.com"],
  ["MYSTORE.COM/", "mystore.com"],
  ["  https://mystore.com/collections/x  ", "mystore.com"],
  ["mystore.myshopify.com", "mystore.myshopify.com"],
];

async function runSsrf(): Promise<number> {
  let failures = 0;

  for (const testCase of SSRF_CASES) {
    if (testCase.kind === "syntactic") {
      const ok = !isSyntacticallyPublicHost(testCase.input);
      console.log(`${ok ? "PASS" : "FAIL"}  browser-side reject ${testCase.input} (${testCase.note})`);
      if (!ok) failures += 1;
      continue;
    }

    const host = normaliseStoreInput(testCase.input);

    if (testCase.kind === "normalise") {
      const ok = host === null;
      console.log(`${ok ? "PASS" : "FAIL"}  reject ${testCase.input} (${testCase.note})`);
      if (!ok) failures += 1;
      continue;
    }

    if (!host) {
      console.log(`PASS  reject ${testCase.input} (${testCase.note}) — refused before DNS`);
      continue;
    }
    try {
      await assertPublicHost(host);
      console.log(`FAIL  reject ${testCase.input} (${testCase.note}) — resolved as public`);
      failures += 1;
    } catch (err) {
      console.log(
        `PASS  reject ${testCase.input} (${testCase.note}) — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /* The browser stage must not reject the CDNs a storefront actually loads. */
  for (const host of ["cdn.shopify.com", "www.googletagmanager.com", "kith.com"]) {
    const ok = isSyntacticallyPublicHost(host);
    console.log(`${ok ? "PASS" : "FAIL"}  browser-side allow ${host}`);
    if (!ok) failures += 1;
  }

  for (const [input, expected] of ACCEPT_CASES) {
    const host = normaliseStoreInput(input);
    const ok = host === expected;
    console.log(`${ok ? "PASS" : "FAIL"}  accept ${input.trim()} → ${host ?? "null"}`);
    if (!ok) failures += 1;
  }

  return failures;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const failures =
    args.includes("--ssrf") ? await runSsrf()
    : args.length > 0 ? await runHosts(args)
    : (console.error("usage: preview-smoke.ts <host…> | --ssrf"), 1);

  if (failures > 0) {
    console.error(`\n${failures} failure(s)`);
    process.exitCode = 1;
  }
}

void main();
