/*
 * Appends one row to a CSV from a parsed GitHub issue form.
 * Used by both the "Add a book" and "Suggest a book" flows.
 *
 * Input:  process.env.ISSUE_JSON — JSON keyed by issue-form field IDs.
 * Config (env, with defaults for the add-a-book flow):
 *   CSV_FILE  — target CSV file (default: books.csv)
 *   COLUMNS   — comma-separated column order (default: the book columns)
 *   REQUIRED  — comma-separated columns that must be non-empty (default: title,author)
 * Outputs (to GITHUB_OUTPUT): ok, title, author, reason.
 *
 * Field content is treated as untrusted data: it is CSV-escaped and never
 * interpolated into a shell command.
 */
const fs = require("fs");

const CSV_PATH = process.env.CSV_FILE || "books.csv";
const COLUMNS = (process.env.COLUMNS ||
  "title,author,synopsis,goodreads,genre,language,amazon")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const REQUIRED = (process.env.REQUIRED || "title,author")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const NONE = /^(_no response_|_none_|n\/a|na|none|-)?$/i; // treat as empty

function setOutput(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  const safe = String(value).replace(/\n/g, " ");
  if (out) fs.appendFileSync(out, `${name}=${safe}\n`);
  else console.log(`${name}=${safe}`);
}

function clean(value) {
  if (value == null) return "";
  const v = String(value).replace(/\r\n|\r|\n/g, " ").trim();
  return NONE.test(v) ? "" : v;
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function label(col) {
  return col.charAt(0).toUpperCase() + col.slice(1);
}

function main() {
  let data;
  try {
    data = JSON.parse(process.env.ISSUE_JSON || "{}");
  } catch (e) {
    setOutput("ok", "false");
    setOutput("reason", "The submission could not be parsed.");
    return;
  }

  const entry = {};
  for (const col of COLUMNS) entry[col] = clean(data[col]);

  const missing = REQUIRED.filter((c) => !entry[c]);
  if (missing.length) {
    setOutput("ok", "false");
    setOutput("reason", `${missing.map(label).join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
    return;
  }

  // Basic URL sanity: drop link values that are not http(s) links.
  for (const col of ["goodreads", "amazon"]) {
    if (entry[col] && !/^https?:\/\//i.test(entry[col])) entry[col] = "";
  }

  // Ensure the file ends with a newline before appending.
  let existing = "";
  if (fs.existsSync(CSV_PATH)) existing = fs.readFileSync(CSV_PATH, "utf8");
  const needsNewline = existing.length > 0 && !existing.endsWith("\n");

  const row = COLUMNS.map((c) => csvEscape(entry[c])).join(",");
  fs.appendFileSync(CSV_PATH, (needsNewline ? "\n" : "") + row + "\n");

  setOutput("ok", "true");
  setOutput("title", entry.title || "");
  setOutput("author", entry.author || "");
  console.log(`Appended to ${CSV_PATH}: ${row}`);
}

main();
