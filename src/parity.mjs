// Pure comparison library for the ATS template study.
//
// This is a self-contained port of the production parity gate
// (resumeToText serialization, expectedResumeText date formatting,
// tokenizer, multiset token coverage, declared-reading-order check).
// `npm test` verifies that it reproduces the production code's output
// byte for byte on the bundled fixtures (see data/expected/ and
// data/reference/production-parity.json).

export const COVERAGE_THRESHOLD = 0.95;

/** Date style used by the study: US conventions ("March 2022"). */
export const CONVENTIONS = { country: "US", dateStyle: "MONTH_YEAR" };

const PRESENT_LABELS = { en: "Present" };
const SUMMARY_TITLES = { en: "Summary" };

/** Section types rendered in the sidebar of two-column (split-stack) layouts. */
export const SPLIT_SIDEBAR_SECTION_TYPES = [
  "skills",
  "certifications",
  "languages",
  "achievements",
];

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// ---------------------------------------------------------------------------
// Resume data helpers (pruning, language)
// ---------------------------------------------------------------------------

function isBlank(value) {
  return !value || String(value).trim() === "";
}

function cleanBullets(bullets) {
  return (bullets ?? []).filter((bullet) => !isBlank(bullet));
}

function pruneSection(section) {
  const entries = section.entries ?? [];
  switch (section.type) {
    case "experience":
      return {
        ...section,
        entries: entries
          .filter(
            (e) =>
              !(
                isBlank(e.role) &&
                isBlank(e.company) &&
                isBlank(e.location) &&
                isBlank(e.startDate) &&
                isBlank(e.endDate) &&
                cleanBullets(e.bullets).length === 0
              ),
          )
          .map((e) => ({ ...e, bullets: cleanBullets(e.bullets) })),
      };
    case "education":
      return {
        ...section,
        entries: entries
          .filter(
            (e) =>
              !(
                isBlank(e.degree) &&
                isBlank(e.institution) &&
                isBlank(e.location) &&
                isBlank(e.startDate) &&
                isBlank(e.endDate) &&
                cleanBullets(e.bullets).length === 0
              ),
          )
          .map((e) => ({ ...e, bullets: cleanBullets(e.bullets) })),
      };
    case "skills":
      return {
        ...section,
        groups: (section.groups ?? [])
          .map((g) => ({ ...g, items: (g.items ?? []).filter((i) => !isBlank(i)) }))
          .filter((g) => g.items.length > 0),
      };
    case "projects":
      return {
        ...section,
        entries: entries
          .filter(
            (e) =>
              !(isBlank(e.name) && isBlank(e.url) && cleanBullets(e.bullets).length === 0),
          )
          .map((e) => ({ ...e, bullets: cleanBullets(e.bullets) })),
      };
    case "certifications":
      return {
        ...section,
        entries: entries.filter(
          (e) => !(isBlank(e.name) && isBlank(e.issuer) && isBlank(e.date)),
        ),
      };
    case "languages":
      return {
        ...section,
        entries: entries.filter((e) => !(isBlank(e.language) && isBlank(e.level))),
      };
    case "achievements":
      return {
        ...section,
        entries: entries.filter((e) => !(isBlank(e.title) && isBlank(e.description))),
      };
    case "custom":
      return {
        ...section,
        entries: entries
          .filter(
            (e) =>
              !(
                isBlank(e.title) &&
                isBlank(e.subtitle) &&
                isBlank(e.date) &&
                cleanBullets(e.bullets).length === 0
              ),
          )
          .map((e) => ({ ...e, bullets: cleanBullets(e.bullets) })),
      };
    default:
      throw new Error(`Unknown section type: ${section.type}`);
  }
}

export function pruneResumeData(data) {
  return {
    ...data,
    basics: {
      ...data.basics,
      links: (data.basics.links ?? []).filter((link) => !isBlank(link.url)),
    },
    sections: (data.sections ?? []).map(pruneSection),
  };
}

/** True if the section still carries content once pruned (templates skip empty sections). */
export function sectionHasContent(section) {
  const pruned = pruneSection(section);
  return pruned.type === "skills" ? pruned.groups.length > 0 : pruned.entries.length > 0;
}

export function getResumeLanguage(data) {
  const language = data.language;
  return language && /^[a-z]{2}(-[A-Z]{2})?$/.test(language) ? language : "en";
}

function label(table, language) {
  const value = table[language] ?? table[language.split("-")[0]];
  if (!value) {
    throw new Error(`Document language "${language}" is not supported by this port (fixture is "en")`);
  }
  return value;
}

export const presentLabel = (language = "en") => label(PRESENT_LABELS, language);
export const summaryTitle = (language = "en") => label(SUMMARY_TITLES, language);

// ---------------------------------------------------------------------------
// Canonical plain-text serialization (the "ATS view" of the resume)
// ---------------------------------------------------------------------------

export function stripMiniMarkdown(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function formatDateRange(startDate, endDate, current, language = "en") {
  const start = startDate ?? "";
  const end = current ? presentLabel(language) : (endDate ?? "");
  if (!start && !end) return "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function entryHeading(title, subtitle, location, dateRange) {
  const main = [title, subtitle].filter(Boolean).join(" - ");
  const withLocation = [main, location].filter(Boolean).join(", ");
  return dateRange ? `${withLocation} (${dateRange})` : withLocation;
}

function sectionToText(section, language) {
  const lines = [section.title.toUpperCase()];
  switch (section.type) {
    case "experience":
      for (const entry of section.entries) {
        lines.push(
          entryHeading(
            entry.role,
            entry.company,
            entry.location,
            formatDateRange(entry.startDate, entry.endDate, entry.current, language),
          ),
        );
        for (const bullet of entry.bullets) lines.push(`- ${stripMiniMarkdown(bullet)}`);
      }
      break;
    case "education":
      for (const entry of section.entries) {
        lines.push(
          entryHeading(
            entry.degree,
            entry.institution,
            entry.location,
            formatDateRange(entry.startDate, entry.endDate),
          ),
        );
        for (const bullet of entry.bullets) lines.push(`- ${stripMiniMarkdown(bullet)}`);
      }
      break;
    case "skills":
      for (const group of section.groups) {
        const items = group.items.join(", ");
        lines.push(group.name ? `${group.name}: ${items}` : items);
      }
      break;
    case "projects":
      for (const entry of section.entries) {
        lines.push([entry.name, entry.url].filter(Boolean).join(" - "));
        for (const bullet of entry.bullets) lines.push(`- ${stripMiniMarkdown(bullet)}`);
      }
      break;
    case "certifications":
      for (const entry of section.entries) {
        const heading = [entry.name, entry.issuer].filter(Boolean).join(" - ");
        lines.push(entry.date ? `${heading} (${entry.date})` : heading);
      }
      break;
    case "languages":
      for (const entry of section.entries) {
        lines.push(entry.level ? `${entry.language}: ${entry.level}` : entry.language);
      }
      break;
    case "achievements":
      for (const entry of section.entries) {
        lines.push(entry.description ? `${entry.title}: ${entry.description}` : entry.title);
      }
      break;
    case "custom":
      for (const entry of section.entries) {
        const heading = [entry.title, entry.subtitle].filter(Boolean).join(" - ");
        lines.push(entry.date ? `${heading} (${entry.date})` : heading);
        for (const bullet of entry.bullets) lines.push(`- ${stripMiniMarkdown(bullet)}`);
      }
      break;
  }
  return lines;
}

/**
 * Full resume as linear plain text, top to bottom, one column, no layout.
 * Dates stay in storage format "YYYY-MM"; see expectedResumeText for the
 * per-template date rendering.
 */
export function resumeToText(input) {
  const resume = pruneResumeData(input);
  const language = getResumeLanguage(resume);
  const blocks = [];

  const header = [];
  if (resume.basics.name) header.push(resume.basics.name);
  if (resume.basics.headline) header.push(resume.basics.headline);
  const contact = [resume.basics.email, resume.basics.phone, resume.basics.location]
    .filter(Boolean)
    .join(" | ");
  if (contact) header.push(contact);
  for (const link of resume.basics.links) {
    if (!link.url) continue;
    header.push(link.label ? `${link.label}: ${link.url}` : link.url);
  }
  if (header.length > 0) blocks.push(header.join("\n"));

  if (resume.summary) {
    blocks.push(`${summaryTitle(language).toUpperCase()}\n${resume.summary}`);
  }

  for (const section of resume.sections) {
    const lines = sectionToText(section, language);
    if (lines.length > 1) blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// Expected text per template (dates rendered in the template's style)
// ---------------------------------------------------------------------------

const MONTH_FORMATTERS = new Map();

function monthFormatter(language, month) {
  const key = `${language}:${month}`;
  let formatter = MONTH_FORMATTERS.get(key);
  if (!formatter) {
    const intlLocale = language === "en" ? "en-US" : language;
    formatter = new Intl.DateTimeFormat(intlLocale, { month, year: "numeric", timeZone: "UTC" });
    MONTH_FORMATTERS.set(key, formatter);
  }
  return formatter;
}

export function formatYearMonth(value, style, language = "en") {
  if (/^\d{4}$/.test(value)) return value;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return value;
  const [, year, month] = match;
  const utc = Date.UTC(Number(year), Number(month) - 1, 1);
  switch (style) {
    case "MONTH_YEAR":
      return monthFormatter(language, "long").format(utc);
    case "MONTH_YEAR_SHORT":
      return monthFormatter(language, "short").format(utc);
    case "MM_YYYY":
      return `${month}/${year}`;
    case "MM_YYYY_DOTTED":
      return `${month}.${year}`;
    default:
      throw new Error(`Unknown date style: ${style}`);
  }
}

/** Effective date style: numeric country conventions win, otherwise the template may override. */
export function resolveDateStyle(template, conventions = CONVENTIONS) {
  if (conventions.dateStyle === "MM_YYYY" || conventions.dateStyle === "MM_YYYY_DOTTED") {
    return conventions.dateStyle;
  }
  return template.dateStyle ?? conventions.dateStyle;
}

/**
 * Text the rendered PDF is expected to contain: the canonical serialization
 * with "YYYY-MM" dates rendered in the template's effective date style. This
 * is the ONLY rendering difference tolerated between storage and output.
 */
export function expectedResumeText(data, template, conventions = CONVENTIONS) {
  const style = resolveDateStyle(template, conventions);
  const language = getResumeLanguage(data);
  const source = YEAR_MONTH.source.replace(/^\^|\$$/g, "");
  return resumeToText(data).replace(new RegExp(`\\b${source}\\b`, "g"), (m) =>
    formatYearMonth(m, style, language),
  );
}

// ---------------------------------------------------------------------------
// Tokenizer, reading order, parity report
// ---------------------------------------------------------------------------

/**
 * Comparison tokens: NFKC (folds PDF ligatures such as "fi" back into
 * letters), lowercase (templates upper-case names and headings via CSS),
 * split on anything that is not a letter or a digit (punctuation and
 * visual separators carry no content).
 */
export function tokenizeResumeText(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Sections in the template's declared reading order (= DOM order of the render). */
export function sectionsInReadingOrder(data, template) {
  if (template.layout !== "split-stack") {
    if (template.sectionOrder !== "education-first") return data.sections;
    const education = data.sections.filter((s) => s.type === "education");
    const rest = data.sections.filter((s) => s.type !== "education");
    return [...education, ...rest];
  }
  const { main, sidebar } = splitSections(data);
  return [...main, ...sidebar];
}

export function splitSections(data) {
  const main = [];
  const sidebar = [];
  for (const section of data.sections) {
    (SPLIT_SIDEBAR_SECTION_TYPES.includes(section.type) ? sidebar : main).push(section);
  }
  return { main, sidebar };
}

/**
 * Heading sequences whose order must be preserved in the extraction.
 * Single-column layouts: ONE sequence (name, summary title, content-bearing
 * section titles in declared order). Two-column (split-stack) layouts: one
 * sequence PER column (header + main column; sidebar), checked independently,
 * because multi-page renders legitimately interleave the two columns page by
 * page. That weaker guarantee is why two-column templates never carry the
 * ATS-Verified badge.
 */
export function headingSequences(data, template) {
  const head = [];
  if (data.basics.name) head.push(data.basics.name);
  if (data.summary) head.push(summaryTitle(getResumeLanguage(data)));
  if (template.layout === "split-stack") {
    const { main, sidebar } = splitSections(data);
    return [
      [...head, ...main.filter(sectionHasContent).map((s) => s.title)],
      sidebar.filter(sectionHasContent).map((s) => s.title),
    ];
  }
  return [
    [
      ...head,
      ...sectionsInReadingOrder(data, template)
        .filter(sectionHasContent)
        .map((s) => s.title),
    ],
  ];
}

/**
 * Compare extracted PDF text with the expected resume text.
 * Coverage is a multiset: every occurrence of every expected token must be
 * found in the extraction. Order: every heading sequence must appear in
 * order in the extraction.
 */
export function checkResumeParity(rendered, data, template, conventions = CONVENTIONS) {
  const expectedTokens = tokenizeResumeText(expectedResumeText(data, template, conventions));
  const renderedTokens = tokenizeResumeText(rendered);
  const renderedCounts = new Map();
  for (const token of renderedTokens) {
    renderedCounts.set(token, (renderedCounts.get(token) ?? 0) + 1);
  }
  let found = 0;
  const missing = new Set();
  for (const token of expectedTokens) {
    const available = renderedCounts.get(token) ?? 0;
    if (available > 0) {
      renderedCounts.set(token, available - 1);
      found += 1;
    } else {
      missing.add(token);
    }
  }
  const coverage = expectedTokens.length === 0 ? 1 : found / expectedTokens.length;

  const haystack = renderedTokens.join(" ");
  let orderOk = true;
  let orderFailure = null;
  outer: for (const sequence of headingSequences(data, template)) {
    let cursor = 0;
    for (const heading of sequence) {
      const needle = tokenizeResumeText(heading).join(" ");
      if (!needle) continue;
      const index = haystack.indexOf(needle, cursor);
      if (index === -1) {
        orderOk = false;
        orderFailure = heading;
        break outer;
      }
      cursor = index + needle.length;
    }
  }

  return {
    expectedTokens: expectedTokens.length,
    matchedTokens: found,
    coverage,
    missingTokens: [...missing],
    orderOk,
    orderFailure,
  };
}
