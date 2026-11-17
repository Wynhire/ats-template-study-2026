#!/usr/bin/env node
// ATS template study: measure every bundled PDF.
//
// For each template listed in data/templates.json:
//   1. read data/pdf/<template>.pdf (rendered by the production pipeline);
//   2. extract its text layer with unpdf (pdf.js) and save it to
//      data/extracted/<template>.txt;
//   3. compare it, token by token, with the expected text derived from
//      data/sample-resume.json (see src/parity.mjs);
//   4. write results/results.csv and results/results.json.
// Exit code 1 if any template is at or below the 95 % threshold or breaks
// its declared reading order.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "unpdf";
import { checkResumeParity, COVERAGE_THRESHOLD, CONVENTIONS } from "./parity.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA = path.join(ROOT, "data");
const RESULTS = path.join(ROOT, "results");

const templates = JSON.parse(readFileSync(path.join(DATA, "templates.json"), "utf8"));
const resume = JSON.parse(readFileSync(path.join(DATA, "sample-resume.json"), "utf8"));
mkdirSync(path.join(DATA, "extracted"), { recursive: true });
mkdirSync(RESULTS, { recursive: true });

const rows = [];
let failed = false;

for (const template of templates) {
  const pdf = readFileSync(path.join(DATA, "pdf", `${template.id}.pdf`));
  const { totalPages, text } = await extractText(new Uint8Array(pdf), { mergePages: true });
  writeFileSync(path.join(DATA, "extracted", `${template.id}.txt`), text);

  const report = checkResumeParity(text, resume, template, CONVENTIONS);
  const ok = report.coverage > COVERAGE_THRESHOLD && report.orderOk;
  if (!ok) failed = true;

  rows.push({
    template: template.id,
    name: template.name,
    family: template.family,
    badge: template.badge,
    layout: template.layout,
    pages: totalPages,
    expected_tokens: report.expectedTokens,
    matched_tokens: report.matchedTokens,
    coverage_pct: Number((report.coverage * 100).toFixed(2)),
    order_preserved: report.orderOk,
    order_failure: report.orderFailure,
    missing_tokens: report.missingTokens,
    passes_gate: ok,
  });

  console.log(
    `${ok ? "PASS" : "FAIL"} ${template.id.padEnd(10)} coverage=${(report.coverage * 100).toFixed(2)}%` +
      ` (${report.matchedTokens}/${report.expectedTokens})` +
      ` order=${report.orderOk ? "ok" : `KO (${report.orderFailure})`} pages=${totalPages}` +
      (report.missingTokens.length ? ` missing=${report.missingTokens.join(",")}` : ""),
  );
}

const csvEscape = (value) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const columns = [
  "template",
  "family",
  "badge",
  "expected_tokens",
  "matched_tokens",
  "coverage_pct",
  "order_preserved",
  "missing_tokens",
];
const csv = [
  columns.join(","),
  ...rows.map((row) =>
    columns
      .map((c) => {
        const value = row[c];
        if (Array.isArray(value)) return csvEscape(value.join(" "));
        if (typeof value === "boolean") return value ? "yes" : "no";
        if (c === "coverage_pct") return value.toFixed(2);
        return csvEscape(value);
      })
      .join(","),
  ),
].join("\n") + "\n";
writeFileSync(path.join(RESULTS, "results.csv"), csv);

const summary = {
  threshold_pct: COVERAGE_THRESHOLD * 100,
  conventions: CONVENTIONS,
  templates: rows.length,
  order_preserved: rows.filter((r) => r.order_preserved).length,
  passing: rows.filter((r) => r.passes_gate).length,
  expected_tokens: [...new Set(rows.map((r) => r.expected_tokens))],
  coverage_distribution: Object.fromEntries(
    [...new Set(rows.map((r) => r.coverage_pct))]
      .sort((a, b) => b - a)
      .map((pct) => [pct.toFixed(2), rows.filter((r) => r.coverage_pct === pct).map((r) => r.template)]),
  ),
  missing_token_vocabulary: [...new Set(rows.flatMap((r) => r.missing_tokens))].sort(),
};
writeFileSync(
  path.join(RESULTS, "results.json"),
  JSON.stringify({ summary, results: rows }, null, 2) + "\n",
);

console.log("");
console.log(
  `Templates: ${summary.templates}, order preserved: ${summary.order_preserved}/${summary.templates},` +
    ` above ${summary.threshold_pct}%: ${summary.passing}/${summary.templates}.`,
);
console.log(`Expected tokens: ${summary.expected_tokens.join(", ")}.`);
for (const [pct, ids] of Object.entries(summary.coverage_distribution)) {
  console.log(`  ${pct}%: ${ids.length} template(s) (${ids.join(", ")})`);
}
console.log(`Missing-token vocabulary: ${summary.missing_token_vocabulary.join(", ")}`);
console.log(`Wrote results/results.csv and results/results.json.`);
process.exit(failed ? 1 : 0);
