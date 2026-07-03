---
description: >-
  Add content to the project's LLM wiki. Handles both file ingestion and Q&A-based
  knowledge extraction. Use when the user says "add to wiki", "把这篇加进知识库",
  /create-llm-wiki:add-to-wiki <path>, or discusses a topic they want persisted.
name: add-to-wiki
argument-hint: [file-path-or-topic]
---

# Add to Wiki

Add content to the project's LLM-maintained wiki. Supports two modes: file ingestion and Q&A distillation.

Reference: `references/llm-wiki.md` for the full architectural rules, ingest and query operations.

## Preliminary Steps

1. Read `references/llm-wiki.md` to understand the ingest and query operations.

2. Check that the wiki exists (`./llm-wiki/index.md`). If it doesn't, suggest the user run `/create-llm-wiki:init-wiki` first.

3. Read `./llm-wiki/index.md` to understand the current wiki state — what pages exist, what categories are used.

## Mode 1: File Ingestion

When the user provides a file path:

1. Read the file contents.
2. Identify the key information, entities, and concepts.
3. Check `index.md` to see if related pages already exist.
   - If yes: update existing pages with new information, adding cross-references.
   - If no: create a new page in `./llm-wiki/pages/`.
4. Write the page in markdown with consistent formatting.
5. Update `index.md` — add entry under the appropriate category section.
6. Append to `log.md` with format: `## [YYYY-MM-DD] ingest | <page-name> — <summary>`

## Mode 2: Q&A Distillation

When the user discusses a topic they want captured:

1. Review the recent conversation context to extract the key knowledge.
2. Ask the user for a page title if it's not clear from context.
3. Follow the same update/create flow as file ingestion (steps 3-6 above).
4. Confirm what was written and ask if they want to add more.

## Post-Add Lint (Active Orchestration)

After writing content, automatically run these checks in order:

1. **Orphan check** — Scan if the new page has inbound `[[wikilinks]]` from any existing page. If not, update related pages to link to it.

2. **Backlink sync** — For every `[[target]]` the new page references, check the target page also has a return link. Add if missing.

3. **Gap detection** — Scan the new page for capitalized proper nouns or recurring concepts that don't have a wiki page yet. Suggest: "这个概念「XXX」还没有独立页面，要建一个吗？"

4. **Index validation** — Confirm `index.md` categories still make sense. If a category has more than 8 entries, suggest splitting it.

5. **Summary report** — Show a one-line summary of what was checked and any actions taken.

## General Rules

- Use `[[page-name]]` Obsidian-compatible wikilinks when cross-referencing.
- Each wiki page should have a clear title, a brief summary, and structured content.
- `index.md` entries follow this format: `- [[page-name]] — One-line summary`
- Log entries use the prefix format shown above (grep-parseable).
- Never delete user content. Deprecate old pages by adding a note at the top.
