/* Book Exchange — client logic
 * Reads books.csv, renders cards, and provides search + genre/language filters.
 * No personal data is handled; only book fields are shown.
 */

// If the site is not hosted at owner.github.io/repo (e.g. a custom domain),
// set this to "owner/repo" so the "Add a book" link resolves correctly.
const REPO_OVERRIDE = ""; // e.g. "octocat/book-exchange"

const els = {
  grid: document.getElementById("book-grid"),
  status: document.getElementById("status"),
  search: document.getElementById("search"),
  genre: document.getElementById("filter-genre"),
  language: document.getElementById("filter-language"),
  count: document.getElementById("result-count"),
  addBtn: document.getElementById("add-book-btn"),
};

let allBooks = [];

init();

function init() {
  setupAddBookLink();
  loadBooks();
  els.search.addEventListener("input", render);
  els.genre.addEventListener("change", render);
  els.language.addEventListener("change", render);
}

/* Derive the GitHub repo (owner/repo) and point the button at the issue form. */
function setupAddBookLink() {
  const repo = REPO_OVERRIDE || detectRepo();
  if (repo) {
    els.addBtn.href = `https://github.com/${repo}/issues/new?template=add-book.yml`;
  } else {
    // Fallback: hide the button rather than link somewhere wrong.
    els.addBtn.style.display = "none";
  }
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
      populateFilters();
      render();
    },
    error: () => {
      els.status.textContent = "Sorry, the book list could not be loaded.";
    },
  });
}

function normalizeBook(row) {
  const get = (k) => (row[k] == null ? "" : String(row[k]).trim());
  return {
    title: get("title"),
    author: get("author"),
    synopsis: get("synopsis"),
    goodreads: get("goodreads"),
    genre: get("genre"),
    language: get("language"),
    amazon: get("amazon"),
  };
}

function populateFilters() {
  fillSelect(els.genre, unique(allBooks.map((b) => b.genre)));
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
    const matchesGenre = !genre || b.genre === genre;
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

  const badgeValues = [book.genre, book.language].filter(Boolean);
  if (badgeValues.length) {
    const badges = document.createElement("div");
    badges.className = "badges";
    for (const val of badgeValues) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = val;
      badges.appendChild(b);
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

  // Amazon: use the direct product link when we have one, otherwise a search
  // on the India store built from title + author.
  if (book.amazon && isSafeUrl(book.amazon)) {
    links.appendChild(makeLink(book.amazon, "Amazon", "link-amazon"));
  } else {
    links.appendChild(
      makeLink(`https://www.amazon.in/s?k=${searchQuery(book)}`, "Find on Amazon", "link-amazon")
    );
  }

  card.appendChild(links);
  return card;
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
