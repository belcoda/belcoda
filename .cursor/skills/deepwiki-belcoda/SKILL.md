---
name: deepwiki-belcoda
description: Fetches Belcoda documentation from DeepWiki via the DeepWiki MCP for belcoda/belcoda. Use when the user asks about DeepWiki, indexed repo documentation, architecture overviews, or wiki-style answers grounded in the GitHub-indexed codebase (complement to local AGENTS.md and source).
---

# DeepWiki Belcoda (MCP)

## When to use

- Questions about **architecture, domains, or flows** where an indexed, narrative doc may help.
- The user mentions **DeepWiki**, **deepwiki.com/belcoda/belcoda**, or wants **wiki-style** context.
- **Cross-cutting** topics (deployment, auth, Zero, jobs) where local search would be noisy.

Prefer **reading the codebase** for exact APIs, types, and line-level behavior. Use DeepWiki for orientation and narrative; verify critical details in-repo.

## Default repository

| Field       | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| `repoName`  | `belcoda/belcoda`                                                    |
| Public wiki | [deepwiki.com/belcoda/belcoda](https://deepwiki.com/belcoda/belcoda) |

If the user names another repo, use that `owner/repo` instead.

## MCP server and tools

**Server:** `user-DeepWiki`

Before calling any tool, read its schema under the MCP descriptors (e.g. `mcps/user-DeepWiki/tools/<tool>.json`).

| Tool                  | Purpose                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| `read_wiki_structure` | List documentation topics / table of contents for `repoName`.                    |
| `read_wiki_contents`  | Full wiki documentation body for `repoName` (large; use when breadth is needed). |
| `ask_question`        | Targeted Q&A: `repoName` (string or array of up to 10 repos) + `question`.       |

## Suggested workflow

1. **Explore** — Call `read_wiki_structure` with `repoName: "belcoda/belcoda"` to see sections and pick scope.
2. **Deep read** — Use `read_wiki_contents` when the user needs the full doc or several related sections in one pass.
3. **Narrow question** — Use `ask_question` with a clear, specific `question` when a single answer is enough (faster than ingesting the entire wiki).

## Response hygiene

- Cite the wiki as **DeepWiki (indexed documentation)** when summarizing; link [Belcoda on DeepWiki](https://deepwiki.com/belcoda/belcoda) if helpful.
- DeepWiki content can lag the repo; flag **uncertainty** and confirm in `AGENTS.md`, `src/`, or generated artifacts when the user needs current truth.

## Examples

**User:** “What does DeepWiki say about Zero and mutators?”

1. `read_wiki_structure` → locate Zero / mutation sections.
2. Either `ask_question` with a precise question, or `read_wiki_contents` and extract the relevant parts.

**User:** “Summarize deployment from the wiki”

1. `ask_question` with `question` focused on deployment/CI/CD, or skim structure then pull the matching sections from `read_wiki_contents`.
