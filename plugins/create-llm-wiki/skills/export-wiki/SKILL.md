---
description: >-
  Export the project's LLM wiki to a single file. Use when the user says
  "export wiki", "导出", "备份知识库", or runs
  /create-llm-wiki:export-wiki [format] [output-path].
name: export-wiki
argument-hint: [markdown|json] [output-path]
---

# Export Wiki

Export the entire LLM wiki to a single portable file.

## Formats

| Format | File Extension | Content |
|--------|---------------|---------|
| `markdown` (default) | `.md` | All pages merged into one markdown file, with index at top |
| `json` | `.json` | Structured JSON: `{ index, pages: [{ file, content }] }` |

## Steps

1. Ask user for format if not specified. Default to `markdown`.

2. Ask user for output path. Default to `./llm-wiki-export.md` (or `.json`).

3. Run the export script:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/wiki-export.js <format> <output-path>
   ```

4. Confirm the file was created with file size.

5. If the user wants to export to Obsidian-compatible format, remind them the wiki already uses `[[wikilinks]]` — they can just open the `./llm-wiki/` folder directly in Obsidian.
