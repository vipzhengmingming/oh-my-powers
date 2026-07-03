---
description: >-
  Search the project's LLM wiki for relevant pages. Use when the user says
  "search wiki", "查找", "搜索", "找一下", or runs
  /create-llm-wiki:search-wiki <query>.
name: search-wiki
argument-hint: <query>
---

# Search Wiki

Search the project's LLM wiki for relevant pages with ranked results.

## Steps

1. Run the search script: `${CLAUDE_PLUGIN_ROOT}/scripts/wiki-search.js <query>`
   - Replace `<query>` with the user's search terms
   - The script returns JSON with `[{ file, title, score, excerpt }]`

2. Read the results. If results found, present them as a ranked list:
   - Show title, relevance score, and excerpt for each result
   - Offer to read the full page content

3. If no results found, suggest the user:
   - Try different search terms
   - Or add content with `/create-llm-wiki:add-to-wiki`

4. If the user picks a result, read `./llm-wiki/pages/<file>` and answer their question based on it.

## Example

User: "搜索一下数据库设计"
You: Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/wiki-search.js 数据库设计`
→ Show results, ask if they want to drill in.
