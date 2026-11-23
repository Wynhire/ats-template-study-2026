# ATS template study 2026

[![reproduce](https://github.com/Wynhire/ats-template-study-2026/actions/workflows/test.yml/badge.svg)](https://github.com/Wynhire/ats-template-study-2026/actions/workflows/test.yml) [![data: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA) [![code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24469317.svg)](https://doi.org/10.5281/zenodo.24469317)

Data and code behind the Wynhire study *"We Ran Our 29 Templates Through Our
Extraction Gate: Here Is the Exact Text the Robot Sees"*
(https://wynhire.com/blog/ats-template-study-2026).

**Summary.** Each of the 29 resume templates in the Wynhire catalog was used to
render the same two-page sample resume to PDF with the production pipeline.
The text layer of every PDF was extracted with [unpdf](https://github.com/unjs/unpdf)
(pdf.js) and compared, token by token, with the canonical plain-text
serialization of the source resume. Every template preserved its declared
reading order (29/29) and cleared the 95 % coverage gate: 26 templates
measured 98.94 % and the three densest compact templates 98.24 %. The only
tokens lost in extraction are URL fragments. This repository ships the 29
PDFs, their extracted text, the source resume, the comparison script and the
per-template results, so the extraction and comparison steps can be re-run by
anyone with Node.js.

## Results

Sample resume: the 2026-08-22 fixture behind the published study
(`data/sample-resume.json`), re-rendered through the production pipeline on
2026-11-17. Expected tokens per template: 284. Threshold: coverage strictly
above 95 % and reading order intact. Reading order preserved: 29/29.
Passing: 29/29.

| Template | Family | Badge | Token coverage | Matched | Order preserved | Missing tokens |
|---|---|---|---|---|---|---|
| Metro | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Slate | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Signal | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Nova | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Aster | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Verve | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Axis | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Onyx | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Cobalt | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Crest | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Summit | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Basel | Modern | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Harlan | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Madison | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Clarendon | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Beacon | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Tenure | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Regent | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Sterling | Heritage | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Kernel | Compact | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Vector | Compact | ATS-Verified | 98.24 % | 279/284 | Yes | https openmetrics github |
| Stacker | Compact | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Ledger | Compact | ATS-Verified | 98.94 % | 281/284 | Yes | https |
| Primer | Compact | ATS-Verified | 98.24 % | 279/284 | Yes | https openmetrics github |
| Mono | Compact | ATS-Verified | 98.24 % | 279/284 | Yes | https openmetrics github |
| Studio | Statement | Best for human review | 98.94 % | 281/284 | Yes | https |
| Panorama | Statement | Best for human review | 98.94 % | 281/284 | Yes | https |
| Duet | Statement | Best for human review | 98.94 % | 281/284 | Yes | https |
| Atlas | Statement | Best for human review | 98.94 % | 281/284 | Yes | https |

The same table is in `results/results.csv` and `results/results.json`
(`expected_tokens`, `matched_tokens`, `coverage_pct`, `order_preserved`,
`missing_tokens` per template). Both files are written by `npm run study`,
not edited by hand. These figures are identical to the ones reported on the
study page (run of 2026-08-22).

### Where the missing tokens come from

- `https` (missing in all 29 templates, 3 occurrences): the canonical text
  includes the scheme of the three links in the resume (LinkedIn, portfolio,
  GitHub project); the templates display links as clean addresses without the
  scheme. The address text itself is extracted intact in every template.
  98.94 % = 281 of 284 token occurrences found.
- `openmetrics`, `github` (missing in Vector, Primer and Mono): in these
  three dense compact layouts the project name and its URL sit on one line
  and the extraction joins them with no space, producing a single token
  `openmetricsgithub` (see `data/extracted/vector.txt`, line 34:
  `OpenMetricsgithub.com/jordanavery/openmetrics`). The multiset comparison
  therefore counts both `openmetrics` and `github` as missing.
  98.24 % = 279 of 284. The study page describes this loss as a line-wrap
  split of the GitHub URL; the extracted text shows the mechanism more
  precisely as a missing space between the project name and the URL. The two
  tokens lost are the same.
- No job title, employer, date, skill or bullet token is missing in any
  template.

## Two runs, why they differ

This repository bundles two measurement runs. Both use the same 29 templates,
the same extraction (unpdf 1.7.0) and the same comparison code; they differ
only in the sample resume.

| | Main run (`data/`, `results/`) | Second run (`data/latest-fixture/`, `results/latest-fixture/`) |
|---|---|---|
| Sample resume | 2026-08-22 fixture (the one behind the published page) | Current fixture, shortened on 2026-08-23 |
| Expected tokens | 284 | 266 |
| PDFs rendered | 2026-11-17 (catalog at its current revision) | 2026-10-16 (production gate run) |
| Reading order | 29/29 | 29/29 |
| Coverage | 98.94 % on 26 templates, 98.24 % on 3 (Vector, Primer, Mono) | 98.87 % on 25 templates, 98.12 % on 4 (Vector, Stacker, Primer, Mono) |
| Missing tokens | `https` x3 everywhere; `openmetrics`, `github` in the 3 dense layouts | `https` x3 everywhere; `openmetrics`, `github` in the 4 dense layouts |

What changed on 2026-08-23: one clause of the summary, one experience bullet
and one project bullet were trimmed so that the demo resume fits on one page
in all six site languages (compare `data/sample-resume.txt` with
`data/latest-fixture/sample-resume.txt`). The misses are the same kind in
both runs, but the denominator changed (284 to 266), so the percentages
moved: 3/266 gives 98.87 % instead of 281/284 = 98.94 %, and 5/266 gives
98.12 % instead of 279/284 = 98.24 %. With the shorter project line, one
more compact template (Stacker) renders the project name and URL on a single
line and shows the same fusion as Vector, Primer and Mono.

The original PDFs of the 2026-08-22 run were not archived (the gate
overwrites its artifacts on every run). The main run therefore re-renders
the 2026-08-22 fixture with the catalog at its current revision; the
template registry was last changed on 2026-08-25 (density presets, no
layout change) and the results are identical to the published ones, token
for token.

## Method

1. **Render.** The sample resume (a fictional senior product manager; every
   section type the builder supports, including a current role, skill groups
   with and without names, certifications, a project with a URL, languages
   and a custom section) is rendered through each template by the production
   print route and converted to PDF by the production headless-Chromium
   engine, the same path that produces customer downloads. US conventions
   (Letter paper, "March 2022" dates; five compact templates use "Mar 2022").
   This step is **not** reproducible from this repository: it needs the
   Wynhire application. Everything after it is. The only change made to the
   rendered files before publication is the PDF `Title` metadata field, which
   carried the internal render URL and a short-lived signed token; it was
   rewritten with pdf-lib (content streams untouched; `npm test` confirms the
   extraction is identical to the one the production code recorded on the
   original files).
2. **Extract.** The text layer of each PDF is extracted with unpdf 1.7.0
   (`extractText`, pages merged). Output: `data/extracted/<template>.txt`.
3. **Expected text.** The source resume is serialized to linear plain text
   (`src/parity.mjs`, `resumeToText`: header, summary, sections top to
   bottom, no layout) and its `YYYY-MM` dates are rendered in the template's
   date style. This is the only rendering difference tolerated between stored
   data and output. `data/sample-resume.txt` is the production serialization;
   `data/expected/<template>.txt` is the per-template expected text produced
   by the production code.
4. **Tokenize.** Both texts are Unicode-normalized (NFKC, which folds PDF
   ligatures such as "fi" back into letters), lowercased and split on any
   character that is not a letter or a digit.
5. **Coverage.** Multiset comparison: every occurrence of every expected
   token must be found in the extraction (a word expected three times must be
   extracted three times). `coverage = matched / expected`.
6. **Reading order.** The name, the summary heading and every content-bearing
   section title must appear in the extraction in the template's declared
   reading order. Single-column layouts have one sequence. Two-column
   (Statement family) layouts have one sequence per column, checked
   independently, because multi-page renders interleave the columns page by
   page; that weaker guarantee is why those four templates carry "Best for
   human review" instead of ATS-Verified even though they score the same.
7. **Gate.** A template passes if coverage is strictly above 95 % and the
   order check holds. In the production codebase a failure fails the build.

## Reproduce

Requires Node.js 20 or later.

```sh
npm install
npm run study    # both runs: extracts the PDFs, writes results/ and results/latest-fixture/
npm test         # checks the port against the production code's recorded output
```

`node src/measure.mjs main` or `node src/measure.mjs latest-fixture` runs a
single run. `npm run study` re-extracts the text from the bundled PDFs,
recomputes every number in the tables above and exits with code 1 if any
template fails the gate. `npm test` verifies that `src/parity.mjs` (a
self-contained port of the production parity code) reproduces, byte for
byte, the production serialization, the per-template expected texts, the
heading sequences and the parity reports recorded in
`data/production-parity.json` and `data/latest-fixture/production-parity.json`.

## What this study does not show

- **One extraction engine.** unpdf/pdf.js is one open-source implementation
  of PDF text extraction. Commercial ATS parsers use their own engines, and
  engines can disagree on difficult files. "Extracts completely in one
  engine" is evidence, not proof, for every engine.
- **One sample resume.** Every number comes from one two-page fixture. A
  different resume (very long URLs, unusual Unicode, many pages) could show
  different residuals; the second run above is a small illustration of how
  the residual moves with the fixture.
- **No commercial ATS was tested.** ATS vendors do not expose their parsers
  for benchmarking. What is measured is the layer all of them depend on: the
  text extractable from the PDF.
- **Parsing, not ranking.** The gate measures whether text survives the trip
  into an ATS. It says nothing about how any employer's ranking, filtering
  or searches treat that text.
- **A snapshot.** The numbers describe the catalog as rendered on the dates
  above. Templates and rendering engines change; the gate re-runs on every
  change.

## Repository layout

```
data/
  sample-resume.json             2026-08-22 fixture (published study), 284 tokens
  sample-resume.txt              its canonical plain-text serialization (production output)
  templates.json                 29 templates: id, name, family, badge, layout, section order, date style
  pdf/<template>.pdf             29 PDFs re-rendered on 2026-11-17 from that fixture
  extracted/<template>.txt       text layer of each PDF (written by npm run study)
  expected/<template>.txt        expected text per template (production code)
  production-parity.json         heading sequences and parity reports from the production code
  latest-fixture/                second run: current fixture (266 tokens), gate run of 2026-10-16
    sample-resume.json, sample-resume.txt, pdf/, extracted/, expected/, production-parity.json
results/
  results.csv, results.json      main run (written by npm run study)
  latest-fixture/results.csv, results.json   second run
src/
  parity.mjs                     serialization, tokenizer, coverage and order checks
  runs.mjs                       the two runs (paths and labels)
  measure.mjs                    npm run study
  selftest.mjs                   npm test
```

## The study in six languages

- English: https://wynhire.com/blog/ats-template-study-2026
- English (UK): https://wynhire.com/uk/blog/ats-template-study-2026
- French: https://wynhire.com/fr/blog/etude-modeles-cv-ats-2026
- German: https://wynhire.com/de/blog/ats-vorlagen-studie-2026
- Spanish: https://wynhire.com/es/blog/estudio-plantillas-ats-2026
- Italian: https://wynhire.com/it/blog/studio-template-ats-2026

## Explainer videos

- E1, How an ATS Reads Your Resume: We Tested 29 Templates: https://youtu.be/pGmppvPxRNs
- E2, Job Posting Keywords: What ATS Software Looks For (Real Demo): https://youtu.be/2Jw1Araf6zQ
- E3, Resume Layouts That Lose Lines in an ATS: Real Test Files: https://youtu.be/-_5OWAWou9Q

## Data archive and citation

The data of this repository is archived on Zenodo under the DOI
[10.5281/zenodo.24469317](https://doi.org/10.5281/zenodo.24469317) (concept DOI for all versions:
[10.5281/zenodo.24469316](https://doi.org/10.5281/zenodo.24469316)).

Plain text:

> Wynhire (2026). ATS template study 2026: text-extraction fidelity of 29
> resume templates [Data set]. Zenodo. https://doi.org/10.5281/zenodo.24469317

BibTeX:

```bibtex
@dataset{wynhire_ats_template_study_2026,
  author    = {Wynhire},
  title     = {ATS template study 2026: text-extraction fidelity of 29 resume templates},
  year      = {2026},
  publisher = {Zenodo},
  version   = {1.0.0},
  doi       = {10.5281/zenodo.24469317},
  url       = {https://doi.org/10.5281/zenodo.24469317}
}
```

GitHub's "Cite this repository" button reads `CITATION.cff`, which carries the same DOI.

## License

- Code (`src/`, `package.json`): MIT, see `LICENSE`.
- Data and text (`data/`, `results/`, this README): Creative Commons
  Attribution 4.0 International, see `LICENSE-DATA`. Please credit
  "Wynhire, ATS template study 2026" with a link to the study page.

Author: Wynhire.
