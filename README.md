# ATS template study 2026

Data and code behind the Wynhire study *"We Ran Our 29 Templates Through Our
Extraction Gate: Here Is the Exact Text the Robot Sees"*
(https://wynhire.com/blog/ats-template-study-2026).

**Summary.** Each of the 29 resume templates in the Wynhire catalog was used to
render the same two-page sample resume to PDF with the production pipeline.
The text layer of every PDF was extracted with [unpdf](https://github.com/unjs/unpdf)
(pdf.js) and compared, token by token, with the canonical plain-text
serialization of the source resume. Every template preserved its declared
reading order (29/29) and cleared the 95 % coverage gate; the only tokens
lost in extraction are URL fragments (the `https` scheme, and the project
name fused with its URL in the four densest compact layouts). This repository
ships the 29 PDFs, their extracted text, the source resume, the comparison
script, and the per-template results, so the extraction and comparison steps
can be re-run by anyone with Node.js.

## Results (this repository, gate run of 2026-10-16)

Expected tokens per template: 266. Threshold: coverage strictly above 95 %
and reading order intact. Reading order preserved: 29/29. Passing: 29/29.

| Template | Family | Badge | Token coverage | Matched | Order preserved | Missing tokens |
|---|---|---|---|---|---|---|
| Metro | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Slate | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Signal | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Nova | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Aster | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Verve | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Axis | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Onyx | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Cobalt | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Crest | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Summit | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Basel | Modern | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Harlan | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Madison | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Clarendon | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Beacon | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Tenure | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Regent | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Sterling | Heritage | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Kernel | Compact | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Vector | Compact | ATS-Verified | 98.12 % | 261/266 | Yes | https openmetrics github |
| Stacker | Compact | ATS-Verified | 98.12 % | 261/266 | Yes | https openmetrics github |
| Ledger | Compact | ATS-Verified | 98.87 % | 263/266 | Yes | https |
| Primer | Compact | ATS-Verified | 98.12 % | 261/266 | Yes | https openmetrics github |
| Mono | Compact | ATS-Verified | 98.12 % | 261/266 | Yes | https openmetrics github |
| Studio | Statement | Best for human review | 98.87 % | 263/266 | Yes | https |
| Panorama | Statement | Best for human review | 98.87 % | 263/266 | Yes | https |
| Duet | Statement | Best for human review | 98.87 % | 263/266 | Yes | https |
| Atlas | Statement | Best for human review | 98.87 % | 263/266 | Yes | https |

The same table is in `results/results.csv` and `results/results.json`
(with `expected_tokens`, `matched_tokens`, `coverage_pct`, `order_preserved`,
`missing_tokens` per template). Both files are written by `npm run study`,
not edited by hand.

### Where the missing tokens come from

- `https` (missing in all 29 templates, 3 occurrences): the canonical text
  includes the scheme of the three links in the resume (LinkedIn, portfolio,
  GitHub project); the templates display links as clean addresses without the
  scheme. The address text itself is extracted intact in every template.
- `openmetrics`, `github` (missing in Vector, Stacker, Primer, Mono): in these
  four dense compact layouts the project name and its URL sit on one line and
  the extraction joins them with no space, producing a single token
  `openmetricsgithub` (see `data/extracted/vector.txt`, line 34:
  `OpenMetricsgithub.com/jordanavery/openmetrics`). The multiset comparison
  therefore counts both `openmetrics` and `github` as missing. No job title,
  employer, date, skill or bullet token is missing in any template.

### How these numbers relate to the published page

The page reports the gate run of **2026-08-22**: 284 expected tokens,
98.94 % on 26 templates and 98.24 % on three compact templates (Vector,
Primer, Mono). This repository cannot restate those exact figures as its own
output, for two reasons that we state rather than hide:

1. **The sample resume was shortened on 2026-08-23** (one day after the
   published run) so that the demo resume fits on one page in all six site
   languages: the summary lost one clause, one experience bullet and one
   project bullet were trimmed. The canonical serialization went from 284 to
   266 tokens. With the same misses, 3/266 gives 98.87 % (instead of
   281/284 = 98.94 %) and 5/266 gives 98.12 % (instead of 279/284 = 98.24 %).
   Both fixtures are included: `data/sample-resume.json` (current, used for
   the bundled PDFs) and `data/sample-resume-2026-08-22.json` (published run);
   `npm test` checks that the latter still serializes to 284 tokens.
2. **The bundled PDFs are from the gate run of 2026-10-16**, the most recent
   run whose artifacts were kept (the gate overwrites its artifacts on every
   run, and the 2026-08-22 PDFs were not archived). On this run a fourth
   compact template, Stacker, shows the same name/URL fusion as Vector,
   Primer and Mono, so four templates measure 98.12 % rather than three.

What is unchanged between the two runs: 29/29 reading order, every template
above the 95 % threshold, the same three `https` misses everywhere, and no
loss of resume prose. The page also describes the compact-layout losses as a
line-wrap split of the GitHub URL; the extracted text in this repository
shows the mechanism more precisely as a missing space between the project
name and the URL. The tokens lost are the same two.

## Method

1. **Render.** The sample resume (`data/sample-resume.json`, a fictional
   senior product manager; every section type the builder supports,
   including a current role, skill groups with and without names,
   certifications, a project with a URL, languages and a custom section) is
   rendered through each template by the production print route and
   converted to PDF by the production headless-Chromium engine, the same path
   that produces customer downloads. US conventions (Letter paper,
   "March 2022" dates; five compact templates use "Mar 2022"). The 29 PDFs
   are in `data/pdf/`. This step is **not** reproducible from this
   repository: it needs the Wynhire application. Everything after it is.
   The only change made to the gate artifacts before publication is the
   PDF `Title` metadata field, which carried the internal render URL and a
   short-lived signed token; it was rewritten with pdf-lib (content streams
   untouched; `npm test` confirms the extraction is identical to the one the
   production code recorded on the original files).
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
npm run study    # extracts the 29 PDFs, writes results/results.csv and results/results.json
npm test         # checks the port against the production code's recorded output
```

`npm run study` re-extracts the text from `data/pdf/*.pdf`, recomputes every
number in the table above and exits with code 1 if any template fails the
gate. `npm test` verifies that `src/parity.mjs` (a self-contained port of
the production parity code) reproduces, byte for byte, the production
serialization, the per-template expected texts, the heading sequences and
the parity reports recorded in `data/reference/production-parity.json`.

## What this study does not show

- **One extraction engine.** unpdf/pdf.js is one open-source implementation
  of PDF text extraction. Commercial ATS parsers use their own engines, and
  engines can disagree on difficult files. "Extracts completely in one
  engine" is evidence, not proof, for every engine.
- **One sample resume.** Every number comes from one two-page fixture. A
  different resume (very long URLs, unusual Unicode, many pages) could show
  different residuals.
- **No commercial ATS was tested.** ATS vendors do not expose their parsers
  for benchmarking. What is measured is the layer all of them depend on: the
  text extractable from the PDF.
- **Parsing, not ranking.** The gate measures whether text survives the trip
  into an ATS. It says nothing about how any employer's ranking, filtering
  or searches treat that text.
- **A snapshot.** The numbers describe the catalog as rendered on
  2026-10-16. Templates and rendering engines change; the gate re-runs on
  every change.

## Repository layout

```
data/
  sample-resume.json             source resume used for the bundled PDFs (shortened 2026-08-23)
  sample-resume.txt              its canonical plain-text serialization (production output)
  sample-resume-2026-08-22.json  fixture behind the published page (284 tokens)
  sample-resume-2026-08-22.txt   its serialization
  templates.json                 29 templates: id, name, family, badge, layout, section order, date style
  pdf/<template>.pdf             29 rendered PDFs (production pipeline, 2026-10-16)
  extracted/<template>.txt       text layer of each PDF (written by npm run study)
  expected/<template>.txt        expected text per template (production code)
  reference/production-parity.json  heading sequences and parity reports from the production code
results/
  results.csv, results.json      per-template results (written by npm run study)
src/
  parity.mjs                     serialization, tokenizer, coverage and order checks
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

## License

- Code (`src/`, `package.json`): MIT, see `LICENSE`.
- Data and text (`data/`, `results/`, this README): Creative Commons
  Attribution 4.0 International, see `LICENSE-DATA`. Please credit
  "Wynhire, ATS template study 2026" with a link to the study page.

Author: Wynhire.
