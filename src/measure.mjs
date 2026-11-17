#!/usr/bin/env node
// ATS template study: measure every bundled PDF.
//
// Usage: node src/measure.mjs [main | latest-fixture | all]   (default: all)
//
// For each template listed in data/templates.json and each selected run:
//   1. read <pdfDir>/<template>.pdf (rendered by the production pipeline);
//   2. extract its text layer with unpdf (pdf.js) and save it to
//      <extractedDir>/<template>.txt;
//   3. compare it, token by token, with the expected text derived from the
//      run's sample resume (see src/parity.mjs);
//   4. write <resultsDir>/results.csv and <resultsDir>/results.json.
// Exit code 1 if any template is at or below the 95 % threshold or breaks
// its declared reading order.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "unpdf";
import { checkResumeParity, COVERAGE_THRESHOLD, CONVENTIONS } from "./parity.mjs";
import { selectRuns } from "./runs.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const abs = (p) => path.join(ROOT, p);
const templates = JSON.parse(readFileSync(abs("data/templates.json"), "utf8"));

const csvEscape = (value) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const COLUMNS = [
  "template",
  "family",
  "badge",
  "expected_tokens",
  "matched_tokens",
  "coverage_pct",
  "order_preserved",
  "missing_tokens",
];

async function measureRun(name, run) {
  console.log(`== Run "${name}": ${run.label}`);
  const resume = JSON.parse(readFileSync(abs(run.fixture), "utf8"));
  mkdirSync(abs(run.extractedDir), { recursive: true });
  mkdirSync(abs(run.resultsDir), { recursive: true });

  const rows = [];
  let failed = false;
  for (const template of templates) {
    const pdf = readFileSync(abs(path.join(run.pdfDir, `${template.id}.pdf`)));
    const { totalPages, text } = await extractText(new Uint8Array(pdf), { mergePages: true });
    writeFileSync(abs(path.join(run.extractedDir, `${template.id}.txt`)), text);

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

  const csv =
    [
      COLUMNS.join(","),
      ...rows.map((row) =>
        COLUMNS.map((c) => {
          const value = row[c];
          if (Array.isArray(value)) return csvEscape(value.join(" "));
          if (typeof value === "boolean") return value ? "yes" : "no";
          if (c === "coverage_pct") return value.toFixed(2);
          return csvEscape(value);
        }).join(","),
      ),
    ].join("\n") + "\n";
  writeFileSync(abs(path.join(run.resultsDir, "results.csv")), csv);

  const summary = {
    run: name,
    label: run.label,
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
    abs(path.join(run.resultsDir, "results.json")),
    JSON.stringify({ summary, results: rows }, null, 2) + "\n",
  );

  console.log(
    `Templates: ${summary.templates}, order preserved: ${summary.order_preserved}/${summary.templates},` +
      ` above ${summary.threshold_pct}%: ${summary.passing}/${summary.templates}.` +
      ` Expected tokens: ${summary.expected_tokens.join(", ")}.`,
  );
  for (const [pct, ids] of Object.entries(summary.coverage_distribution)) {
    console.log(`  ${pct}%: ${ids.length} template(s) (${ids.join(", ")})`);
  }
  console.log(`Missing-token vocabulary: ${summary.missing_token_vocabulary.join(", ")}`);
  console.log(`Wrote ${run.resultsDir}/results.csv and ${run.resultsDir}/results.json.\n`);
  return failed;
}

let anyFailed = false;
for (const [name, run] of selectRuns(process.argv.slice(2))) {
  if (await measureRun(name, run)) anyFailed = true;
}
process.exit(anyFailed ? 1 : 0);
