# 📚 Book Exchange

A simple, static GitHub Pages site with two tabs:

- **Available for exchange** — **hardcopy books someone owns** and is willing to swap.
- **Suggested reads** — books the community **recommends reading** (not necessarily owned), each with a short note on *why* it's worth reading.

It shows only book details — **no personal or owner information** is ever collected or displayed.

Each available book shows its **title**, **author**, an optional **synopsis**, **genre**, **language**, and links to explore it further on **Goodreads** and **Amazon**. Each suggestion shows the **title**, **author**, and the recommender's **reason**, plus Goodreads/Amazon search links.

## How it works

- The site is plain HTML/CSS/JS. It reads available books from [`books.csv`](books.csv) and community suggestions from [`suggestions.csv`](suggestions.csv), rendering each as cards.
- Visitors can **search** by title/author (and, on the Available tab, **filter** by genre and language).
- Each card links out to **Goodreads** and **Amazon** (see below).
- Anyone can **add a book** (something they own) or **suggest a book** (a recommendation) through structured forms. Each automatically opens a Pull Request, and the entry only appears **after a maintainer merges that PR**.

### Book links

Every card shows two outbound links, both generated in the browser so there is nothing to maintain and any newly-added book gets them automatically:

- **Goodreads** — uses the direct Goodreads page when the `goodreads` column has a URL (`View on Goodreads →`); otherwise falls back to a Goodreads search built from the title + author (`Search Goodreads →`), so books without a Goodreads page are still linked.
- **Amazon** — uses the direct amazon.in product page when the `amazon` column has a URL (`Amazon`); otherwise falls back to an amazon.in search built from the title + author (`Find on Amazon →`).

```
Visitor      → opens site → books.csv / suggestions.csv rendered as cards
Contributor  → "Add a book" or "Suggest a book" form → Action appends a row → opens a PR
Maintainer   → merges PR → CSV updated → site shows the new entry
```

## Adding a book (something you own)

1. Click **"+ Add a book"** on the site (or open a new issue using the **📚 Add a book** template).
2. Fill in the form. **Title** and **Author** are required; synopsis, Goodreads link, Amazon link, genre, and language are optional.
3. Submit. A GitHub Action appends a properly-escaped row to `books.csv` and opens a Pull Request that closes your issue.
4. A maintainer reviews and merges the PR — the book then appears on the **Available for exchange** tab.

Book columns: `title,author,synopsis,goodreads,genre,language,amazon`.

## Suggesting a book (a recommendation)

1. Click **"💡 Suggest a book"** on the site (or open a new issue using the **💡 Suggest a book** template).
2. Fill in the form. **Title**, **Author**, and **Why you recommend it** are all required.
3. Submit. A GitHub Action appends a row to `suggestions.csv` and opens a Pull Request that closes your issue.
4. A maintainer reviews and merges the PR — the suggestion then appears on the **Suggested reads** tab.

Suggestion columns: `title,author,reason`.

## Maintainer setup (one-time)

After pushing this repository to GitHub:

1. **Enable GitHub Pages** — Settings → **Pages** → *Build and deployment* → **Deploy from a branch** → Branch **`main`**, folder **`/ (root)`**. Save.
2. **Allow Actions to open PRs** — Settings → **Actions** → **General** → *Workflow permissions* → enable **"Allow GitHub Actions to create and approve pull requests"**. Save.
3. If your site is served from a **custom domain** (not `owner.github.io/repo`), set `REPO_OVERRIDE = "owner/repo"` at the top of [`app.js`](app.js) so the contribution buttons link to the right repository.

That's it — the issue forms and the auto-PR workflows are already included under `.github/`.

## Project structure

```
index.html                         # Page layout (Available + Suggested tabs)
styles.css                         # Styling (responsive card grid)
app.js                             # Loads both CSVs, search + filters + tabs
books.csv                          # Books available for exchange
suggestions.csv                    # Community reading suggestions
.nojekyll                          # Serve files as-is on GitHub Pages
.github/
  ISSUE_TEMPLATE/add-book.yml      # "Add a book" issue form
  ISSUE_TEMPLATE/suggest-book.yml  # "Suggest a book" issue form
  workflows/add-book.yml           # Add-book issue → PR automation
  workflows/suggest-book.yml       # Suggest-book issue → PR automation
  scripts/append-book.js           # Appends a CSV row (used by both flows)
```

## Running locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```
