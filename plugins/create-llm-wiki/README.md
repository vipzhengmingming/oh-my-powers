# create-llm-wiki

LLM-maintained knowledge base for your project — part of the [oh-my-powers](https://github.com/vipzhengmingming/oh-my-powers) marketplace.

Inspired by the [LLM Wiki pattern](https://github.com/...), this plugin lets you build a persistent, interlinked knowledge base incrementally as you work.

## Commands

| Command | Description |
|---------|-------------|
| `/create-llm-wiki:init-wiki` | Initialize a new wiki in `./llm-wiki/` |
| `/create-llm-wiki:add-to-wiki <path>` | Add a file or Q&A content to the wiki (auto-lint after write) |
| `/create-llm-wiki:graph-wiki [html\|obsidian]` | Generate a visual relationship graph |
| `/create-llm-wiki:search-wiki <query>` | Search wiki pages with ranked results |
| `/create-llm-wiki:export-wiki [format] [path]` | Export wiki to a single file (markdown/json) |

## Agents

- **wiki-grapher** — Generates graphs, batch imports, performs health checks, searches wiki, and exports

## Usage

```bash
# Add the marketplace
/plugin marketplace add vipzhengmingming/oh-my-powers

# Install the plugin
/plugin install create-llm-wiki@oh-my-powers

# Initialize a wiki
/create-llm-wiki:init-wiki

# Add content
/create-llm-wiki:add-to-wiki ./docs/architecture.md

# Generate graph
# Just say "生成图谱" or "graph the wiki"
```

## Structure

```
llm-wiki/
├── sources/       # Original documents (immutable)
├── pages/         # Wiki pages (LLM-maintained)
├── index.md       # Content catalog
├── log.md         # Change history
└── graph.html     # Interactive knowledge graph
```
