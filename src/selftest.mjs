#!/usr/bin/env node
// Self-test: the self-contained port in src/parity.mjs must reproduce the
// production parity code exactly on the bundled fixtures.
//
//   1. resumeToText(sample) === data/sample-resume.txt (production output);
//   2. expectedResumeText(sample, template) === data/expected/<id>.txt for
//      all 29 templates (production output, per-template date style);
//   3. headingSequences(sample, template) equals the production sequences
//      recorded in data/reference/production-parity.json;
//   4. the parity report on each bundled PDF equals the production report
//      (coverage, order, missing tokens) recorded in the same file;
//   5. the 2026-08-22 fixture (the one behind the published page) still
//      serializes to data/sample-resume-2026-08-22.txt and to 284 tokens.

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

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA = path.join(ROOT, "data");
const read = (...p) => readFileSync(path.join(DATA, ...p), "utf8");

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` -- ${detail}`}`);
  if (!ok) failures += 1;
};

const templates = JSON.parse(read("templates.json"));
const sample = JSON.parse(read("sample-resume.json"));
const reference = JSON.parse(read("reference", "production-parity.json"));
const refById = new Map(reference.templates.map((t) => [t.id, t]));

check("resumeToText matches production serialization", resumeToText(sample) === read("sample-resume.txt"));

for (const template of templates) {
  const expected = expectedResumeText(sample, template);
  check(`expected text ${template.id}`, expected === read("expected", `${template.id}.txt`));
  const ref = refById.get(template.id);
  check(
    `heading sequences ${template.id}`,
    JSON.stringify(headingSequences(sample, template)) === JSON.stringify(ref.headingSequences),
  );
  const pdf = readFileSync(path.join(DATA, "pdf", `${template.id}.pdf`));
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

const sample0822 = JSON.parse(read("sample-resume-2026-08-22.json"));
check("2026-08-22 fixture serialization", resumeToText(sample0822) === read("sample-resume-2026-08-22.txt"));
const tokens0822 = new Set(
  templates.map((t) => tokenizeResumeText(expectedResumeText(sample0822, t)).length),
);
check("2026-08-22 fixture yields 284 expected tokens", tokens0822.size === 1 && tokens0822.has(284), [...tokens0822].join(","));
const tokensNow = new Set(templates.map((t) => tokenizeResumeText(expectedResumeText(sample, t)).length));
check("current fixture yields 266 expected tokens", tokensNow.size === 1 && tokensNow.has(266), [...tokensNow].join(","));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
