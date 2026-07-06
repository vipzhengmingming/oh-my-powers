#!/usr/bin/env node
// wiki-export.js — Export LLM wiki to single file
// Usage: node scripts/wiki-export.js <markdown|json> [output-path]
// Env: LLM_WIKI_DIR — wiki directory path (default: ./llm-wiki)

const fs = require("fs");
const path = require("path");

const WIKI_DIR = path.resolve(process.cwd(), process.env.LLM_WIKI_DIR || "llm-wiki");
const PAGES_DIR = path.join(WIKI_DIR, "pages");

function main() {
  const format = (process.argv[2] || "markdown").toLowerCase();
  const outputPath = process.argv[3];

  if (!fs.existsSync(PAGES_DIR)) {
    console.error("No wiki found at ./llm-wiki/pages/");
    process.exit(1);
  }

  const index = fs.existsSync(path.join(WIKI_DIR, "index.md"))
    ? fs.readFileSync(path.join(WIKI_DIR, "index.md"), "utf-8")
    : "";

  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".md")).sort();
  const pages = files.map(f => ({
    file: f,
    content: fs.readFileSync(path.join(PAGES_DIR, f), "utf-8")
  }));

  if (format === "json") {
    const output = JSON.stringify({ index, pages }, null, 2);
    if (outputPath) {
      fs.writeFileSync(path.resolve(outputPath), output, "utf-8");
      console.log(`Exported to ${outputPath}`);
    } else {
      console.log(output);
    }
  } else {
    // Default: merge into single markdown
    let merged = "# Wiki Export\n\n";
    merged += `_Exported on ${new Date().toISOString().slice(0, 10)}_\n\n---\n\n`;
    merged += "## Index\n\n" + index + "\n\n---\n\n";
    for (const p of pages) {
      const title = p.file.replace(/\.md$/, "");
      merged += `## ${title}\n\n${p.content}\n\n---\n\n`;
    }
    if (outputPath) {
      fs.writeFileSync(path.resolve(outputPath), merged, "utf-8");
      console.log(`Exported to ${outputPath}`);
    } else {
      console.log(merged);
    }
  }
}

main();
