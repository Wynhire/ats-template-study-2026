// The two measurement runs bundled in this repository. Each run has its own
// sample resume, PDFs, extracted text, expected text and results; the
// comparison code (src/parity.mjs) and the template list are shared.
export const RUNS = {
  main: {
    label: "2026-08-22 fixture (the published study), re-rendered 2026-11-17",
    fixture: "data/sample-resume.json",
    fixtureText: "data/sample-resume.txt",
    pdfDir: "data/pdf",
    extractedDir: "data/extracted",
    expectedDir: "data/expected",
    reference: "data/production-parity.json",
    resultsDir: "results",
  },
  "latest-fixture": {
    label: "current fixture (shortened 2026-08-23), gate run of 2026-10-16",
    fixture: "data/latest-fixture/sample-resume.json",
    fixtureText: "data/latest-fixture/sample-resume.txt",
    pdfDir: "data/latest-fixture/pdf",
    extractedDir: "data/latest-fixture/extracted",
    expectedDir: "data/latest-fixture/expected",
    reference: "data/latest-fixture/production-parity.json",
    resultsDir: "results/latest-fixture",
  },
};

export function selectRuns(argv) {
  const name = argv[0] ?? "all";
  if (name === "all") return Object.entries(RUNS);
  if (!RUNS[name]) {
    throw new Error(`Unknown run "${name}". Use one of: ${Object.keys(RUNS).join(", ")}, all`);
  }
  return [[name, RUNS[name]]];
}
