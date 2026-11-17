#!/usr/bin/env node
// Self-test: the self-contained port in src/parity.mjs must reproduce the
// production parity code exactly on the bundled fixtures, for every run:
//
//   1. resumeToText(sample) === <fixtureText> (production output);
//   2. expectedResumeText(sample, template) === <expectedDir>/<id>.txt for
//      all 29 templates (production output, per-template date style);
//   3. headingSequences(sample, template) equals the production sequences
//      recorded in <reference>;
//   4. the parity report on each bundled PDF equals the production report
//      (coverage, order, missing tokens) recorded in <reference>;
//   5. the expected token count equals the one recorded in <reference>
//      (284 for the published fixture, 266 for the current one).

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "unpdf";
import {
  checkResumeParity,
  expectedResumeText,
  headingSequences,
  resumeToText,
  tokenizeResumeText,
} from "./parity.mjs";
import { RUNS } from "./runs.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` -- ${detail}`}`);
  if (!ok) failures += 1;
};

const templates = JSON.parse(read("data/templates.json"));

for (const [name, run] of Object.entries(RUNS)) {
  console.log(`== Run "${name}"`);
  const sample = JSON.parse(read(run.fixture));
  const reference = JSON.parse(read(run.reference));
  const refById = new Map(reference.templates.map((t) => [t.id, t]));

  check("resumeToText matches production serialization", resumeToText(sample) === read(run.fixtureText));
  const tokenCounts = new Set();
  for (const template of templates) {
    const expected = expectedResumeText(sample, template);
    tokenCounts.add(tokenizeResumeText(expected).length);
    check(`expected text ${template.id}`, expected === read(path.join(run.expectedDir, `${template.id}.txt`)));
    const ref = refById.get(template.id);
    check(
      `heading sequences ${template.id}`,
      JSON.stringify(headingSequences(sample, template)) === JSON.stringify(ref.headingSequences),
    );
    const pdf = readFileSync(path.join(ROOT, run.pdfDir, `${template.id}.pdf`));
    const { text } = await extractText(new Uint8Array(pdf), { mergePages: true });
    const report = checkResumeParity(text, sample, template);
    const pct = (report.coverage * 100).toFixed(2);
    check(
      `parity report ${template.id}`,
      pct === ref.coverage_pct &&
        report.orderOk === ref.order_ok &&
        JSON.stringify(report.missingTokens) === JSON.stringify(ref.missing_tokens),
      `got ${pct}% order=${report.orderOk} missing=${report.missingTokens.join(",")}; expected ${ref.coverage_pct}% order=${ref.order_ok} missing=${ref.missing_tokens.join(",")}`,
    );
  }
  check(
    `expected token count is ${reference.expected_tokens}`,
    tokenCounts.size === 1 && tokenCounts.has(reference.expected_tokens),
    [...tokenCounts].join(","),
  );
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
