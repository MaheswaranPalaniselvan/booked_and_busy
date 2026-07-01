/* Book Exchange — client logic
 * Reads books.csv (books available for exchange) and suggestions.csv
 * (community reading recommendations) and renders both. No personal data
 * is handled; only book fields are shown.
 */

// If the site is not hosted at owner.github.io/repo (e.g. a custom domain),
// set this to "owner/repo" so the contribution links resolve correctly.
const REPO_OVERRIDE = ""; // e.g. "octocat/book-exchange"

const els = {
  grid: document.getElementById("book-grid"),
  status: document.getElementById("status"),
  search: document.getElementById("search"),
  genre: document.getElementById("filter-genre"),
  language: document.getElementById("filter-language"),
  count: document.getElementById("result-count"),
  addBtn: document.getElementById("add-book-btn"),
  suggestBtn: document.getElementById("suggest-book-btn"),
  // Tabs
  tabAvailable: document.getElementById("tab-available"),
  tabSuggestions: document.getElementById("tab-suggestions"),
  tabAvailableCount: document.getElementById("tab-available-count"),
  tabSuggestionsCount: document.getElementById("tab-suggestions-count"),
  panelAvailable: document.getElementById("panel-available"),
  panelSuggestions: document.getElementById("panel-suggestions"),
  // Suggestions
  suggestionGrid: document.getElementById("suggestion-grid"),
  suggestionStatus: document.getElementById("suggestion-status"),
  suggestionSearch: document.getElementById("search-suggestions"),
  suggestionCount: document.getElementById("suggestion-count"),
};

let allBooks = [];
let allSuggestions = [];

init();

function init() {
  setupContributionLinks();
  setupTabs();
  loadBooks();
  loadSuggestions();
  els.search.addEventListener("input", render);
  els.genre.addEventListener("change", render);
  els.language.addEventListener("change", render);
  els.suggestionSearch.addEventListener("input", renderSuggestions);
}

/* Point the "Add a book" and "Suggest a book" buttons at their issue forms. */
function setupContributionLinks() {
  const repo = REPO_OVERRIDE || detectRepo();
  if (repo) {
    els.addBtn.href = `https://github.com/${repo}/issues/new?template=add-book.yml`;
    els.suggestBtn.href = `https://github.com/${repo}/issues/new?template=suggest-book.yml`;
  } else {
    // Fallback: hide the buttons rather than link somewhere wrong.
    els.addBtn.style.display = "none";
    els.suggestBtn.style.display = "none";
  }
}

function setupTabs() {
  els.tabAvailable.addEventListener("click", () => switchTab("available"));
  els.tabSuggestions.addEventListener("click", () => switchTab("suggestions"));
}

function switchTab(which) {
  const showSuggestions = which === "suggestions";
  els.panelSuggestions.hidden = !showSuggestions;
  els.panelAvailable.hidden = showSuggestions;
  els.tabSuggestions.classList.toggle("is-active", showSuggestions);
  els.tabAvailable.classList.toggle("is-active", !showSuggestions);
  els.tabSuggestions.setAttribute("aria-selected", String(showSuggestions));
  els.tabAvailable.setAttribute("aria-selected", String(!showSuggestions));
}

function detectRepo() {
  const host = window.location.hostname; // owner.github.io
  const match = host.match(/^([^.]+)\.github\.io$/i);
  if (!match) return "";
  const owner = match[1];
  // Project pages live at /repo/... ; user/org pages have empty first segment.
  const seg = window.location.pathname.split("/").filter(Boolean)[0];
  if (seg) return `${owner}/${seg}`;
  return `${owner}/${owner}.github.io`;
}

function loadBooks() {
  els.status.textContent = "Loading books…";
  Papa.parse("books.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      allBooks = (results.data || [])
        .map(normalizeBook)
        .filter((b) => b.title && b.author); // title + author are mandatory
      if (allBooks.length === 0) {
        els.status.textContent = "No books listed yet. Be the first to add one!";
      } else {
        els.status.textContent = "";
      }
      els.tabAvailableCount.textContent = allBooks.length ? `(${allBooks.length})` : "";
      populateFilters();
      render();
    },
    error: () => {
      els.status.textContent = "Sorry, the book list could not be loaded.";
    },
  });
}

function loadSuggestions() {
  els.suggestionStatus.textContent = "Loading suggestions…";
  Papa.parse("suggestions.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      allSuggestions = (results.data || [])
        .map(normalizeSuggestion)
        .filter((s) => s.title); // title is mandatory; author is optional (topics)
      els.suggestionStatus.textContent = allSuggestions.length
        ? ""
        : "No suggestions yet. Be the first to recommend a book!";
      els.tabSuggestionsCount.textContent = allSuggestions.length
        ? `(${allSuggestions.length})`
        : "";
      renderSuggestions();
    },
    error: () => {
      els.suggestionStatus.textContent = "Sorry, the suggestions could not be loaded.";
    },
  });
}

function normalizeSuggestion(row) {
  const get = (k) => (row[k] == null ? "" : String(row[k]).trim());
  return {
    title: get("title"),
    author: get("author"),
    reason: get("reason"),
    wiki: get("wiki"),
  };
}

function normalizeBook(row) {
  const get = (k) => (row[k] == null ? "" : String(row[k]).trim());
  const genre = get("genre");
  return {
    title: get("title"),
    author: get("author"),
    synopsis: get("synopsis"),
    goodreads: get("goodreads"),
    genre: genre,
    // Individual genres, so each can be its own badge and filter option.
    genreList: genre
      ? genre.split(",").map((g) => g.trim()).filter(Boolean)
      : [],
    language: get("language"),
    amazon: get("amazon"),
    wiki: get("wiki"),
  };
}

function populateFilters() {
  fillSelect(els.genre, unique(allBooks.flatMap((b) => b.genreList)));
  fillSelect(els.language, unique(allBooks.map((b) => b.language)));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function fillSelect(select, values) {
  // Keep the existing first "All …" option, replace the rest.
  const first = select.options[0];
  select.innerHTML = "";
  select.appendChild(first);
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  }
}

function render() {
  const q = els.search.value.trim().toLowerCase();
  const genre = els.genre.value;
  const language = els.language.value;

  const filtered = allBooks.filter((b) => {
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q);
    const matchesGenre = !genre || b.genreList.includes(genre);
    const matchesLang = !language || b.language === language;
    return matchesSearch && matchesGenre && matchesLang;
  });

  els.grid.innerHTML = "";
  for (const book of filtered) {
    els.grid.appendChild(renderCard(book));
  }

  if (allBooks.length > 0) {
    const n = filtered.length;
    els.count.textContent = `${n} book${n === 1 ? "" : "s"}`;
    els.status.textContent = n === 0 ? "No books match your search." : "";
  }
}

function renderCard(book) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = book.title;
  card.appendChild(title);

  const author = document.createElement("p");
  author.className = "card-author";
  author.textContent = `by ${book.author}`;
  card.appendChild(author);

  if (book.genreList.length || book.language) {
    const badges = document.createElement("div");
    badges.className = "badges";
    for (const g of book.genreList) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = g;
      badges.appendChild(b);
    }
    if (book.language) {
      const lang = document.createElement("span");
      lang.className = "badge badge-lang";
      lang.textContent = book.language;
      badges.appendChild(lang);
    }
    card.appendChild(badges);
  }

  if (book.synopsis) {
    const syn = document.createElement("p");
    syn.className = "card-synopsis";
    syn.textContent = book.synopsis;
    card.appendChild(syn);
  }

  const links = document.createElement("div");
  links.className = "card-links";

  // Goodreads: use the direct link when we have one, otherwise a search fallback
  // (some books, e.g. regional titles, have no Goodreads page).
  if (book.goodreads && isSafeUrl(book.goodreads)) {
    links.appendChild(makeLink(book.goodreads, "Goodreads", "link-goodreads"));
  } else {
    links.appendChild(
      makeLink(
        `https://www.goodreads.com/search?q=${searchQuery(book)}`,
        "Search Goodreads",
        "link-goodreads"
      )
    );
  }

  // Amazon when we have a direct product link; otherwise a Wikipedia link,
  // which is more useful than an Amazon search for books not sold there.
  if (book.amazon && isSafeUrl(book.amazon)) {
    links.appendChild(makeLink(book.amazon, "Amazon", "link-amazon"));
  } else {
    links.appendChild(wikiLink(book));
  }

  card.appendChild(links);
  return card;
}

// Wikipedia: direct page if provided, otherwise a Wikipedia search. Works for
// both books and non-book suggestions (topics, people, events).
function wikiLink(entry) {
  if (entry.wiki && isSafeUrl(entry.wiki)) {
    return makeLink(entry.wiki, "Wikipedia", "link-wiki");
  }
  return makeLink(
    `https://en.wikipedia.org/w/index.php?search=${searchQuery(entry)}`,
    "Search Wikipedia",
    "link-wiki"
  );
}

function makeLink(href, text, className) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = text;
  if (className) a.className = className;
  return a;
}

function searchQuery(book) {
  return encodeURIComponent(`${book.title} ${book.author}`.trim());
}

function isSafeUrl(url) {
  return /^https?:\/\//i.test(url);
}

function renderSuggestions() {
  const q = els.suggestionSearch.value.trim().toLowerCase();
  const filtered = allSuggestions.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.author.toLowerCase().includes(q)
  );

  els.suggestionGrid.innerHTML = "";
  for (const s of filtered) els.suggestionGrid.appendChild(renderSuggestionCard(s));

  if (allSuggestions.length > 0) {
    const n = filtered.length;
    els.suggestionCount.textContent = `${n} suggestion${n === 1 ? "" : "s"}`;
    els.suggestionStatus.textContent = n === 0 ? "No suggestions match your search." : "";
  }
}

function renderSuggestionCard(s) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = s.title;
  card.appendChild(title);

  // A suggestion with an author is a book; without one it's a topic.
  const isTopic = !s.author;
  const badges = document.createElement("div");
  badges.className = "badges";
  const typeBadge = document.createElement("span");
  typeBadge.className = isTopic ? "badge badge-topic" : "badge badge-book";
  typeBadge.textContent = isTopic ? "Topic" : "Book";
  badges.appendChild(typeBadge);
  card.appendChild(badges);

  if (s.author) {
    const author = document.createElement("p");
    author.className = "card-author";
    author.textContent = `by ${s.author}`;
    card.appendChild(author);
  }

  if (s.reason) {
    const reason = document.createElement("blockquote");
    reason.className = "card-reason";
    const label = document.createElement("span");
    label.className = "card-reason-label";
    label.textContent = "Why read this";
    reason.appendChild(label);
    const text = document.createElement("p");
    text.textContent = s.reason;
    reason.appendChild(text);
    card.appendChild(reason);
  }

  // A suggestion may be a book or a topic, so pair Goodreads (search) with a
  // Wikipedia link (direct page if provided, otherwise a Wikipedia search).
  const links = document.createElement("div");
  links.className = "card-links";
  links.appendChild(
    makeLink(
      `https://www.goodreads.com/search?q=${searchQuery(s)}`,
      "Search Goodreads",
      "link-goodreads"
    )
  );
  links.appendChild(wikiLink(s));
  card.appendChild(links);

  return card;
}
