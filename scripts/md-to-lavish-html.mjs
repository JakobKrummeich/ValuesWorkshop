#!/usr/bin/env node
// Render a markdown design doc into a Lavish review artifact:
// DaisyUI shell + GFM tables + mermaid fences rendered as diagrams.
// Usage: node scripts/md-to-lavish-html.mjs <input.md> <output.html> <template.html>
// The template supplies everything before the rendered body (head, intro alert)
// and everything after it (approval footer, mermaid runtime). Body boundaries in
// the template are the markers below.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const BODY_START = "<!-- markdown-body:start -->";
const BODY_END = "<!-- markdown-body:end -->";

const require = createRequire(import.meta.url);
const MarkdownIt = require("markdown-it");

const [inputPath, outputPath, templatePath] = process.argv.slice(2);
if (!inputPath || !outputPath || !templatePath) {
  console.error("usage: md-to-lavish-html.mjs <input.md> <output.html> <template.html>");
  process.exit(1);
}

const markdownIt = new MarkdownIt({ html: false, linkify: true, typographer: false });

const mermaidBlocks = [];
markdownIt.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index];
  const language = token.info.trim().split(/\s+/)[0];
  if (language === "mermaid") {
    mermaidBlocks.push(token.content);
    return `<pre class="mermaid my-6 rounded-box border border-base-300 bg-base-100 p-4">${markdownIt.utils.escapeHtml(token.content)}</pre>\n`;
  }
  return `<pre class="rounded-box bg-base-300 p-4 overflow-x-auto text-sm my-4"><code>${markdownIt.utils.escapeHtml(token.content)}</code></pre>\n`;
};

const classesByTag = {
  h1: "text-4xl font-bold mt-2 mb-4",
  h2: "text-2xl font-bold mt-10 mb-3 pb-1 border-b border-base-300",
  h3: "text-xl font-semibold mt-6 mb-2",
  h4: "text-lg font-semibold mt-4 mb-2",
  p: "my-3 leading-relaxed",
  ul: "list-disc pl-6 space-y-1 my-3",
  ol: "list-decimal pl-6 space-y-1 my-3",
  blockquote: "border-l-4 border-primary pl-4 italic my-4 opacity-80",
  table: "table table-zebra table-sm my-4",
};

for (const [tag, classes] of Object.entries(classesByTag)) {
  markdownIt.renderer.rules[`${tag}_open`] = (tokens, index, options, env, self) => {
    tokens[index].attrJoin("class", classes);
    return self.renderToken(tokens, index, options);
  };
}

const tableOpen = markdownIt.renderer.rules.table_open;
markdownIt.renderer.rules.table_open = (tokens, index, options, env, self) =>
  `<div class="overflow-x-auto my-4">${tableOpen(tokens, index, options, env, self)}`;
markdownIt.renderer.rules.table_close = (tokens, index, options, env, self) =>
  `${self.renderToken(tokens, index, options)}</div>`;

const body = markdownIt.render(readFileSync(inputPath, "utf8"));
const template = readFileSync(templatePath, "utf8");
const startIndex = template.indexOf(BODY_START);
const endIndex = template.indexOf(BODY_END);
if (startIndex < 0 || endIndex < 0) {
  console.error(`template ${templatePath} is missing ${BODY_START} / ${BODY_END} markers`);
  process.exit(1);
}

const output =
  template.slice(0, startIndex + BODY_START.length) + "\n" + body + template.slice(endIndex);
writeFileSync(outputPath, output);
console.error(`wrote ${outputPath} (${mermaidBlocks.length} mermaid diagrams)`);
