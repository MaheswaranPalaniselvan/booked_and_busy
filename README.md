# 📚 Book Exchange

A simple, static GitHub Pages site that lists **hardcopy books available for exchange**. It shows only book details — **no personal or owner information** is ever collected or displayed.

Each book shows its **title**, **author**, an optional **synopsis**, **genre**, **language**, and links to explore it further on **Goodreads** and **Amazon**.

## How it works

- The site is plain HTML/CSS/JS. It reads all books from [`books.csv`](books.csv) and renders them as searchable, filterable cards.
- Visitors can **search** by title/author and **filter** by genre and language.
- Each card links out to **Goodreads** and **Amazon** (see below).
- Anyone can **propose a new book** through a structured form. This automatically opens a Pull Request. A book only appears on the site **after a maintainer merges that PR**.

### Book links

Every card shows two outbound links, both generated in the browser so there is nothing to maintain and any newly-added book gets them automatically:

- **Goodreads** — uses the direct Goodreads page when the `goodreads` column has a URL (`View on Goodreads →`); otherwise falls back to a Goodreads search built from the title + author (`Search Goodreads →`), so books without a Goodreads page are still linked.
- **Amazon** — uses the direct amazon.in product page when the `amazon` column has a URL (`Amazon`); otherwise falls back to an amazon.in search built from the title + author (`Find on Amazon →`).

```
Visitor      → opens site → books.csv rendered as cards (search + filter)
Contributor  → "Add a book" form → GitHub Action appends a row → opens a PR
Maintainer   → merges PR → books.csv updated → site shows the new book
```

## Adding a book

1. Click **"+ Add a book"** on the site (or open a new issue using the **📚 Add a book** template).
2. Fill in the form. **Title** and **Author** are required; synopsis, Goodreads link, Amazon link, genre, and language are optional.
3. Submit. A GitHub Action parses your submission, appends a properly-escaped row to `books.csv`, and opens a Pull Request that closes your issue.
4. A maintainer reviews and merges the PR — the book then appears on the site.

The data columns are: `title,author,synopsis,goodreads,genre,language,amazon`.

## Maintainer setup (one-time)

After pushing this repository to GitHub:

1. **Enable GitHub Pages** — Settings → **Pages** → *Build and deployment* → **Deploy from a branch** → Branch **`main`**, folder **`/ (root)`**. Save.
2. **Allow Actions to open PRs** — Settings → **Actions** → **General** → *Workflow permissions* → enable **"Allow GitHub Actions to create and approve pull requests"**. Save.
3. If your site is served from a **custom domain** (not `owner.github.io/repo`), set `REPO_OVERRIDE = "owner/repo"` at the top of [`app.js`](app.js) so the "Add a book" button links to the right repository.

That's it — the issue form and the auto-PR workflow are already included under `.github/`.

## Project structure

```
index.html                         # Page layout
styles.css                         # Styling (responsive card grid)
app.js                             # Loads books.csv, search + filters
books.csv                          # The book data (source of truth)
.nojekyll                          # Serve files as-is on GitHub Pages
.github/
  ISSUE_TEMPLATE/add-book.yml      # "Add a book" issue form
  workflows/add-book.yml           # Issue → PR automation
  scripts/append-book.js           # Appends a CSV row from the parsed issue
```

## Running locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```
